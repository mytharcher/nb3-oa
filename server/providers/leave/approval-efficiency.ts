import type { ApprovalService } from '@nocobase/app-plugin-approval/server';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import { LeaveError } from './errors.js';

export interface EfficiencyQuery {
  year: number;
  month?: number;
  page: number;
  pageSize: number;
}

/** Natural elapsed task age, including waiting. Never an SLA or working-hours metric. */
export async function leaveApprovalEfficiency(
  db: DatabaseManager,
  approvals: ApprovalService,
  query: EfficiencyQuery,
  policy: RepositoryPolicy,
) {
  if (
    !Number.isInteger(query.year) ||
    query.year < 1900 ||
    query.year > 9998 ||
    (query.month !== undefined &&
      (!Number.isInteger(query.month) ||
        query.month < 1 ||
        query.month > 12)) ||
    !Number.isInteger(query.page) ||
    query.page < 1 ||
    !Number.isInteger(query.pageSize) ||
    query.pageSize < 1 ||
    query.pageSize > 10000
  )
    throw new LeaveError(
      'INVALID_REPORT_QUERY',
      'Invalid efficiency query.',
      'precondition',
    );
  // Timeline facts belong to ordinary detail. A partial field grant cannot open a historical side channel.
  const read = policy.read;
  if (
    read !== true &&
    (typeof read !== 'object' ||
      (read.fields !== undefined &&
        (!Array.isArray(read.fields) ||
          (!read.fields.includes('*') &&
            [
              'id',
              'applicantId',
              'createdById',
              'number',
              'leaveType',
              'startDate',
              'endDate',
              'startHalf',
              'endHalf',
              'days',
              'reason',
              'attachments',
              'handoverUserId',
              'enableDelegation',
              'ruleSnapshot',
              'hrRecipients',
              'requiresHr',
              'managerApproverId',
              'status',
              'lifecycleVersion',
              'createdAt',
            ].some(
              (field) =>
                !read.fields ||
                !Array.isArray(read.fields) ||
                !read.fields.includes(field),
            )))))
  )
    throw new LeaveError(
      'LEAVE_FIELDS_RESTRICTED',
      'Efficiency requires complete ordinary detail fields.',
      'permission',
    );
  const prefix = `${query.year}-${String(query.month ?? 1).padStart(2, '0')}`;
  const rows = await db
    .repository('leaveRequests')
    .withPolicy(policy)
    .findMany({
      limit: 1001,
      select: (s) => s.fields('id', 'startDate'),
      filter: (f) =>
        f.and([
          f.date('startDate').notBefore(`${prefix}-01`),
          f
            .date('startDate')
            .before(
              query.month && query.month < 12
                ? `${query.year}-${String(query.month + 1).padStart(2, '0')}-01`
                : `${query.year + 1}-01-01`,
            ),
        ]),
    });
  if (rows.length > 1000)
    throw new LeaveError(
      'REPORT_SOURCE_LIMIT',
      'At most 1,000 authorized matching requests.',
      'precondition',
    );
  const groups = new Map<
    string,
    {
      id: string;
      stage: string;
      completedTaskCount: number;
      totalElapsedMs: number;
      averageElapsedMs: number;
    }
  >();
  let inspected = 0;
  for (const row of rows) {
    if (typeof row.id !== 'string' || !row.id)
      throw new LeaveError(
        'REPORT_FACT_INVALID',
        'Request identity is missing.',
        'precondition',
      );
    const runs = await approvals.runViewsFor('oa.leave', row.id);
    for (const view of runs)
      for (const task of view.tasks) {
        if (++inspected > 10000)
          throw new LeaveError(
            'REPORT_SOURCE_LIMIT',
            'At most 10,000 source tasks.',
            'precondition',
          );
        if (task.kind !== 'decide' || task.status !== 'completed') continue;
        const elapsed = task.closedAt
          ? Date.parse(task.closedAt) - Date.parse(task.createdAt)
          : NaN;
        if (!Number.isSafeInteger(elapsed) || elapsed < 0)
          throw new LeaveError(
            'REPORT_FACT_INVALID',
            'Completed task has invalid timestamps.',
            'precondition',
          );
        const group = groups.get(task.stage) ?? {
          id: task.stage,
          stage: task.stage,
          completedTaskCount: 0,
          totalElapsedMs: 0,
          averageElapsedMs: 0,
        };
        group.completedTaskCount++;
        group.totalElapsedMs += elapsed;
        if (!Number.isSafeInteger(group.totalElapsedMs))
          throw new LeaveError(
            'REPORT_FACT_INVALID',
            'Elapsed total exceeds safe precision.',
            'precondition',
          );
        groups.set(task.stage, group);
      }
  }
  const data = [...groups.values()]
    .sort((a, b) => a.stage.localeCompare(b.stage))
    .map((g) => ({
      ...g,
      averageElapsedMs: Math.round(g.totalElapsedMs / g.completedTaskCount),
    }));
  return {
    data: data.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    ),
    total: data.length,
  };
}
