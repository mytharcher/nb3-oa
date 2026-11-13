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
