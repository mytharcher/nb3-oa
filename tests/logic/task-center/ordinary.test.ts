// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { ApprovalTaskContributor } from '@nocobase/app-plugin-approval/server';
import type {
  UserTask,
  UserTaskWriter,
} from '@nocobase/app-plugin-task-center/server';
import { configureTaskCenter } from '../../../server/providers/approval-runtime/task-center.js';
import { synchronizeOrdinaryTask } from '../../../server/providers/task-center/ordinary.js';
function fixture(previous: Partial<UserTask>[] = []) {
  const writer = {
    listBySourceKey: vi.fn().mockResolvedValue(previous),
    put: vi.fn(),
    setStatus: vi.fn(),
    remove: vi.fn(),
  } satisfies UserTaskWriter;
  const targets = { upsertOne: vi.fn() };
  const timers = { upsertOne: vi.fn(), deleteMany: vi.fn() };
  const announcement = {
    status: 'published',
    requiresConfirmation: true,
    validUntil: '2099-01-01T00:00:00Z',
  };
  const connection = {
    repository: vi.fn((name: string) =>
      name === 'employees'
        ? { findOne: async () => ({ active: true, status: 'active' }) }
        : name === 'announcements'
          ? { findOne: async () => announcement }
          : name === 'oaTaskCenterTimers'
            ? timers
            : targets,
    ),
  } as unknown as DatabaseConnection;
  const db = {} as DatabaseManager;
  const dutyMembers = vi.fn().mockResolvedValue(['candidate-a', 'candidate-b']);
  configureTaskCenter(db, {
    contributor: {} as ApprovalTaskContributor,
    applications: writer,
    workItems: writer,
    receipts: writer,
    dutyMembers,
  });
  return { db, connection, writer, targets, timers, announcement, dutyMembers };
}
it('cancels former recipients and writes the current assignee through the business transaction', async () => {
  const f = fixture([{ userId: 'previous', status: 'pending' }]);
  await synchronizeOrdinaryTask(
    f.db,
    'workItems',
    {
      id: 'work',
      status: 'assigned',
      assigneeUserId: 'current',
      title: 'Handle request',
    },
    f.connection,
  );
  expect(f.writer.setStatus).toHaveBeenCalledWith(
    { userId: 'previous', sourceKey: 'work' },
    'cancelled',
    f.connection,
  );
  expect(f.writer.put).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: 'current',
      status: 'pending',
      sourceKey: 'work',
    }),
    f.connection,
  );
});
it('completes the worker task while opening confirmation work for its owner', async () => {
  const f = fixture([{ userId: 'worker', status: 'pending' }]);
  await synchronizeOrdinaryTask(
    f.db,
    'workItems',
    {
      id: 'work',
      status: 'awaitingConfirmation',
      assigneeUserId: 'worker',
      confirmationOwnerUserId: 'owner',
    },
    f.connection,
  );
  expect(f.writer.setStatus).toHaveBeenCalledWith(
    { userId: 'worker', sourceKey: 'work' },
    'completed',
    f.connection,
  );
  expect(f.writer.put).toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'owner', status: 'pending' }),
    f.connection,
  );
});
it('contributes pool candidates, closes work for all recipients, and never suppresses writer failure', async () => {
  const f = fixture();
  await synchronizeOrdinaryTask(
    f.db,
    'workItems',
    { id: 'pool', status: 'open', dutyRoleCode: 'admin' },
    f.connection,
  );
  expect(f.dutyMembers).toHaveBeenCalledWith('admin', f.connection);
  expect(f.writer.put).toHaveBeenCalledTimes(2);
  f.writer.listBySourceKey.mockResolvedValue([
    { userId: 'candidate-a', status: 'pending' },
  ]);
  await synchronizeOrdinaryTask(
    f.db,
    'workItems',
    { id: 'pool', status: 'cancelled' },
    f.connection,
  );
  expect(f.writer.put).toHaveBeenLastCalledWith(
    expect.objectContaining({ userId: 'candidate-a', status: 'cancelled' }),
    f.connection,
  );
  f.writer.put.mockRejectedValueOnce(new Error('index unavailable'));
  await expect(
    synchronizeOrdinaryTask(
      f.db,
      'workItems',
      { id: 'pool', status: 'assigned', assigneeUserId: 'worker' },
      f.connection,
    ),
  ).rejects.toThrow('index unavailable');
});
it('maps receipt confirmation and revocation and persists expiry with the same transaction', async () => {
  const f = fixture();
  const row = {
    id: 'receipt',
    announcementId: 'announcement',
    userId: 'reader',
    status: 'pending',
  };
  await synchronizeOrdinaryTask(
    f.db,
    'announcementReceipts',
    row,
    f.connection,
  );
  expect(f.timers.upsertOne).toHaveBeenCalled();
  expect(f.writer.put).toHaveBeenLastCalledWith(
    expect.objectContaining({ userId: 'reader', status: 'pending' }),
    f.connection,
  );
  await synchronizeOrdinaryTask(
    f.db,
    'announcementReceipts',
    { ...row, status: 'confirmed' },
    f.connection,
  );
  expect(f.writer.put).toHaveBeenLastCalledWith(
    expect.objectContaining({ status: 'completed' }),
    f.connection,
  );
  f.announcement.status = 'revoked';
  await synchronizeOrdinaryTask(
    f.db,
    'announcementReceipts',
    row,
    f.connection,
  );
  expect(f.writer.put).toHaveBeenLastCalledWith(
    expect.objectContaining({ status: 'cancelled' }),
    f.connection,
  );
});

it('keeps unused pool candidates cancelled and completed workers in history when closing the business item', async () => {
  const f = fixture([
    { userId: 'unused-candidate', status: 'cancelled' },
    { userId: 'worker', status: 'completed' },
    { userId: 'confirmer', status: 'pending' },
  ]);
  await synchronizeOrdinaryTask(
    f.db,
    'workItems',
    { id: 'work', status: 'completed', assigneeUserId: 'worker' },
    f.connection,
  );
  expect(f.writer.put).not.toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'unused-candidate' }),
    f.connection,
  );
  expect(f.writer.put).toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'confirmer', status: 'completed' }),
    f.connection,
  );
  f.writer.put.mockClear();
  await synchronizeOrdinaryTask(
    f.db,
    'workItems',
    { id: 'work', status: 'cancelled', assigneeUserId: 'worker' },
    f.connection,
  );
  expect(f.writer.put).not.toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'worker', status: 'cancelled' }),
    f.connection,
  );
});
