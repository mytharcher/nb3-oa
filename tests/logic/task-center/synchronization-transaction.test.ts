// @vitest-environment node
import { expect, it, vi } from 'vitest';
import {
  databaseManagerToken,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { Application } from '@nocobase/app-server/application';
import TaskCenterProvider from '../../../server/providers/task-center/index.js';
import { synchronizeTaskDependencies } from '../../../server/providers/approval-runtime/task-center.js';
import { ApprovalService } from '@nocobase/app-plugin-approval/server';
import { LifecycleRuntime, MemoryLifecycleStore } from '@nocobase/lifecycle';

const fixture = vi.hoisted(() => ({ sdk: vi.fn(), binding: vi.fn() }));
vi.mock('../../../server/providers/process-management/owners.js', () => ({
  processOwners: [
    { collection: 'sampleRequests', kind: 'oa.sample', sdk: fixture.sdk },
  ],
}));
vi.mock('../../../server/providers/approval-runtime/query-service.js', () => ({
  approvalTaskBindings: fixture.binding,
}));

it('preserves the transaction through the public process-owner facade', async () => {
  const { processOwners } = await vi.importActual<
    typeof import('../../../server/providers/process-management/owners.js')
  >('../../../server/providers/process-management/owners.js');
  const connection = {} as DatabaseConnection;
  const runtime = new LifecycleRuntime({ store: new MemoryLifecycleStore() });
  const read = vi.fn(
    async (work: () => Promise<unknown>, tx?: DatabaseConnection) => {
      expect(tx).toBe(connection);
      return work();
    },
  );
  const service = {
    runtime,
    approvals: Object.create(ApprovalService.prototype),
    read,
  };
  const app = {
    container: { resolve: () => service },
  } as unknown as Application;
  const sdk = await processOwners
    .find((owner) => owner.kind === 'oa.leave')!
    .sdk(app);
  await expect(sdk.read(async () => 'synchronized', connection)).resolves.toBe(
    'synchronized',
  );
});

it('reads the synchronization directory on the caller transaction before contributing tasks', async () => {
  const repository = {
    upsertOne: vi.fn(),
    updateMany: vi.fn(),
    findOne: vi.fn(async () => ({ done: true })),
  };
  const connection = {
    repository: () => repository,
  } as unknown as DatabaseConnection;
  const db = {
    connection: () => ({ collections: { get: async () => ({}) } }),
    transaction: async (work: (tx: DatabaseConnection) => Promise<unknown>) =>
      work(connection),
  } as unknown as DatabaseManager;
  const synchronizeBatch = vi.fn(
    async (): Promise<{ nextCursor: string | null }> => ({ nextCursor: null }),
  );
  const runtime = {
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({ handle: connection, now: new Date() }),
  };
  let callerOwnsConnection = false;
  const read = vi.fn(
    async (work: () => Promise<unknown>, tx?: DatabaseConnection) => {
      // Model a one-connection pool: a root read cannot acquire the caller's occupied connection.
      if (callerOwnsConnection && tx !== connection)
        throw new Error('Root read waits for caller connection');
      return work();
    },
  );
  fixture.sdk.mockResolvedValue({ read, approvals: {}, runtime });
  fixture.binding.mockReturnValue({
    runtime,
    services: {},
    approvals: [
      {
        name: 'oa.sample',
        kind: 'oa.sample',
        options: {
          directory: () => ({}),
          userTasks: () => ({ contributor: { synchronizeBatch } }),
        },
      },
    ],
  });
  const schedule = { addJob: vi.fn(), setup: vi.fn() };
  const app = {
    container: {
      resolve: (token: unknown) => {
        if (token === databaseManagerToken) return db;
        if (token === jobExecutorServiceToken)
          return { getScheduleExecutor: () => schedule };
        throw new Error('Unexpected token');
      },
    },
  } as unknown as Application;
  const provider = new TaskCenterProvider(app);
  await provider.start();
  callerOwnsConnection = true;
  await synchronizeTaskDependencies(db, 'oa.sample', connection);
  expect(read).toHaveBeenLastCalledWith(expect.any(Function), connection);
  expect(synchronizeBatch).toHaveBeenCalledWith(
    'oa.sample',
    expect.anything(),
    expect.objectContaining({
      transaction: expect.objectContaining({ handle: connection }),
    }),
    { afterId: undefined, limit: 100 },
  );
  synchronizeBatch.mockClear();
  synchronizeBatch.mockResolvedValueOnce({ nextCursor: '100' });
  await synchronizeTaskDependencies(db, 'oa.sample', connection, {
    assigneeIds: ['principal', 'delegate', 'principal'],
  });
  expect(
    synchronizeBatch.mock.calls.map((call) => (call as unknown[])[3]),
  ).toEqual([
    { afterId: undefined, limit: 100, assigneeId: 'delegate' },
    { afterId: '100', limit: 100, assigneeId: 'delegate' },
    { afterId: undefined, limit: 100, assigneeId: 'principal' },
  ]);
  read.mockClear();
  await synchronizeTaskDependencies(db, 'oa.sample', connection, {
    assigneeIds: [],
  });
  expect(read).not.toHaveBeenCalled();
});
