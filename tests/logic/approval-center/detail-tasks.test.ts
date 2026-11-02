// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { TaskRow } from '@nocobase/app-plugin-approval/server';
import { personalDetailTasksFor } from '../../../server/providers/approval-runtime/task-views.js';

it('preserves personal detail statuses, including candidate and claimed but excluding closed and inactive work', async () => {
  const statuses = [
    'pending',
    'claimed',
    'candidate',
    'waiting',
    'blocked',
    'suspended',
    'completed',
    'transferred',
    'voided',
  ] as const;
  const tasks = statuses.flatMap((status) =>
    ['actor', 'other'].map(
      (assigneeId) =>
        ({
          id: `${assigneeId}-${status}`,
          recordId: 'record',
          lifecycle: 'oa.test',
          status,
          assigneeId,
        }) as TaskRow,
    ),
  );
  const tasksFor = vi.fn(async () => tasks);
  expect(
    (
      await personalDetailTasksFor({ tasksFor }, 'oa.test', 'record', 'actor')
    ).map((task) => task.id),
  ).toEqual(['actor-pending', 'actor-claimed', 'actor-candidate']);
  expect(tasksFor).toHaveBeenCalledWith('oa.test', 'record');
  expect(
    await personalDetailTasksFor({ tasksFor }, 'oa.test', 'record', 'stranger'),
  ).toEqual([]);
  tasksFor.mockRejectedValueOnce(new Error('Read failed'));
  await expect(
    personalDetailTasksFor({ tasksFor }, 'oa.test', 'record', 'actor'),
  ).rejects.toThrow('Read failed');
});
