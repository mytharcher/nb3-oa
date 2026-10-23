// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { createUserTaskService } from '@nocobase/app-plugin-task-center/server';
import type { DatabaseManager } from '@nocobase/db';
it('the compatibility patch filters closed states before paging and preserves owner-scoped facets independently of tab status', async () => {
  type FilterBuilder = {
    string(name: string): { eq(value: string): unknown };
    and(values: unknown[]): unknown;
    or(values: unknown[]): unknown;
  };
  const findMany = vi
      .fn<
        (options: {
          filter(builder: FilterBuilder): unknown;
          offset: number;
          limit: number;
        }) => Promise<never[]>
      >()
      .mockResolvedValue([]),
    count = vi.fn().mockResolvedValue(7);
  const groupBy = vi
    .fn()
    .mockResolvedValueOnce([
      { status: 'pending', count: 2 },
      { status: 'completed', count: 5 },
      { status: 'cancelled', count: 2 },
    ])
    .mockResolvedValueOnce([
      {
        sourceType: 'approval.task',
        subject: 'oa.leave',
        status: 'pending',
        count: 2,
      },
      {
        sourceType: 'approval.task',
        subject: 'oa.leave',
        status: 'completed',
        count: 5,
      },
      {
        sourceType: 'approval.cc',
        subject: 'oa.purchase',
        status: 'completed',
        count: 1,
      },
    ]);
  const repository = { findMany, count, groupBy };
  const connection = { repository: vi.fn().mockReturnValue(repository) };
  const transaction = vi.fn(
    async (work: (tx: typeof connection) => Promise<unknown>) =>
      work(connection),
  );
  const service = createUserTaskService({
    transaction,
  } as unknown as DatabaseManager);
  const result = await service.center('owner', {
    status: 'closed',
    sourceType: 'approval.task',
    subject: 'oa.leave',
    page: 2,
    pageSize: 3,
  });
  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      offset: 3,
      limit: 3,
      filter: expect.any(Function),
    }),
  );
  expect(count).toHaveBeenCalledWith({
    filter: findMany.mock.calls[0][0].filter,
  });
  expect(groupBy).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      by: ['status'],
      filter: {
        userId: 'owner',
        sourceType: 'approval.task',
        subject: 'oa.leave',
      },
    }),
  );
  expect(groupBy).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ filter: { userId: 'owner' } }),
  );
  expect(result.meta.total).toBe(7);
  expect(result.counts).toEqual({ pending: 2, completed: 5, cancelled: 2 });
  expect(result.facets).toEqual([
    { sourceType: 'approval.task', subject: 'oa.leave', pending: 2 },
    { sourceType: 'approval.cc', subject: 'oa.purchase', pending: 0 },
  ]);
  // Evaluate the filter contract so closed never means fetching all then slicing in memory.
  const field = (name: string) => ({
    eq: (value: string) => ({ field: name, value }),
  });
  const filter = findMany.mock.calls[0][0].filter;
  expect(
    filter({
      string: field,
      and: (values: unknown[]) => values,
      or: (values: unknown[]) => ({ or: values }),
    }),
  ).toEqual([
    { field: 'userId', value: 'owner' },
    { field: 'sourceType', value: 'approval.task' },
    { field: 'subject', value: 'oa.leave' },
    {
      or: [
        { field: 'status', value: 'completed' },
        { field: 'status', value: 'cancelled' },
      ],
    },
  ]);
  await expect(
    service.center('owner', { userId: 'another-user' } as never),
  ).rejects.toThrow();
  expect(transaction).toHaveBeenCalledTimes(1);
});
