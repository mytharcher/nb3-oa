import type { RepositoryRecord } from '@nocobase/db';
import type { AuditLogRecord } from '../audit/index.js';
import type { OnboardingTask, OnboardingTimelineEntry } from './contract.js';

const actions = new Set([
  'onboarding.create',
  'onboarding.cancel',
  'onboarding.task.claim',
  'onboarding.task.release',
  'onboarding.task.transfer',
  'onboarding.task.reassignMentor',
  'onboarding.task.complete',
  'onboarding.task.forceComplete',
]);
function instant(value: unknown): string | null {
  if (!(typeof value === 'string' || value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
/** Explicit safe projection: free text, private facts and raw audit snapshots never leave this facade. */
export function projectTimeline(
  entries: AuditLogRecord[],
  reminders: RepositoryRecord[],
  tasks: OnboardingTask[],
): OnboardingTimelineEntry[] {
  const readable = new Map(tasks.map((task) => [task.id, task]));
  const result: OnboardingTimelineEntry[] = [];
  for (const entry of entries) {
    const at = instant(entry.at);
    if (!at || !actions.has(entry.action)) continue;
    const after =
      entry.after && typeof entry.after === 'object'
        ? (entry.after as Record<string, unknown>)
        : {};
    const taskId = typeof after.taskId === 'string' ? after.taskId : undefined;
    const task = taskId ? readable.get(taskId) : undefined;
    if (entry.action.startsWith('onboarding.task.') && !task) continue;
    const item: OnboardingTimelineEntry = {
      id: `audit:${entry.id}`,
      at,
      action: entry.action,
      actorId: entry.actorId,
      ...(task ? { taskId: task.id, kind: task.kind } : {}),
    };
    if (task) {
      for (const key of [
        'fromUserId',
        'toUserId',
        'assetReceiptId',
        'sourceTaskId',
      ] as const)
        if (
          typeof after[key] === 'string' &&
          (key !== 'sourceTaskId' || readable.has(after[key]))
        )
          item[key] = after[key];
      for (const key of [
        'forced',
        'parentCompleted',
        'accountEnabled',
      ] as const)
        if (typeof after[key] === 'boolean') item[key] = after[key];
    }
    result.push(item);
  }
  for (const reminder of reminders) {
    if (typeof reminder.id !== 'string') continue;
    const task =
      typeof reminder.taskId === 'string'
        ? readable.get(reminder.taskId)
        : undefined;
    if (!task) continue;
    const queued = instant(reminder.createdAt);
    if (queued)
      result.push({
        id: `reminder:${reminder.id}:queued`,
        at: queued,
        action: 'onboarding.reminder.queued',
        actorId: null,
        taskId: task.id,
        kind: task.kind,
      });
    const sent = reminder.status === 'sent' ? instant(reminder.sentAt) : null;
    if (sent)
      result.push({
        id: `reminder:${reminder.id}:sent`,
        at: sent,
        action: 'onboarding.reminder.sent',
        actorId: null,
        taskId: task.id,
        kind: task.kind,
      });
  }
  return result.sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  );
}
