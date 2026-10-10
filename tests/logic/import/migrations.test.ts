// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'import-migration-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../../database/main/migrations',
    ),
  },
];

describeMigration('202610100501_create_import_tables', {
  sources,
  up: async ({ connection, expectCollection }) => {
    const files = await expectCollection('importFiles').toExist();
    expect(Object.keys(files.fields)).toEqual([
      'id',
      'disk',
      'key',
      'filename',
      'ext',
      'mimeType',
      'size',
      'createdAt',
      'updatedAt',
    ]);
    expect(files.primaryKey).toEqual(['id']);
    const runs = await expectCollection('importRuns').toExist();
    expect(Object.keys(runs.fields)).toEqual([
      'id',
      'kind',
      'status',
      'fileId',
      'filename',
      'actorId',
      'rowCount',
      'createdCount',
      'updatedCount',
      'unchangedCount',
      'errorCount',
      'errors',
      'createdAt',
      'finishedAt',
    ]);
    await expectCollection('importRuns').toHaveIndex(['createdAt'], {
      unique: false,
    });
    const now = new Date();
    await connection.query
      .insertInto('importRuns')
      .values({
        id: 'r1',
        kind: 'departments',
        status: 'succeeded',
        filename: 'a.xlsx',
        createdAt: now,
        finishedAt: now,
      })
      .execute();
    const row = await connection.query
      .selectFrom('importRuns')
      .select(['rowCount', 'errorCount', 'fileId'])
      .where('id', '=', 'r1')
      .executeTakeFirstOrThrow();
    expect(Number(row.rowCount)).toBe(0);
    expect(Number(row.errorCount)).toBe(0);
    expect(row.fileId).toBeNull();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('importRuns').not.toExist();
    await expectCollection('importFiles').not.toExist();
  },
});
