// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { ApprovalQuery } from '@nocobase/app-plugin-approval/server';
import type { LifecycleRuntime } from '@nocobase/lifecycle';
import { ApprovalStatisticsChangeService } from '../../../server/providers/approval-runtime/statistics-changes.js';
import { registerTaskSynchronizer } from '../../../server/providers/approval-runtime/task-center.js';

function fixture() {
  const connection = {
    transaction: async <T>(
      work: (tx: DatabaseConnection) => Promise<T>,
    ): Promise<T> => work(connection as unknown as DatabaseConnection),
  };
  const db = {
    transaction: connection.transaction,
  } as unknown as DatabaseManager;
  const transaction = vi.fn(async (work: (tx: unknown) => Promise<unknown>) =>
    work({ handle: connection }),
  );
  const transactionIn = vi.fn(
    async (_name: string, _tx: unknown, work: () => Promise<unknown>) => work(),
  );
  const recomputeInTransaction = vi.fn();
  const query = {
    transactionIn,
    recomputeInTransaction,
  } as unknown as ApprovalQuery;
  const service = new ApprovalStatisticsChangeService(db, query);
  const synchronizers = Array.from({ length: 26 }, () => vi.fn());
  for (let index = 0; index < 26; index++) {
    const business = `proof.${index}`;
    service.register({
      business,
      kind: business,
      runtime: { transaction } as unknown as LifecycleRuntime,
    });
    registerTaskSynchronizer(db, business, synchronizers[index]);
  }
  service.activate();
  return {
    connection,
    db,
    transaction,
    transactionIn,
    recomputeInTransaction,
    service,
    synchronizers,
  };
}

it('acquires ordered gates without scanning or rebuilding tasks when no delegation changes', async () => {
  const f = fixture();
  await expect(f.service.guard(async () => 'done')).resolves.toBe('done');
  expect(f.transactionIn.mock.calls.map(([name]) => name)).toEqual(
    Array.from({ length: 26 }, (_, index) => `proof.${index}`).sort(),
  );
  expect(f.transaction).toHaveBeenCalledTimes(26);
  expect(f.recomputeInTransaction).not.toHaveBeenCalled();
  for (const sync of f.synchronizers) expect(sync).not.toHaveBeenCalled();
});

it('keeps the local query write boundary without visiting other businesses', async () => {
  const f = fixture();
  await f.service.guard(async () => undefined, undefined, ['proof.3']);
  expect(f.transactionIn).toHaveBeenCalledTimes(1);
  expect(f.transactionIn.mock.calls[0][0]).toBe('proof.3');
  expect(f.transaction).toHaveBeenCalledTimes(1);
  for (const sync of f.synchronizers) expect(sync).not.toHaveBeenCalled();
});

it.each(['delegationChanged', 'delegationTimeChanged'])(
  'limits %s to the declared businesses and old/new people',
  async (reason) => {
    const f = fixture();
    await f.service.recompute({
      kinds: ['proof.3'],
      userIds: ['principal', 'delegate', 'principal'],
      reason,
    });
    expect(f.transactionIn).toHaveBeenCalledTimes(1);
    expect(f.recomputeInTransaction).toHaveBeenCalledTimes(2);
    expect(f.synchronizers[3]).toHaveBeenCalledWith(f.connection, {
      assigneeIds: ['delegate', 'principal'],
    });
    expect(
      f.synchronizers.filter((sync) => sync.mock.calls.length),
    ).toHaveLength(1);
  },
);

it('retains the full source synchronization for organization changes', async () => {
  const f = fixture();
  await f.service.recompute({
    kinds: 'all',
    userIds: ['changed-manager'],
    reason: 'organizationChanged',
  });
  for (const sync of f.synchronizers)
    expect(sync).toHaveBeenCalledWith(f.connection, undefined);
});
