// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { DatabaseConnection } from '@nocobase/db';
import type { LifecycleRuntime } from '@nocobase/lifecycle';
import type { ApprovalService } from '@nocobase/app-plugin-approval/server';
import type { ApprovalStatisticsChanges } from '../../../server/providers/approval-runtime/statistics-contract.js';
import { installDelegationWriteBoundary } from '../../../server/providers/approval-runtime/dependency-write-boundary.js';
import { withAppLifecycleTransaction } from '../../../server/providers/approval-runtime/repository-store.js';

it('retains the SDK child savepoint instead of starting a sibling on the ambient outer transaction', async () => {
  const outer = { name: 'outer' } as DatabaseConnection;
  const inner = { name: 'inner' } as DatabaseConnection;
  const fire = vi.fn(async () => ({}));
  const create = vi.fn(async () => ({}));
  const runEffect = vi.fn(async () => undefined);
  const runtime = {
    fire,
    create,
    runEffect,
  } as unknown as LifecycleRuntime;
  const approvals = {
    perform: vi.fn(),
    sweepReport: vi.fn(),
  } as unknown as ApprovalService;
  const changes = { guard: vi.fn() } as unknown as ApprovalStatisticsChanges;
  const dispose = installDelegationWriteBoundary(
    runtime,
    approvals,
    changes,
    'test',
  );
  await withAppLifecycleTransaction(outer, async () => {
    await runtime.fire('test', 'id', 'approve', {
      actor: { id: 'actor' },
      transaction: inner,
    });
    await runtime.create(
      'test',
      {},
      { actor: { id: 'actor' }, transaction: inner },
    );
  });
  expect(fire.mock.calls[0]).toEqual([
    'test',
    'id',
    'approve',
    { actor: { id: 'actor' }, transaction: inner },
  ]);
  expect(create.mock.calls[0]).toEqual([
    'test',
    {},
    { actor: { id: 'actor' }, transaction: inner },
  ]);
  expect(changes.guard).not.toHaveBeenCalled();
  await runtime.runEffect('notification-effect');
  expect(runEffect).toHaveBeenCalledWith('notification-effect');
  expect(changes.guard).not.toHaveBeenCalled();
  dispose();
});
