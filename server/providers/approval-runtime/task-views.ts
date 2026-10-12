import type { ApprovalService } from '@nocobase/app-plugin-approval/server';

/** Preserves run/task association without loading events and timelines.
 * Empty tasks need no run query. Use only for task predicates, never run/history rendering.
 */
export async function runTaskViewsFor(
  approvals: Pick<ApprovalService, 'runsFor' | 'tasksFor'>,
  lifecycle: string,
  recordId: string,
) {
  const tasks = await approvals.tasksFor(lifecycle, recordId);
  if (!tasks.length) return [];
  const runs = await approvals.runsFor(lifecycle, recordId);
  return runs.map((run) => ({
    run,
    tasks: tasks.filter((task) => task.runId === run.id),
  }));
}
