// @vitest-environment node
import path from 'node:path';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610220002_complete_task_center_schema', {
  sources: [
    {
      packageName: 'task-center-legacy-schema-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../fixtures/task-center/legacy-schema',
      ),
    },
  ],
  reversible: false,
  async up({ connection, expectCollection }) {
    await expectCollection('oaTaskCenterBackfills').toHaveIndex(['id'], {
      unique: true,
    });
    await expectCollection('oaTaskCenterTimers').toHaveField('dueAt', {
      nullable: false,
    });
    const jobs = connection.repository('oaTaskCenterBackfills');
    // Startup must reuse the existing cursor instead of restarting the backfill.
    await jobs.upsertOne({
      filter: { id: 'approval.test' },
      create: { id: 'approval.test', cursor: null, done: false },
      update: { id: 'approval.test' },
    });
    expect(
      await jobs.findOne({ filter: { id: 'approval.test' } }),
    ).toMatchObject({
      cursor: 'record-100',
      done: false,
    });
    expect(await jobs.count()).toBe(1);
    await connection.repository('oaTaskCenterTimers').upsertOne({
      filter: { id: 'receipt-1' },
      create: { id: 'receipt-1', dueAt: new Date('2026-10-23T00:00:00Z') },
      update: { dueAt: new Date('2026-10-24T00:00:00Z') },
    });
  },
});
