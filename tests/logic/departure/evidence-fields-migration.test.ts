// @vitest-environment node
import { copyFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createMigrator, databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';

it.each([false, true])(
  'adds missing departure evidence fields and preserves existing facts (already present: %s)',
  async (present) => {
    const testDb = await createTestDatabase();
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'departure-repair-'),
    );
    try {
      await symlink(
        path.resolve(import.meta.dirname, '../../../node_modules'),
        path.join(directory, 'node_modules'),
        'dir',
      );
      await testDb.connection.builder.createCollection(
        'departureRequests',
        (c) => {
          c.string('id').primary();
          c.string('status', { nullable: false });
          c.text('reason', { nullable: false });
          if (present) {
            c.string('settlementDate', { length: 10, nullable: true });
            c.text('settlementNote', { nullable: true });
            c.text('cancellationReason', { nullable: true });
          }
        },
      );
      const facts = {
        settlementDate: '2026-10-11',
        settlementNote: 'Existing settlement',
        cancellationReason: 'Existing cancellation',
      };
      await testDb.database.repository('departureRequests').createOne({
        values: {
          id: 'existing',
          status: 'draft',
          reason: 'Existing reason',
          ...(present ? facts : {}),
        },
      });
      const migration = '202610110007_complete_departure_evidence_fields.ts';
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
        sources: [{ packageName: 'departure-repair-test', directory }],
      });
      await migrator.latest();
      await migrator.latest();
      const repo = testDb.database.repository('departureRequests');
      expect(await repo.findOne({ filter: { id: 'existing' } })).toMatchObject({
        reason: 'Existing reason',
        status: 'draft',
        ...(present
          ? facts
          : {
              settlementDate: null,
              settlementNote: null,
              cancellationReason: null,
            }),
      });
      await repo.createOne({
        values: {
          id: 'new',
          status: 'draft',
          reason: 'Draft',
          settlementDate: null,
          settlementNote: null,
          cancellationReason: null,
        },
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
