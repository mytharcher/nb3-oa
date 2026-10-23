// @vitest-environment node
import { expect, it, vi } from 'vitest';
import {
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
} from '@nocobase/lifecycle';
import type { ApprovalService } from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection } from '@nocobase/db';
import type { ApprovalStatisticsChanges } from '../../../server/providers/approval-runtime/statistics-contract.js';
import { installDelegationWriteBoundary } from '../../../server/providers/approval-runtime/dependency-write-boundary.js';
import { requireDelegationBoundary } from '../../../server/providers/approval-runtime/delegation-write-context.js';

function fixture() {
  const store = new MemoryLifecycleStore();
  const runtime = new LifecycleRuntime({ store });
  const notified = vi.fn();
  const delegated = vi.fn();
  runtime.register(
    defineLifecycle({
      name: 'proof.leave',
      collection: 'leaves',
      initial: 'draft',
      states: ['draft', { name: 'approved', final: true }],
      transitions: { submit: { from: 'draft', to: 'approved' } },
      onEnterState: {
        approved: ({ record, tx }) => {
          tx.afterCommit(notified);
          if (record.enableDelegation) {
            requireDelegationBoundary();
            delegated();
          }
        },
      },
    }),
  );
  const guard = vi.fn(
    <T>(
      work: (connection: DatabaseConnection) => Promise<T>,
      _connection?: DatabaseConnection,
      _kinds?: 'all' | readonly string[],
    ) => runtime.transaction((tx) => work(tx.handle as DatabaseConnection)),
  );
  const approvals = {
    perform: vi.fn(),
    sweepReport: vi.fn(),
  } as unknown as ApprovalService;
  const dispose = installDelegationWriteBoundary(
    runtime,
    approvals,
    {
      guard,
    } as unknown as ApprovalStatisticsChanges,
    'proof.leave',
  );
  return { store, runtime, notified, delegated, guard, dispose };
}

it('creates and submits ordinary requests with only the owning business guard', async () => {
  const f = fixture();
  await f.runtime.create(
    'proof.leave',
    { id: 'ordinary', enableDelegation: false },
    { actor: { id: 'owner' } },
  );
  await f.runtime.fire('proof.leave', 'ordinary', 'submit', {
    actor: { id: 'owner' },
    requestId: 'ordinary-submit',
  });
  expect(f.guard).toHaveBeenCalledTimes(2);
  expect(
    f.guard.mock.calls.every((call) => call[2]?.[0] === 'proof.leave'),
  ).toBe(true);
  expect(f.notified).toHaveBeenCalledTimes(1);
  expect(await f.store.findRecord('leaves', 'ordinary')).toMatchObject({
    status: 'approved',
    lifecycleVersion: 2,
  });
});

it('rolls back an automatic approval that needs delegation and retries atomically once', async () => {
  const f = fixture();
  await f.runtime.create(
    'proof.leave',
    { id: 'delegating', enableDelegation: true },
    { actor: { id: 'owner' } },
  );
  await f.runtime.fire('proof.leave', 'delegating', 'submit', {
    actor: { id: 'owner' },
    requestId: 'delegating-submit',
  });
  expect(
    f.guard.mock.calls.filter((call) => call[2] === undefined),
  ).toHaveLength(1);
  expect(f.delegated).toHaveBeenCalledTimes(1);
  expect(f.notified).toHaveBeenCalledTimes(1);
  expect(await f.store.findRecord('leaves', 'delegating')).toMatchObject({
    status: 'approved',
    lifecycleVersion: 2,
  });
  expect(
    await f.store.listTransitions('proof.leave', 'delegating'),
  ).toHaveLength(2);
});

it('propagates a guarded failure without retrying it or committing the first attempt', async () => {
  const f = fixture();
  await f.runtime.create(
    'proof.leave',
    { id: 'failure', enableDelegation: true },
    { actor: { id: 'owner' } },
  );
  const originalGuard = f.guard.getMockImplementation()!;
  f.guard
    .mockImplementationOnce(originalGuard)
    .mockRejectedValueOnce(new Error('synchronization failed'));
  await expect(
    f.runtime.fire('proof.leave', 'failure', 'submit', {
      actor: { id: 'owner' },
      requestId: 'failure-submit',
    }),
  ).rejects.toThrow('synchronization failed');
  expect(
    f.guard.mock.calls.filter((call) => call[2] === undefined),
  ).toHaveLength(1);
  expect(f.notified).not.toHaveBeenCalled();
  expect(await f.store.findRecord('leaves', 'failure')).toMatchObject({
    status: 'draft',
    lifecycleVersion: 1,
  });
});

it('does not retry business refusals through the global boundary', async () => {
  const f = fixture();
  await expect(
    f.runtime.fire('proof.leave', 'missing', 'submit', {
      actor: { id: 'owner' },
    }),
  ).rejects.toThrow();
  expect(f.guard).toHaveBeenCalledTimes(1);
  expect(f.guard.mock.calls[0][2]).toEqual(['proof.leave']);
  f.dispose();
});

it('rolls back both attempts when the actual delegation write fails', async () => {
  const f = fixture();
  await f.runtime.create(
    'proof.leave',
    { id: 'write-failure', enableDelegation: true },
    { actor: { id: 'owner' } },
  );
  f.delegated.mockImplementation(() => {
    throw new Error('delegation write failed');
  });
  await expect(
    f.runtime.fire('proof.leave', 'write-failure', 'submit', {
      actor: { id: 'owner' },
      requestId: 'write-failure-submit',
    }),
  ).rejects.toThrow('delegation write failed');
  expect(
    f.guard.mock.calls.filter((call) => call[2] === undefined),
  ).toHaveLength(1);
  expect(f.notified).not.toHaveBeenCalled();
  expect(
    await f.store.listTransitions('proof.leave', 'write-failure'),
  ).toHaveLength(1);
  expect(await f.store.findRecord('leaves', 'write-failure')).toMatchObject({
    status: 'draft',
    lifecycleVersion: 1,
  });
});
