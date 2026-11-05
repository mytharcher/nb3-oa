// @vitest-environment node
import { expect } from 'vitest';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import { createEmployeesAppTest } from '../employees/helpers.js';
import { personalTaskTargets } from '../../../server/providers/approval-runtime/query-service.js';

const test = createEmployeesAppTest();
test('exhausts cursor pages with tied dates, isolates owners/categories and keeps changed statuses as candidates', async ({
  testApp,
}) => {
  const db = testApp.database;
  const reader = testApp.application.container.resolve(userTaskServiceToken);
  const writer = reader.registerSource('proof.taskReads');
  await db.transaction(async (tx) => {
    for (let i = 0; i < 205; i++) {
      const sourceKey = `task-${i}`;
      await writer.put(
        {
          userId: 'reviewer',
          sourceKey,
          subject: 'proof.request',
          title: 'Test',
          status: i % 2 ? 'pending' : 'completed',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
        tx,
      );
      await tx.repository('oaTaskCenterTargets').upsertOne({
        filter: { sourceType: 'proof.taskReads', sourceKey },
        update: { recordId: `record-${i}` },
        create: {
          sourceType: 'proof.taskReads',
          sourceKey,
          subject: 'proof.request',
          recordId: `record-${i}`,
        },
      });
    }
    await writer.put(
      {
        userId: 'other',
        sourceKey: 'foreign',
        subject: 'proof.request',
        title: 'Other',
        status: 'pending',
      },
      tx,
    );
    await writer.put(
      {
        userId: 'reviewer',
        sourceKey: 'other-kind',
        subject: 'proof.other',
        title: 'Other',
        status: 'pending',
      },
      tx,
    );
  });
  const read = () =>
    personalTaskTargets(
      db,
      reader,
      'reviewer',
      'proof.request',
      'proof.taskReads',
    );
  expect(new Set((await read())!.map((target) => target.recordId))).toEqual(
    new Set(Array.from({ length: 205 }, (_, i) => `record-${i}`)),
  );
  await writer.setStatus(
    { userId: 'reviewer', sourceKey: 'task-1' },
    'cancelled',
  );
  expect(await read()).toHaveLength(205);
  // Closed history must neither be paged into current candidates nor require
  // resolving its mappings. Keep more than one page of pending work as well.
  await db.transaction(async (tx) => {
    for (let i = 0; i < 1000; i++) {
      await writer.put(
        {
          userId: 'reviewer',
          sourceKey: `history-${i}`,
          subject: 'proof.request',
          title: 'History',
          status: i % 2 ? 'completed' : 'cancelled',
          createdAt: new Date('2025-01-01T00:00:00Z'),
        },
        tx,
      );
    }
  });
  const pending = () =>
    personalTaskTargets(
      db,
      reader,
      'reviewer',
      'proof.request',
      'proof.taskReads',
      'pending',
    );
  expect(new Set((await pending())!.map((target) => target.recordId))).toEqual(
    new Set(Array.from({ length: 101 }, (_, i) => `record-${i * 2 + 3}`)),
  );
  // Resuming work must restore it to the current candidate set.
  await writer.setStatus(
    { userId: 'reviewer', sourceKey: 'task-1' },
    'pending',
  );
  expect(await pending()).toHaveLength(102);
  await writer.put({
    userId: 'reviewer',
    sourceKey: 'unmapped',
    subject: 'proof.request',
    title: 'Unmapped',
    status: 'pending',
  });
  expect(await pending()).toBeUndefined();
});
