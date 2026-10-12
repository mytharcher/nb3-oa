// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type {
  TaskRow,
  RunRow,
  ActionRow,
} from '@nocobase/app-plugin-approval/server';
import {
  createDepartureReassignment,
  taskRequestId,
  type ReassignmentOwner,
} from '../../../server/providers/departure-reassignment/service.js';
import type { ApprovalDirectoryService } from '../../../server/providers/approval-directory/contract.js';
const input = {
  from: 'leaver',
  to: 'receiver',
  reason: 'Departure handover',
  requestKey: 'departure:one:reassign',
};
function task(
  id: string,
  lifecycle = 'oa.leave',
  extra: Partial<TaskRow> = {},
): TaskRow {
  return {
    id,
    lifecycle,
    source: lifecycle,
    recordId: `record-${id}`,
    runId: `run-${id}`,
    stage: 'manager',
    enteredVersion: 2,
    status: 'pending',
    assigneeId: 'leaver',
    kind: 'decide',
    role: 'member',
    ...extra,
  } as TaskRow;
}
function directory() {
  return {
    snapshot: vi.fn(async () => ({
      isActive: (id: string) =>
        ['leaver', 'receiver', 'admin', 'notification-only'].includes(id),
      roleMembers: (role: string) =>
        role === 'approval.admin' ? ['admin'] : [],
      hasRole: (id: string, role: string) =>
        id === 'admin' && role === 'approval.admin',
    })),
  } as unknown as Pick<ApprovalDirectoryService, 'snapshot'>;
}
function owner(lifecycle: string, tasks: TaskRow[]) {
  const receipts: ActionRow[] = [];
  const approvals = {
    tasksOf: vi.fn(
      async (
        _person: string,
        _status: unknown,
        page: { limit: number; offset: number },
      ) =>
        tasks
          .filter(
            (t) =>
              t.assigneeId === 'leaver' &&
              !['transferred', 'voided', 'completed'].includes(t.status),
          )
          .slice(page.offset, page.offset + page.limit),
    ),
    runsFor: vi.fn(async (_life: string, recordId: string) =>
      tasks
        .filter((t) => t.recordId === recordId)
        .map(
          (t) =>
            ({
              id: t.runId,
              lifecycle: t.lifecycle,
              recordId: t.recordId,
              source: t.source,
              status: t.stage,
              lifecycleVersion: t.enteredVersion,
            }) as RunRow,
        ),
    ),
    actionsOf: vi.fn(async (_life: string, recordId: string) =>
      receipts.filter((a) => a.recordId === recordId),
    ),
  };
  const action = vi.fn(
    async (
      recordId: string,
      body: Parameters<ReassignmentOwner['action']>[1],
      actorId: string,
    ) => {
      const id = 'taskId' in body.target ? body.target.taskId : '';
      const target = tasks.find((t) => t.id === id)!;
      receipts.push({
        name: 'reassign',
        requestId: body.requestId,
        taskId: id,
        actorId,
        input: body.input,
        comment: body.comment,
        recordId,
      } as ActionRow);
      tasks[tasks.indexOf(target)] = { ...target, status: 'transferred' };
    },
  );
  return { lifecycle, approvals, action, receipts };
}
function adapter(owners: ReassignmentOwner[], dir = directory()) {
  const journal = { reserve: vi.fn(async () => ({ actorId: 'admin' })) };
  return {
    service: createDepartureReassignment({
      owners: () => owners,
      directory: dir,
      journal,
    }),
    journal,
  };
}
it('captures every source-scoped page before migrating, without offsets skipping replacements', async () => {
  const tasks = Array.from({ length: 205 }, (_, i) => task(String(i)));
  const source = owner('oa.leave', tasks);
  const { service } = adapter([source]);
  expect(await service.reassign(input)).toEqual({ remaining: 0 });
  expect(source.action).toHaveBeenCalledTimes(205);
  expect(
    source.approvals.tasksOf.mock.calls
      .slice(0, 3)
      .map((call) => call[2].offset),
  ).toEqual([0, 100, 200]);
  expect(new Set(source.receipts.map((r) => r.requestId)).size).toBe(205);
  expect(source.receipts[0]).toMatchObject({
    actorId: 'admin',
    input: { to: 'receiver', override: false },
    requestId: taskRequestId(input.requestKey, '0'),
  });
});
it('routes across real lifecycle owners, deduplicates duplicate targets, and retains proxy principals', async () => {
  const leave = owner('oa.leave', [task('a')]);
  const read = leave.approvals.tasksOf.getMockImplementation()!;
  leave.approvals.tasksOf.mockImplementation(async (...args) =>
    (await read(...args)).flatMap((t) => [t, t]),
  );
  const loan = owner('oa.loan', [task('b', 'oa.loan')]);
  // A proxy does not replace assigneeId; the original principal remains the from scan target.
  expect(await adapter([leave, loan]).service.reassign(input)).toEqual({
    remaining: 0,
  });
  expect(leave.action).toHaveBeenCalledOnce();
  expect(loan.action).toHaveBeenCalledExactlyOnceWith(
    'record-b',
    expect.objectContaining({ target: { taskId: 'b' } }),
    'admin',
  );
});
it('does not move copies but moves waiting, blocked, candidate and suspended human responsibilities', async () => {
  const tasks = [
    task('copy', 'oa.leave', { role: 'info', kind: 'copy' }),
    ...(['waiting', 'blocked', 'candidate', 'suspended'] as const).map(
      (status) => task(status, 'oa.leave', { status }),
    ),
  ];
  const source = owner('oa.leave', tasks);
  expect(await adapter([source]).service.reassign(input)).toEqual({
    remaining: 0,
  });
  expect(source.action).toHaveBeenCalledTimes(4);
});
it('counts unsupported lifecycles and missing active runs instead of reporting zero', async () => {
  const source = owner('oa.leave', [
    task('unknown', 'oa.unregistered'),
    task('missing'),
  ]);
  source.approvals.runsFor.mockResolvedValue([]);
  expect(await adapter([source]).service.reassign(input)).toEqual({
    remaining: 2,
  });
  expect(source.action).not.toHaveBeenCalled();
});
it('keeps qualification failures pending and never requests an override', async () => {
  const source = owner('oa.leave', [task('restricted')]);
  source.action.mockRejectedValue(new Error('Recipient not qualified'));
  expect(await adapter([source]).service.reassign(input)).toEqual({
    remaining: 1,
  });
  expect(source.action).toHaveBeenCalledWith(
    'record-restricted',
    expect.objectContaining({ input: { to: 'receiver', override: false } }),
    'admin',
  );
});
it('rejects an inactive successor without touching the durable command or SDK', async () => {
  const source = owner('oa.leave', [task('a')]);
  const { service, journal } = adapter([source]);
  await expect(
    service.reassign({ ...input, to: 'inactive' }),
  ).rejects.toMatchObject({ code: 'REASSIGNMENT_RECIPIENT_INACTIVE' });
  expect(journal.reserve).not.toHaveBeenCalled();
  expect(source.action).not.toHaveBeenCalled();
});
it('refuses to switch to notification recipients or the administrative duty role without approval.admin', async () => {
  const source = owner('oa.leave', [task('a')]);
  const dir = directory();
  dir.snapshot = vi.fn(async () => ({
    isActive: () => true,
    roleMembers: () => ['notification-only'],
    hasRole: () => false,
  })) as typeof dir.snapshot;
  await expect(
    adapter([source], dir).service.reassign(input),
  ).rejects.toMatchObject({ code: 'REASSIGNMENT_ADMIN_REQUIRED' });
  expect(source.action).not.toHaveBeenCalled();
});
it('does not report success when the public action accepts but no durable public receipt exists', async () => {
  const source = owner('oa.leave', [task('a')]);
  source.approvals.actionsOf.mockResolvedValue([]);
  await expect(adapter([source]).service.reassign(input)).rejects.toMatchObject(
    { code: 'REASSIGNMENT_RECEIPT_MISSING' },
  );
});
