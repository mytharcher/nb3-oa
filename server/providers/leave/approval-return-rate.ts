import { LEAVE_DETAIL_FIELDS } from './fields.js';
import type { ApprovalService } from '@nocobase/app-plugin-approval/server';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import { LeaveError } from './errors.js';

export interface ReturnRateQuery {
  year: number;
  month?: number;
  page: number;
  pageSize: number;
}

/** Return incidence per submitted run, including historical resubmissions. */
export async function leaveApprovalReturnRate(
  db: DatabaseManager,
  approvals: ApprovalService,
  query: ReturnRateQuery,
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
      'Invalid return-rate query.',
      'precondition',
    );
  // Timeline facts belong to ordinary detail. A partial field grant cannot open a historical side channel.
  const read = policy?.read;
  if (
    read !== true &&
    (typeof read !== 'object' ||
      (read.fields !== undefined &&
        (!Array.isArray(read.fields) ||
          (!read.fields.includes('*') &&
            LEAVE_DETAIL_FIELDS.some(
              (field) =>
                !read.fields ||
                !Array.isArray(read.fields) ||
                !read.fields.includes(field),
            )))))
  )
    throw new LeaveError(
      'LEAVE_FIELDS_RESTRICTED',
      'Return rate requires complete ordinary detail fields.',
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
    number,
    {
      id: string;
      month: number;
      year: number;
      submittedRunCount: number;
      returnedRunCount: number;
      returnDecisionCount: number;
      returnRateBasisPoints: number;
    }
  >();
  const runIds = new Set<string>();
  const taskIds = new Set<string>();
  let inspected = 0;
  for (const row of rows) {
    if (
      typeof row.id !== 'string' ||
      !row.id ||
      typeof row.startDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.startDate)
    )
      throw new LeaveError(
        'REPORT_FACT_INVALID',
        'Request identity or original start date is invalid.',
        'precondition',
      );
    const month = Number(row.startDate.slice(5, 7));
    const views = await approvals.runViewsFor('oa.leave', row.id);
    for (const view of views) {
      const run = view.run;
      if (
        !run.id ||
        run.recordId !== row.id ||
        run.lifecycle !== 'oa.leave' ||
        runIds.has(run.id)
      )
        throw new LeaveError(
          'REPORT_FACT_INVALID',
          'Run identity or ownership is invalid.',
          'precondition',
        );
      runIds.add(run.id);
      if (runIds.size > 10000)
        throw new LeaveError(
          'REPORT_SOURCE_LIMIT',
          'At most 10,000 source runs.',
          'precondition',
        );
      const group = groups.get(month) ?? {
        id: `${query.year}-${String(month).padStart(2, '0')}`,
        year: query.year,
        month,
        submittedRunCount: 0,
        returnedRunCount: 0,
        returnDecisionCount: 0,
        returnRateBasisPoints: 0,
      };
      group.submittedRunCount++;
      let returned = false;
      for (const task of view.tasks) {
        if (++inspected > 10000)
          throw new LeaveError(
            'REPORT_SOURCE_LIMIT',
            'At most 10,000 source tasks.',
            'precondition',
          );
        if (
          !task.id ||
          task.runId !== run.id ||
          task.recordId !== row.id ||
          task.lifecycle !== 'oa.leave' ||
          taskIds.has(task.id)
        )
          throw new LeaveError(
            'REPORT_FACT_INVALID',
            'Task identity or ownership is invalid.',
            'precondition',
          );
        taskIds.add(task.id);
        if (
          task.kind !== 'decide' ||
          task.status !== 'completed' ||
          task.answer !== 'return'
        )
          continue;
        const elapsed = task.closedAt
          ? Date.parse(task.closedAt) - Date.parse(task.createdAt)
          : NaN;
        if (!Number.isSafeInteger(elapsed) || elapsed < 0)
          throw new LeaveError(
            'REPORT_FACT_INVALID',
            'Return decision timestamps are invalid.',
            'precondition',
          );
        group.returnDecisionCount++;
        returned = true;
      }
      if (returned) group.returnedRunCount++;
      groups.set(month, group);
    }
  }
  const data = [...groups.values()]
    .sort((a, b) => a.month - b.month)
    .map((group) => ({
      ...group,
      returnRateBasisPoints: Math.round(
        (group.returnedRunCount * 10000) / group.submittedRunCount,
      ),
    }));
  return {
    data: data.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    ),
    total: data.length,
  };
}
