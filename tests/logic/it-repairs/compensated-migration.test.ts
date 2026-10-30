// @vitest-environment node
import { describeMigration } from '@nocobase/app-testing/server';
import { expect, afterAll } from 'vitest';
import { mkdtempSync, copyFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const directory = mkdtempSync(
  path.join(tmpdir(), 'repair-migration-rehearsal-'),
);
// Copied immutable migrations still resolve their installed public DB package.
symlinkSync(
  path.resolve('node_modules'),
  path.join(directory, 'node_modules'),
  'dir',
);
for (const name of [
  '202610290001_create_it_repairs',
  '202610290004_it_repair_handling',
  '202610300001_it_repair_reporting',
])
  copyFileSync(
    path.resolve('database/main/migrations', name + '.ts'),
    path.join(directory, name + '.ts'),
  );
afterAll(() => rmSync(directory, { recursive: true, force: true }));
const id = '00000000-0000-4000-8000-000000000001',
  at = new Date('2026-10-29T09:00:00+08:00');
const original = {
  id,
  requesterId: 'synthetic-requester',
  number: 'MIGRATION-1',
  title: 'Preserved fault',
  description: 'Synthetic',
  category: 'network',
  impact: 'partial',
  location: 'Lab',
  contact: '',
  status: 'triage',
  version: 7,
  createdAt: at,
  updatedAt: at,
  statusChangedAt: at,
  submittedAt: at,
  calendarSnapshot: { schemaVersion: 1, version: 'frozen-original' },
  ruleSnapshot: { versions: { response: 'original' } },
  processing: { round: 2, waitHours: 3 },
};
let upgrades = 0;
let completeSchema: unknown;
describeMigration('202610300001_it_repair_reporting', {
  sources: [{ packageName: 'repair-rehearsal', directory }],
  before: async ({ connection }) => {
    await connection.repository('itRepairs').createOne({ values: original });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('itRepairs').toHaveField('firstRespondedAt', {
      type: 'datetimeTz',
    });
    await expectCollection('itRepairs').toHaveField('metricRevision');
    const row = await connection
      .repository('itRepairs')
      .findOne({ filter: { id } });
    expect(row).toMatchObject({
      number: original.number,
      version: 7,
      calendarSnapshot: original.calendarSnapshot,
      ruleSnapshot: original.ruleSnapshot,
      processing: original.processing,
      metricRevision: null,
    });
    expect(new Date(String(row!.submittedAt)).toISOString()).toBe(
      at.toISOString(),
    );
    // Explicit compensation is separate from the immutable migration's down.
    const builder = connection.builder;
    const definition = await builder.getCollection('itRepairs');
    const indices = definition?.indexes?.filter(
      (index) =>
        JSON.stringify(index.fields) === JSON.stringify(['submittedAt', 'id']),
    );
    expect(indices).toHaveLength(1);
    const index = indices![0];
    if (
      !index.name ||
      index.expressions?.length ||
      index.predicate ||
      index.type === 'unique'
    )
      throw Error('Unexpected rollback index');
    const schema = {
      repairs: definition,
      groups: await builder.getCollection('itRepairGroups'),
      physical: await Promise.all(
        ['itRepairs', 'itRepairGroups'].map(async (name) => {
          const physical = await connection.collections.getPhysical(name);
          if (!physical) throw Error('Missing target schema');
          const schema =
            await connection.schemaInspector.getPhysicalCollection(physical);
          if (!schema) throw Error('Missing physical target schema');
          // PostgreSQL retains holes in attnum after DROP COLUMN. Compare the
          // complete visible schema in order, without requiring reused attnums.
          return {
            ...schema,
            columns: schema.columns.map((column, i) => ({
              ...column,
              ordinalPosition: i + 1,
            })),
          };
        }),
      ),
    };
    expect(index).toMatchObject({ fields: ['submittedAt', 'id'] });
    if (++upgrades === 1) {
      completeSchema = structuredClone(schema);
      await builder.dropIndex('itRepairs', index.name);
    } else {
      expect(upgrades).toBe(2);
      // The final upgraded state must retain every field and index, including
      // the ordinary submittedAt index removed only to permit the original down.
      expect(schema).toEqual(completeSchema);
    }
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('itRepairs').not.toHaveField('metricRevision');
    const row = await connection
      .repository('itRepairs')
      .findOne({ filter: { id } });
    expect(row).toMatchObject({
      number: original.number,
      version: 7,
      calendarSnapshot: original.calendarSnapshot,
      ruleSnapshot: original.ruleSnapshot,
      processing: original.processing,
    });
  },
});
