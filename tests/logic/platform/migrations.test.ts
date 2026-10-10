// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'platform-migration-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../../database/main/migrations',
    ),
  },
];

describeMigration('202610100301_create_platform_tables', {
  sources,
  up: async ({ connection, expectCollection }) => {
    const days = await expectCollection('calendarDays').toExist();
    expect(Object.keys(days.fields)).toEqual([
      'id',
      'date',
      'kind',
      'note',
      'updatedAt',
    ]);
    await expectCollection('calendarDays').toHaveIndex(['date'], {
      unique: true,
    });

    const dictionaries = await expectCollection('dictionaries').toExist();
    expect(Object.keys(dictionaries.fields)).toEqual([
      'id',
      'type',
      'code',
      'label',
      'sortOrder',
      'active',
      'extra',
      'createdAt',
      'updatedAt',
    ]);
    await expectCollection('dictionaries').toHaveIndex(['type', 'code'], {
      unique: true,
    });

    const sequences = await expectCollection('sequences').toExist();
    expect(Object.keys(sequences.fields)).toEqual([
      'id',
      'prefix',
      'period',
      'next',
    ]);
    await expectCollection('sequences').toHaveIndex(['prefix', 'period'], {
      unique: true,
    });

    const rules = await expectCollection('approvalRules').toExist();
    expect(Object.keys(rules.fields)).toEqual([
      'id',
      'key',
      'value',
      'effectiveFrom',
      'updatedBy',
      'note',
      'createdAt',
    ]);
    await expectCollection('approvalRules').toHaveIndex(
      ['key', 'effectiveFrom'],
      { unique: true },
    );

    // The unique constraints hold.
    await connection.query
      .insertInto('sequences')
      .values({ prefix: 'LV', period: '202610', next: 1 })
      .execute();
    await expect(
      connection.query
        .insertInto('sequences')
        .values({ prefix: 'LV', period: '202610', next: 1 })
        .execute(),
    ).rejects.toThrow();
    await connection.query
      .insertInto('calendarDays')
      .values({ date: '2026-10-01', kind: 'holiday', updatedAt: new Date() })
      .execute();
    await expect(
      connection.query
        .insertInto('calendarDays')
        .values({ date: '2026-10-01', kind: 'workday', updatedAt: new Date() })
        .execute(),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'calendarDays',
      'dictionaries',
      'sequences',
      'approvalRules',
    ])
      await expectCollection(name).not.toExist();
  },
});
