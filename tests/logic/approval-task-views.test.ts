// @vitest-environment node
import type { ApprovalService } from '@nocobase/app-plugin-approval/server';
import { expect, test, vi } from 'vitest';
import { runTaskViewsFor } from '../../server/providers/approval-runtime/task-views.js';

test('retains run order and task ownership, excluding orphan tasks like the full view', async () => {
  const source = {
    runsFor: vi.fn().mockResolvedValue([{ id: 'older' }, { id: 'newer' }]),
    tasksFor: vi.fn().mockResolvedValue([
      { id: 'second', runId: 'newer', actorId: 'delegate' },
      { id: 'orphan', runId: 'missing', actorId: 'stranger' },
      { id: 'first', runId: 'older', assigneeId: 'copy-recipient' },
    ]),
  } as unknown as Pick<ApprovalService, 'runsFor' | 'tasksFor'>;
  const result = await runTaskViewsFor(source, 'kind', 'record');
  expect(result.map((v) => [v.run.id, v.tasks.map((t) => t.id)])).toEqual([
    ['older', ['first']],
    ['newer', ['second']],
  ]);
  expect(source.runsFor).toHaveBeenCalledWith('kind', 'record');
  expect(source.tasksFor).toHaveBeenCalledWith('kind', 'record');
});

test('fails the read when either public query fails', async () => {
  const source = {
    runsFor: vi.fn().mockResolvedValue([]),
    tasksFor: vi.fn().mockRejectedValue(new Error('database unavailable')),
  } as unknown as Pick<ApprovalService, 'runsFor' | 'tasksFor'>;
  await expect(runTaskViewsFor(source, 'kind', 'record')).rejects.toThrow(
    'database unavailable',
  );
});

test('empty tasks skip runs because this projection is only for task predicates', async () => {
  const source = {
    runsFor: vi.fn(),
    tasksFor: vi.fn().mockResolvedValue([]),
  } as unknown as Pick<ApprovalService, 'runsFor' | 'tasksFor'>;
  expect(await runTaskViewsFor(source, 'kind', 'record')).toEqual([]);
  expect(source.runsFor).not.toHaveBeenCalled();
});

test('run read failure after existing tasks does not return partial tasks', async () => {
  const source = {
    runsFor: vi.fn().mockRejectedValue(new Error('runs unavailable')),
    tasksFor: vi.fn().mockResolvedValue([{ runId: 'existing' }]),
  } as unknown as Pick<ApprovalService, 'runsFor' | 'tasksFor'>;
  await expect(runTaskViewsFor(source, 'kind', 'record')).rejects.toThrow(
    'runs unavailable',
  );
});
