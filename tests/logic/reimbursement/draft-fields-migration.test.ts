// @vitest-environment node
import { copyFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createMigrator, databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';

it.each(['missing', 'present', 'partial', 'submitted'] as const)(
  'reconciles reimbursement draft fields without losing facts (%s)',
  async (mode) => {
    const testDb = await createTestDatabase();
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'reimbursement-repair-'),
    );
    try {
      await symlink(
        path.resolve(import.meta.dirname, '../../../node_modules'),
        path.join(directory, 'node_modules'),
        'dir',
      );
      await testDb.connection.builder.createCollection(
        'reimbursementRequests',
        (c) => {
          c.string('id').primary();
          c.string('status', { nullable: false });
          c.text('reason', { nullable: false });
          if (mode === 'present') {
            c.bigInt('lastSubmittedTotalCents', { nullable: true });
            c.json('financeCorrectionLines', {
              nullable: false,
              defaultValue: [],
            });
            c.boolean('bindingCaptured', {
              nullable: false,
              defaultValue: false,
            });
            c.string('boundAuthorizationId', { length: 64, nullable: true });
            c.string('boundLoanId', { length: 64, nullable: true });
            c.bigInt('debtHeldCents', { nullable: false, defaultValue: 0 });
            c.boolean('debtHoldRecorded', {
              nullable: false,
              defaultValue: false,
            });
          } else if (mode === 'partial') {
            c.bigInt('lastSubmittedTotalCents', { nullable: true });
          }
        },
      );
      const defaults = {
        lastSubmittedTotalCents: null,
        financeCorrectionLines: [],
        bindingCaptured: false,
        boundAuthorizationId: null,
        boundLoanId: null,
        debtHeldCents: '0',
        debtHoldRecorded: false,
      };
      const facts = {
        lastSubmittedTotalCents: '100',
        financeCorrectionLines: [{ id: 'line', amountCents: 100 }],
        bindingCaptured: true,
        boundAuthorizationId: 'authorization',
        boundLoanId: 'loan',
        debtHeldCents: '50',
        debtHoldRecorded: true,
      };
      await testDb.database.repository('reimbursementRequests').createOne({
        values: {
          id: 'existing',
          status: mode === 'submitted' ? 'manager' : 'draft',
          reason: 'Existing reason',
          ...(mode === 'present'
            ? facts
            : mode === 'partial'
              ? { lastSubmittedTotalCents: '100' }
              : {}),
        },
      });
      const migration = '202610110008_complete_reimbursement_draft_fields.ts';
      await copyFile(
        path.resolve(
          import.meta.dirname,
          '../../../database/main/migrations',
          migration,
        ),
        path.join(directory, migration),
      );
      const container = new ServiceContainer();
      container.instance(databaseManagerToken, testDb.database);
      const migrator = createMigrator({
        database: testDb.database,
        container,
        sources: [{ packageName: 'reimbursement-repair-test', directory }],
      });
      const repo = testDb.database.repository('reimbursementRequests');
      if (mode === 'submitted') {
        await expect(migrator.latest()).rejects.toThrow();
        expect(
          await repo.findOne({ filter: { id: 'existing' } }),
        ).toMatchObject({ status: 'manager', reason: 'Existing reason' });
        await expect(
          repo.createOne({
            values: {
              id: 'blocked',
              status: 'draft',
              reason: 'Draft',
              ...defaults,
            },
          }),
        ).rejects.toMatchObject({ code: 'FIELD_NOT_FOUND' });
        return;
      }
      await migrator.latest();
      await migrator.latest();
      expect(await repo.findOne({ filter: { id: 'existing' } })).toMatchObject({
        reason: 'Existing reason',
        status: 'draft',
        ...(mode === 'present'
          ? facts
          : {
              ...defaults,
              ...(mode === 'partial' ? { lastSubmittedTotalCents: '100' } : {}),
            }),
      });
      await repo.createOne({
        values: { id: 'new', status: 'draft', reason: 'Draft', ...defaults },
      });
      await repo.updateOne({ filter: { id: 'new' }, values: facts });
      expect(await repo.findOne({ filter: { id: 'new' } })).toMatchObject(
        facts,
      );
    } finally {
      await testDb.destroy();
      await rm(directory, { recursive: true, force: true });
    }
  },
);
