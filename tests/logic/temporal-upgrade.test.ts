// @vitest-environment node
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import {
  describeMigration,
  verifyMigration,
} from '@nocobase/app-testing/server';
import { writeTaskSummary } from '../../server/providers/task-center/summary.js';
import type { Knex } from 'knex';

const sources = [
  {
    packageName: 'oa-temporal-upgrade-test',
    directory: path.resolve(
      import.meta.dirname,
      '../fixtures/temporal-upgrade',
    ),
  },
];
afterEach(() => vi.unstubAllEnvs());

it('refuses populated legacy timestamps without a verified historical zone', async () => {
  vi.stubEnv('OA_LEGACY_TIMESTAMP_TIME_ZONE', '');
  await expect(
    verifyMigration('202610230001_use_timezone_aware_instants', {
      sources,
      reversible: false,
      async before({ connection }) {
        await connection.repository('vendorQualifications').createOne({
          values: {
            id: 'existing',
            createdAt: '2026-07-15T09:30:00.123',
            statusChangedAt: '2026-07-15T09:30:00.123',
          },
        });
      },
    }),
  ).rejects.toThrow('Set OA_LEGACY_TIMESTAMP_TIME_ZONE');
});

describeMigration('202610230001_use_timezone_aware_instants', {
  sources,
  reversible: false,
  before() {
    vi.stubEnv('OA_LEGACY_TIMESTAMP_TIME_ZONE', '');
  },
  async up({ expectCollection }) {
    await expectCollection('vendorQualifications').toHaveField('createdAt', {
      type: 'datetimeTz',
      nullable: false,
    });
  },
});

// Apply the complete application schema so the inventory cannot silently miss a module or a loop-generated field.
describeMigration('202610230001_use_timezone_aware_instants', {
  sources: [
    {
      packageName: 'oa-temporal-full-schema',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  reversible: false,
  before() {
    vi.stubEnv('OA_LEGACY_TIMESTAMP_TIME_ZONE', '');
  },
  async up({ connection, expectCollection }) {
    const remaining: string[] = [];
    for await (const collection of connection.collections.scan()) {
      if (collection.name === 'deviceCode') continue; // Better Auth owns the adapter contract.
      for (const field of collection.fields ?? []) {
        if (field.type === 'datetime')
          remaining.push(`${collection.name}.${field.name}`);
      }
    }
    expect(remaining).toEqual([]);
    await expectCollection('employees').toHaveField('hireDate', {
      type: 'date',
    });
    await expectCollection('leaveRequests').toHaveField('startDate', {
      type: 'date',
    });
    await expectCollection('calendarDays').toHaveField('date', {
      type: 'string',
    });
    await expectCollection('meetingBookings').toHaveField('startAt', {
      type: 'datetimeTz',
    });
  },
});

for (const [zone, expected] of [
  ['UTC', '2026-07-15T09:30:00.123Z'],
  ['Asia/Shanghai', '2026-07-15T01:30:00.123Z'],
  ['America/New_York', '2026-07-15T13:30:00.123Z'],
]) {
  describeMigration('202610230001_use_timezone_aware_instants', {
    sources,
    reversible: false,
    async before({ connection }) {
      vi.stubEnv('OA_LEGACY_TIMESTAMP_TIME_ZONE', zone);
      await connection.repository('vendorQualifications').createOne({
        values: {
          id: 'legacy',
          createdAt: '2026-07-15T09:30:00.123',
          statusChangedAt: '2026-07-15T09:30:00.123',
          updatedAt: null,
          expiryDate: '2027-01-01',
          openingTime: '09:30:00.000',
        },
      });
      await connection.repository('meetingBookings').createOne({
        values: {
          id: 'booking',
          startAt: '2026-07-15T09:30:00.123',
          endAt: '2026-07-15T10:30:00.123',
          confirmedAt: '2026-01-01T00:00:00.000Z',
        },
      });
      await connection.repository('oaTaskCenterTimers').createOne({
        values: {
          id: 'timer',
          dueAt: '2026-07-15T09:30:00.123',
        },
      });
      const client = await connection.client<Knex>();
      // The migration must not use the executing session's default time zone.
      await client.raw(
        "select set_config('TimeZone', 'Pacific/Honolulu', false)",
      );
    },
    async up({ connection, expectCollection }) {
      await expectCollection('vendorQualifications').toHaveField('createdAt', {
        type: 'datetimeTz',
        nullable: false,
      });
      await expectCollection('vendorQualifications').toHaveField('updatedAt', {
        type: 'datetimeTz',
        nullable: true,
      });
      await expectCollection('vendorQualifications').toHaveIndex(['createdAt']);
      await expectCollection('vendorQualifications').toHaveField('expiryDate', {
        type: 'date',
      });
      await expectCollection('vendorQualifications').toHaveField(
        'openingTime',
        { type: 'time' },
      );
      await expectCollection('session').toHaveField('expiresAt', {
        type: 'datetime',
      });
      const record = (await connection
        .repository('vendorQualifications')
        .findOne({ filter: { id: 'legacy' } }))!;
      expect(record).toMatchObject({
        createdAt: expected,
        statusChangedAt: expected,
        updatedAt: null,
        expiryDate: '2027-01-01',
        openingTime: '09:30:00.000',
      });
      const booking = await connection
        .repository('meetingBookings')
        .findOne({ filter: { id: 'booking' } });
      expect(booking).toMatchObject({
        startAt: expected,
        confirmedAt: '2026-01-01T00:00:00.000Z',
      });
      await expectCollection('meetingBookings').toHaveIndex([
        'startAt',
        'endAt',
      ]);
      expect(
        await connection
          .repository('oaTaskCenterTimers')
          .findOne({ filter: { id: 'timer' } }),
      ).toMatchObject({ dueAt: expected });
      // Reproduce the failed deployment's actual source-read -> summary-write path.
      await writeTaskSummary(
        connection,
        'oa.vendorQualification',
        { ...record, status: 'draft' },
        'applicant',
      );
      expect(
        await connection
          .repository('oaTaskCenterSummaries')
          .findOne({ filter: { recordId: 'legacy' } }),
      ).toMatchObject({ createdAt: expected });
      const client = await connection.client<Knex>();
      const columns = await client('information_schema.columns')
        .select('data_type', 'datetime_precision')
        .where({
          table_name: 'vendor_qualifications',
          table_schema: (await connection.collections.get(
            'vendorQualifications',
          ))!.db!.schema,
          column_name: 'created_at',
        });
      expect(columns).toEqual([
        { data_type: 'timestamp with time zone', datetime_precision: 3 },
      ]);
    },
  });
}
