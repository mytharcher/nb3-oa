// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { allRows } from '../../../server/routes/reports/export.js';

it.each([
  { data: [], meta: { total: 2 } },
  { data: ['second'], meta: { total: 3 } },
  { data: ['second', 'extra'], meta: { total: 2 } },
])(
  'rejects a changing export without looping or emitting partial rows (%j)',
  async (next) => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ data: ['first'], meta: { total: 2 } })
      .mockResolvedValue(next);
    await expect(allRows(load)).rejects.toMatchObject({
      reason: 'SOURCE_CHANGED',
    });
    expect(load).toHaveBeenCalledTimes(2);
  },
);
it('rejects over-limit exports before requesting more pages and rechecks every allowed page', async () => {
  const tooLarge = vi
    .fn()
    .mockResolvedValue({ data: ['first'], meta: { total: 10001 } });
  await expect(allRows(tooLarge)).rejects.toMatchObject({
    reason: 'EXPORT_LIMIT_EXCEEDED',
  });
  expect(tooLarge).toHaveBeenCalledTimes(1);
  const load = vi
    .fn()
    .mockResolvedValueOnce({ data: ['first'], meta: { total: 2 } })
    .mockResolvedValueOnce({ data: ['second'], meta: { total: 2 } });
  expect(await allRows(load)).toEqual(['first', 'second']);
  expect(load.mock.calls).toEqual([[1], [2]]);
});
