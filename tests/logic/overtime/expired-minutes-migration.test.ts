// @vitest-environment node
import { copyFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createMigrator, databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';

it.each([false, true])(
  'reconciles expired minutes without losing source facts (already present: %s)',
  async (present) => {
    const testDb = await createTestDatabase();
    const directory = await mkdtemp(path.join(os.tmpdir(), 'overtime-repair-'));
    try {
      await symlink(
        path.resolve(import.meta.dirname, '../../../node_modules'),
        path.join(directory, 'node_modules'),
        'dir',
      );
      await testDb.connection.builder.createCollection(
        'overtimeMinuteLots',
        (c) => {
          c.string('id').primary();
          c.integer('originalMinutes', { nullable: false });
          c.integer('remainingMinutes', { nullable: false });
          if (present)
            c.integer('expiredMinutes', { nullable: false, defaultValue: 0 });
        },
      );
      await testDb.database.repository('overtimeMinuteLots').createOne({
        values: {
          id: 'existing',
          originalMinutes: 300,
          remainingMinutes: 60,
          ...(present ? { expiredMinutes: 15 } : {}),
        },
      });
      const migration = '202610110003_complete_overtime_expired_minutes.ts';
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
        sources: [{ packageName: 'overtime-repair-test', directory }],
      });
      await migrator.latest();
      await migrator.latest();
      const repository = testDb.database.repository('overtimeMinuteLots');
      expect(
        await repository.findOne({ filter: { id: 'existing' } }),
      ).toMatchObject({
        originalMinutes: 300,
        remainingMinutes: 60,
        expiredMinutes: present ? 15 : 0,
      });
      await repository.createOne({
        values: {
          id: 'new',
          originalMinutes: 120,
          remainingMinutes: 120,
          expiredMinutes: 0,
        },
      });
      await repository.updateOne({
        filter: { id: 'new' },
        values: { remainingMinutes: 0, expiredMinutes: 120 },
      });
      expect(await repository.findOne({ filter: { id: 'new' } })).toMatchObject(
        { originalMinutes: 120, remainingMinutes: 0, expiredMinutes: 120 },
      );
    } finally {
      await testDb.destroy();
      await rm(directory, { recursive: true, force: true });
    }
  },
);
