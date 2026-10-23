// @vitest-environment node
import { expect, it, vi } from 'vitest';
import {
  approve,
  approvalState,
  stagesFor,
  type ApprovalTaskContributor,
} from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import {
  LifecycleRuntime,
  MemoryLifecycleStore,
  type LifecycleRecord,
} from '@nocobase/lifecycle';
import type { UserTaskWriter } from '@nocobase/app-plugin-task-center/server';
import {
  configureTaskCenter,
  defineAppApproval,
  registerAppApproval,
  taskCenterRuntimeServices,
} from '../../../server/providers/approval-runtime/task-center.js';
interface Types {
  record: LifecycleRecord & {
    status: string;
    applicantId: string;
    number: string;
  };
  state:
    | 'draft'
    | 'review'
    | 'execution'
    | 'revision'
    | 'completed'
    | 'withdrawn'
    | 'rejected';
  services: { prepared: number; directory: never };
}
function fixture() {
  const writer = {
    put: vi.fn(),
    listBySourceKey: vi.fn(),
    setStatus: vi.fn(),
    remove: vi.fn(),
  } satisfies UserTaskWriter;
  const contributor = {} as ApprovalTaskContributor;
  const db = {} as DatabaseManager;
  configureTaskCenter(db, {
    contributor,
    applications: writer,
    workItems: writer,
    receipts: writer,
    dutyMembers: async () => [],
  });
  const options: Parameters<typeof defineAppApproval<Types>>[0] = {
    name: 'oa.sample',
    collection: 'sampleRequests',
    initial: 'draft',
    applicant: (record) => record.applicantId,
    directory: (services) => services.directory,
    states: [
      'draft',
      approvalState(
        'review',
        stagesFor<Types>().single({
          assignee: () => 'reviewer',
          actions: [approve],
        }),
      ),
      'execution',
      'revision',
      { name: 'completed', final: true },
      { name: 'withdrawn', final: true },
      { name: 'rejected', final: true },
    ],
    onEnterState: {
      draft: () => {
        original.prepared += 1;
      },
    },
    transitions: {
      submit: { from: 'draft', to: 'review' },
      approved: {
        from: 'review',
        to: 'execution',
        approvalOutcome: 'approved',
      },
      rejected: { from: 'review', to: 'rejected', approvalOutcome: 'rejected' },
      finish: { from: 'execution', to: 'completed' },
      revise: { from: 'execution', to: 'revision' },
      withdraw: { from: 'revision', to: 'withdrawn' },
    },
  };
  const definition = defineAppApproval<Types>(options);
  const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
  const original = { prepared: 0, directory: {} as never };
  registerAppApproval(db, runtime, definition, () => original);
  const services = (
    taskCenterRuntimeServices(runtime) as (handle: unknown) => Types['services']
  )(undefined);
  return { writer, contributor, definition, runtime, original, services };
}
it('keeps owner service identity and mutable preparation data across the shared runtime and approval facade', () => {
  const f = fixture();
  f.services.prepared = 7;
  expect(f.original.prepared).toBe(7);
  expect(
    (
      taskCenterRuntimeServices(f.runtime) as (
        handle: unknown,
      ) => Types['services']
    )(undefined),
  ).toBe(f.services);
  expect(
    f.definition.approval.options.userTasks!(f.services)?.contributor,
  ).toBe(f.contributor);
});
it('tracks the complete application lifecycle with stable ownership and propagates index failure', async () => {
  const f = fixture();
  const handle = {} as DatabaseConnection;
  const apply = async (name: string, state: Types['state']) => {
    const hook = (
      f.definition.approval.options as Parameters<
        typeof defineAppApproval<Types>
      >[0]
    ).transitions[name].onTransition!;
    await hook({
      services: f.services,
      record: {
        id: 'record',
        status: state,
        applicantId: 'original-applicant',
        number: 'REQ-1',
      },
      actor: { id: 'reviewer' },
      tx: { handle },
    } as never);
  };
  await apply('approved', 'execution');
  expect(f.writer.put).toHaveBeenLastCalledWith(
    expect.objectContaining({
      userId: 'original-applicant',
      sourceKey: 'oa.sample:record',
      status: 'pending',
    }),
    handle,
  );
  await apply('revise', 'revision');
  expect(f.writer.put).toHaveBeenLastCalledWith(
    expect.objectContaining({ status: 'pending' }),
    handle,
  );
  await apply('finish', 'completed');
  expect(f.writer.put).toHaveBeenLastCalledWith(
    expect.objectContaining({
      status: 'completed',
      sourceKey: 'oa.sample:record',
    }),
    handle,
  );
  await apply('withdraw', 'withdrawn');
  expect(f.writer.put).toHaveBeenLastCalledWith(
    expect.objectContaining({ status: 'cancelled' }),
    handle,
  );
  f.writer.put.mockRejectedValueOnce(new Error('index failure'));
  await expect(apply('finish', 'completed')).rejects.toThrow('index failure');
});

it('projects creation and state changes in the caller transaction while preserving existing entry hooks', async () => {
  const f = fixture();
  const upsertOne = vi.fn().mockResolvedValue(undefined);
  const repository = vi.fn().mockReturnValue({ upsertOne });
  const handle = { repository } as unknown as DatabaseConnection;
  const apply = async (state: Types['state']) => {
    for (const hook of f.definition.onEnterState.get(state) ?? [])
      await hook({
        services: f.services,
        record: {
          id: 'record',
          applicantId: 'original-applicant',
          number: 'REQ-1',
          status: state,
          reason: 'private reason',
          amount: 123,
          dueAt: '2026-11-01T00:00:00Z',
        },
        tx: { handle },
      } as never);
  };
  await apply('draft');
  expect(f.original.prepared).toBe(1);
  expect(f.writer.put).toHaveBeenLastCalledWith(
    expect.objectContaining({
      userId: 'original-applicant',
      sourceKey: 'oa.sample:record',
      subject: 'oa.sample',
      status: 'pending',
    }),
    handle,
  );
  expect(upsertOne).toHaveBeenLastCalledWith(
    expect.objectContaining({
      filter: { subject: 'oa.sample', recordId: 'record' },
      create: expect.objectContaining({
        applicantId: 'original-applicant',
        category: 'drafts',
        status: 'draft',
      }),
    }),
  );
  expect(upsertOne.mock.calls[0][0].create).not.toHaveProperty('reason');
  expect(upsertOne.mock.calls[0][0].create).not.toHaveProperty('amount');
  await apply('revision');
  expect(upsertOne).toHaveBeenLastCalledWith(
    expect.objectContaining({
      update: expect.objectContaining({ category: 'revisions' }),
    }),
  );
  await apply('completed');
  expect(upsertOne).toHaveBeenLastCalledWith(
    expect.objectContaining({
      update: expect.objectContaining({ category: 'other' }),
    }),
  );
  upsertOne.mockRejectedValueOnce(new Error('summary unavailable'));
  await expect(apply('revision')).rejects.toThrow('summary unavailable');
  f.writer.put.mockRejectedValueOnce(new Error('draft index unavailable'));
  await expect(apply('draft')).rejects.toThrow('draft index unavailable');
  expect(
    repository.mock.calls.every(([name]) => name === 'oaTaskCenterSummaries'),
  ).toBe(true);
});
