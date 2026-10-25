// @vitest-environment node
import { expect, it } from 'vitest';
import type { RunView } from '@nocobase/app-plugin-approval/server';
import { processMetrics } from '../../../server/providers/process-operations/metrics.js';
const at = (hour: number) =>
  new Date(Date.UTC(2026, 9, 25, hour)).toISOString();
function task(id: string, start: number, end: number | null, extra = {}) {
  return {
    id,
    stage: 'manager',
    enteredVersion: 1,
    role: 'decide',
    status: end === null ? 'pending' : 'completed',
    createdAt: at(start),
    closedAt: end === null ? null : at(end),
    dueAt: null,
    ...extra,
  };
}
function run(
  start: number,
  end: number | null,
  outcome: string | null,
  tasks: unknown[],
) {
  return {
    run: {
      startedAt: at(start),
      endedAt: end === null ? null : at(end),
      outcome,
    },
    tasks,
  } as RunView;
}
it('counts returned applications once, includes resubmission waiting and unions parallel stages per entry', () => {
  const result = processMetrics(
    [
      {
        kind: 'oa.leave',
        recordId: 'a',
        number: 'A',
        departmentId: null,
        runs: [
          run(0, 2, 'returned', [task('a', 0, 2, { answer: 'return' })]),
          run(5, 10, 'approved', [task('b', 5, 8), task('c', 6, 10)]),
        ],
      },
      {
        kind: 'oa.outing',
        recordId: 'b',
        number: 'B',
        departmentId: null,
        runs: [
          run(1, null, null, [
            task('d', 1, null, { dueAt: at(4) }),
            task('e', 3, null, { dueAt: null }),
            task('f', 2, null, { role: 'info', dueAt: at(3) }),
          ]),
        ],
      },
      {
        kind: 'oa.leave',
        recordId: 'c',
        number: 'C',
        departmentId: null,
        runs: [run(0, 1, 'withdrawn', [task('g', 0, 1, { status: 'voided' })])],
      },
    ],
    new Date(at(12)),
  );
  expect(result.processes).toEqual([
    {
      kind: 'oa.leave',
      submitted: 2,
      completed: 1,
      averageElapsedMs: 10 * 3600000,
      returned: 1,
      returnRate: 0.5,
    },
    {
      kind: 'oa.outing',
      submitted: 1,
      completed: 0,
      averageElapsedMs: null,
      returned: 0,
      returnRate: 0,
    },
  ]);
  expect(result.stages.find((s) => s.kind === 'oa.leave')).toMatchObject({
    completed: 3,
    averageElapsedMs: Math.round((8 * 3600000) / 3),
    waiting: 0,
  });
  expect(result.stages.find((s) => s.kind === 'oa.outing')).toMatchObject({
    completed: 0,
    waiting: 1,
    oldestWaitingMs: 11 * 3600000,
  });
  expect(result.overdue).toEqual([
    {
      kind: 'oa.outing',
      recordId: 'b',
      number: 'B',
      stage: 'manager',
      taskId: 'd',
      dueAt: at(4),
      overdueMs: 8 * 3600000,
    },
  ]);
});
it('separates repeated stage entries within one run', () => {
  const result = processMetrics(
    [
      {
        kind: 'oa.leave',
        recordId: 'a',
        number: null,
        departmentId: null,
        runs: [
          run(0, 8, 'approved', [
            task('a', 0, 2),
            task('b', 5, 8, { enteredVersion: 3 }),
          ]),
        ],
      },
    ],
    new Date(at(12)),
  );
  expect(result.stages[0]).toMatchObject({
    completed: 2,
    averageElapsedMs: 2.5 * 3600000,
  });
});
