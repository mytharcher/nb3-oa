// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
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
  const service = new ApprovalStatisticsChangeService(db);
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
    service,
    synchronizers,
  };
}

it('joins the business transaction without obsolete source wrappers or task scans', async () => {
  const f = fixture();
  await expect(f.service.guard(async () => 'done')).resolves.toBe('done');
  expect(f.transaction).not.toHaveBeenCalled();
  for (const sync of f.synchronizers) expect(sync).not.toHaveBeenCalled();
});

it('keeps the local business transaction without visiting other businesses', async () => {
  const f = fixture();
  await f.service.guard(async () => undefined, undefined, ['proof.3']);
  expect(f.transaction).not.toHaveBeenCalled();
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
