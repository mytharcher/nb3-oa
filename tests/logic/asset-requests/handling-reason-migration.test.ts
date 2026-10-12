// @vitest-environment node
import { copyFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createMigrator, databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';

it.each([false, true])(
  'reconciles handling reason while preserving records (already present: %s)',
  async (present) => {
    const testDb = await createTestDatabase();
    const directory = await mkdtemp(path.join(os.tmpdir(), 'asset-repair-'));
    try {
      await symlink(
        path.resolve(import.meta.dirname, '../../../node_modules'),
        path.join(directory, 'node_modules'),
        'dir',
      );
      await testDb.connection.builder.createCollection('assetRequests', (c) => {
        c.string('id').primary();
        c.text('purpose');
        c.datetimeTz('updatedAt');
        if (present) c.datetimeTz('statusChangedAt');
        if (present) c.text('handlingReason', { nullable: true });
      });
      await testDb.database.repository('assetRequests').createOne({
        values: {
          id: 'existing',
          purpose: 'Preserve this request',
          updatedAt: new Date('2026-10-10T12:00:00Z'),
          ...(present
            ? { statusChangedAt: new Date('2026-10-09T12:00:00Z') }
            : {}),
          ...(present ? { handlingReason: 'Existing evidence' } : {}),
        },
      });
      await copyFile(
        path.resolve(
          import.meta.dirname,
          '../../../database/main/migrations/202610110001_complete_asset_request_handling_reason.ts',
        ),
        path.join(
          directory,
          '202610110001_complete_asset_request_handling_reason.ts',
        ),
      );
      await copyFile(
        path.resolve(
          import.meta.dirname,
          '../../../database/main/migrations/202610110002_complete_asset_request_status_timestamp.ts',
        ),
        path.join(
          directory,
          '202610110002_complete_asset_request_status_timestamp.ts',
        ),
      );
      const container = new ServiceContainer();
      container.instance(databaseManagerToken, testDb.database);
      const migrator = createMigrator({
        database: testDb.database,
        container,
        sources: [{ packageName: 'asset-repair-test', directory }],
      });
      await migrator.latest();
      await migrator.latest();
      const record = await testDb.database
        .repository('assetRequests')
        .withPolicy({
          read: {
            fields: ['id', 'purpose', 'handlingReason', 'statusChangedAt'],
            scope: (f) => f.string('id').eq('existing'),
          },
          create: false,
          update: false,
          delete: false,
        })
        .findOne({ filter: { id: 'existing' } });
      expect(record).toMatchObject({
        id: 'existing',
        purpose: 'Preserve this request',
        handlingReason: present ? 'Existing evidence' : null,
      });
      expect(new Date(record!.statusChangedAt as string).toISOString()).toBe(
        present ? '2026-10-09T12:00:00.000Z' : '2026-10-10T12:00:00.000Z',
      );
    } finally {
      await testDb.destroy();
      await rm(directory, { recursive: true, force: true });
    }
  },
);
