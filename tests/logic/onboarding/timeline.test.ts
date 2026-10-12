// @vitest-environment node
import { expect, it } from 'vitest';
import type { AuditLogRecord } from '../../../server/providers/audit/index.js';
import type { OnboardingTask } from '../../../server/providers/onboarding/contract.js';
import { projectTimeline } from '../../../server/providers/onboarding/timeline.js';
const task = { id: 'it', kind: 'it' } as OnboardingTask;
function entry(id: number, action: string, after: unknown): AuditLogRecord {
  return {
    id,
    action,
    after,
    actorId: 'handler',
    targetType: 'onboardings',
    targetId: 'o1',
    at: new Date('2026-10-11T01:00:00Z'),
    reason: 'private free text 98765.12',
    before: { bankAccount: 'private-bank' },
  };
}
it('keeps only immutable safe facts and current readable task scope; never reconstructs old receipts or handlers', () => {
  const timeline = projectTimeline(
    [
      entry(1, 'onboarding.create', {
        employeeId: 'employee',
        baseSalary: '98765.12',
      }),
      entry(2, 'onboarding.task.complete', {
        taskId: 'finance',
        privateFactsId: 'secret',
      }),
      entry(3, 'onboarding.task.reassignMentor', {
        taskId: 'it',
        forced: false,
      }),
      entry(4, 'onboarding.task.complete', {
        taskId: 'it',
        assetReceiptId: 'owner-receipt',
        sourceTaskId: 'hidden',
        accountEnabled: true,
        parentCompleted: true,
        bankAccount: 'private-bank',
      }),
      entry(5, 'onboarding.task.transfer', {
        fromUserId: 'unknown-without-task',
      }),
      entry(6, 'unrelated.audit', { taskId: 'it' }),
    ],
    [],
    [task],
  );
  expect(timeline).toHaveLength(3);
  expect(timeline[1]).not.toHaveProperty('toUserId');
  expect(timeline[2]).toMatchObject({
    assetReceiptId: 'owner-receipt',
    accountEnabled: true,
    parentCompleted: true,
  });
  const json = JSON.stringify(timeline);
  for (const forbidden of [
    '98765.12',
    'private-bank',
    'finance',
    'unknown-without-task',
    'hidden',
    'privateFactsId',
    'reason',
    'before',
    'after',
  ])
    expect(json).not.toContain(forbidden);
});
it('separates queued and accepted notifications without inventing delivery or exposing recipients; suppresses unreadable tasks', () => {
  const reminders = [
    {
      id: 'r1',
      taskId: 'it',
      createdAt: new Date('2026-10-10T01:00:00Z'),
      sentAt: new Date('2026-10-10T02:00:00Z'),
      status: 'sent',
      recipientIds: ['private-recipient'],
    },
    { id: 'r2', taskId: 'finance', createdAt: new Date(), status: 'pending' },
  ];
  const events = projectTimeline([], reminders, [task]);
  expect(events.map((e) => e.action)).toEqual([
    'onboarding.reminder.queued',
    'onboarding.reminder.sent',
  ]);
  expect(JSON.stringify(events)).not.toContain('private-recipient');
  expect(
    projectTimeline([], [{ ...reminders[0], status: 'pending' }], [task]),
  ).toHaveLength(1);
});
