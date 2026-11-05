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
    tasksFor: vi.fn(async (_life: string, recordId: string) =>
      tasks.filter((t) => t.recordId === recordId),
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
  return {
    lifecycle,
    approvals,
    action,
    receipts,
    recordIds: [...new Set(tasks.map((t) => t.recordId))],
  };
}
function adapter(owners: ReassignmentOwner[], dir = directory()) {
  const journal = { reserve: vi.fn(async () => ({ actorId: 'admin' })) };
  return {
    service: createDepartureReassignment({
      owners: () => owners,
      discover: async () =>
        (
          await Promise.all(
            owners.map(async (source) => {
              // Fixture business IDs are stable, independent of task reassignment.
              return (source as ReturnType<typeof owner>).recordIds.map(
                (recordId) => ({
                  lifecycle: source.lifecycle,
                  recordId,
                  taskIds: [],
                }),
              );
            }),
          )
        ).flat(),
      directory: dir,
      journal,
    }),
    journal,
  };
}
it.each([200, 205])(
  'captures all %i tasks before migrating, without offsets skipping replacements',
  async (count) => {
    const tasks = Array.from({ length: count }, (_, i) => task(String(i)));
    const source = owner('oa.leave', tasks);
    const { service } = adapter([source]);
    expect(await service.reassign(input)).toEqual({ remaining: 0 });
    expect(source.action).toHaveBeenCalledTimes(count);
    expect(source.approvals.tasksFor).toHaveBeenCalledTimes(count * 2);
    expect(source.approvals.runsFor).toHaveBeenCalledTimes(count);
    expect(new Set(source.receipts.map((r) => r.requestId)).size).toBe(count);
    expect(source.receipts[0]).toMatchObject({
      actorId: 'admin',
      input: { to: 'receiver', override: false },
      requestId: taskRequestId(input.requestKey, '0'),
    });
  },
);
it('routes across real lifecycle owners, deduplicates duplicate targets, and retains proxy principals', async () => {
  const leave = owner('oa.leave', [task('a')]);
  const read = leave.approvals.tasksFor.getMockImplementation()!;
  leave.approvals.tasksFor.mockImplementation(async (...args) =>
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
it.each(['Recipient not qualified', 'Record permission denied'])(
  'keeps rejected responsibilities pending (%s) without override',
  async (reason) => {
    const source = owner('oa.leave', [task('restricted')]);
    source.action.mockRejectedValue(new Error(reason));
    expect(await adapter([source]).service.reassign(input)).toEqual({
      remaining: 1,
    });
    expect(source.action).toHaveBeenCalledWith(
      'record-restricted',
      expect.objectContaining({ input: { to: 'receiver', override: false } }),
      'admin',
    );
  },
);
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

it('filters closed tasks, copy/info and delegate projections by original assignee, but retains all six OPEN states', async () => {
  const source = owner('oa.leave', [
    ...(
      [
        'pending',
        'waiting',
        'blocked',
        'candidate',
        'claimed',
        'suspended',
      ] as const
    ).map((status) => task(status, 'oa.leave', { status, recordId: 'shared' })),
    ...(['completed', 'transferred', 'voided'] as const).map((status) =>
      task(status, 'oa.leave', { status }),
    ),
    task('copy', 'oa.leave', { kind: 'copy' }),
    task('info', 'oa.leave', { role: 'info' }),
    task('proxy', 'oa.leave', { assigneeId: 'principal' }),
  ]);
  expect(await adapter([source]).service.reassign(input)).toEqual({
    remaining: 0,
  });
  expect(source.action).toHaveBeenCalledTimes(6);
  expect(source.approvals.runsFor).toHaveBeenCalledOnce();
  expect(source.approvals.actionsOf).toHaveBeenCalledOnce();
  expect(
    source.approvals.tasksFor.mock.calls.filter(([, id]) => id === 'shared'),
  ).toHaveLength(2);
});
it.each(['source', 'recordId', 'lifecycle', 'status', 'lifecycleVersion'])(
  'keeps a task blocking when its current run %s mismatches',
  async (field) => {
    const source = owner('oa.leave', [task('mismatch')]);
    const read = source.approvals.runsFor.getMockImplementation()!;
    source.approvals.runsFor.mockImplementation(async (...args) =>
      (await read(...args)).map((run) => ({ ...run, [field]: 'mismatched' })),
    );
    expect(await adapter([source]).service.reassign(input)).toEqual({
      remaining: 1,
    });
    expect(source.action).not.toHaveBeenCalled();
  },
);
it('ignores a definitively closed run', async () => {
  const source = owner('oa.leave', [task('closed')]);
  const read = source.approvals.runsFor.getMockImplementation()!;
  source.approvals.runsFor.mockImplementation(async (...args) =>
    (await read(...args)).map((run) => ({ ...run, status: 'concluded' })),
  );
  expect(await adapter([source]).service.reassign(input)).toEqual({
    remaining: 0,
  });
  expect(source.action).not.toHaveBeenCalled();
});
it('propagates fact read failures', async () => {
  const source = owner('oa.leave', [task('unreadable')]);
  source.approvals.tasksFor.mockRejectedValue(new Error('read unavailable'));
  await expect(adapter([source]).service.reassign(input)).rejects.toThrow(
    'read unavailable',
  );
  expect(source.action).not.toHaveBeenCalled();
});
it('checks receipt contents even when the action failed', async () => {
  const source = owner('oa.leave', [task('receipt')]);
  source.action.mockRejectedValue(new Error('retry'));
  source.approvals.actionsOf.mockResolvedValue([
    {
      requestId: taskRequestId(input.requestKey, 'receipt'),
      name: 'reassign',
      taskId: 'receipt',
      actorId: 'admin',
      input: { to: 'someone-else', override: false },
      comment: input.reason,
    } as ActionRow,
  ]);
  await expect(adapter([source]).service.reassign(input)).rejects.toMatchObject(
    { code: 'REASSIGNMENT_RECEIPT_MISMATCH' },
  );
});
it('fails closed for unknown owners and missing projected facts before actions', async () => {
  const source = owner('oa.leave', [task('a')]);
  for (const candidate of [
    { lifecycle: 'oa.unknown', recordId: 'record-a', taskIds: [] },
    { lifecycle: 'oa.leave', recordId: 'record-a', taskIds: ['absent'] },
  ]) {
    const service = createDepartureReassignment({
      owners: () => [source],
      directory: directory(),
      journal: { reserve: vi.fn(async () => ({ actorId: 'admin' })) },
      discover: async () => [candidate],
    });
    await expect(service.reassign(input)).rejects.toMatchObject({
      code: candidate.taskIds.length
        ? 'REASSIGNMENT_FACT_MISSING'
        : 'REASSIGNMENT_OWNER_MISSING',
    });
    expect(source.action).not.toHaveBeenCalled();
  }
});
it('discovers new responsibilities again after partial commits', async () => {
  const tasks = [task('first')];
  const source = owner('oa.leave', tasks);
  const original = source.action.getMockImplementation()!;
  source.action.mockImplementation(async (...args) => {
    await original(...args);
    tasks.push(task('concurrent'));
    source.recordIds.push('record-concurrent');
  });
  expect(await adapter([source]).service.reassign(input)).toEqual({
    remaining: 1,
  });
  expect(source.action).toHaveBeenCalledOnce();
});

it('reads duplicate record candidates once and deduplicates tasks before actions', async () => {
  const source = owner('oa.leave', [
    task('a'),
    task('b', 'oa.leave', { recordId: 'record-a' }),
  ]);
  const candidate = {
    lifecycle: 'oa.leave',
    recordId: 'record-a',
    taskIds: ['a', 'b'],
  };
  const service = createDepartureReassignment({
    owners: () => [source],
    directory: directory(),
    journal: { reserve: vi.fn(async () => ({ actorId: 'admin' })) },
    discover: async () => [
      candidate,
      candidate,
      { ...candidate, taskIds: ['b'] },
    ],
  });
  expect(await service.reassign(input)).toEqual({ remaining: 0 });
  expect(source.approvals.tasksFor).toHaveBeenCalledTimes(2);
  expect(source.approvals.runsFor).toHaveBeenCalledOnce();
  expect(source.approvals.actionsOf).toHaveBeenCalledOnce();
  expect(source.action).toHaveBeenCalledTimes(2);
});

it('fails the handover if authoritative remaining cannot be read after a successful commit', async () => {
  const source = owner('oa.leave', [task('a')]);
  source.approvals.tasksFor
    .mockResolvedValueOnce([task('a')])
    .mockRejectedValueOnce(new Error('remaining unavailable'));
  await expect(adapter([source]).service.reassign(input)).rejects.toThrow(
    'remaining unavailable',
  );
  expect(source.action).toHaveBeenCalledOnce();
  expect(source.receipts).toHaveLength(1);
});
