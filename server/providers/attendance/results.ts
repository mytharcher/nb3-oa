import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type {
  AttendanceEvaluation,
  AttendanceEvaluationRevision,
} from './evaluation-contract.js';
import { AttendanceError } from './service.js';
export interface AttendanceResultRow {
  id: string;
  userId: string;
  date: string;
  revision: number;
  calculatedAt: string;
  result: AttendanceEvaluationRevision['result'];
  approvedOvertimeMinutes: number;
  missingPunches: {
    id: string;
    date: string;
    punchKind: string;
    version: number;
  }[];
}
/** Policies apply before paging, totals or export. No raw snapshot leaves this projection. */
export async function listAttendanceResults(
  connection: DatabaseConnection,
  input: { month: string; userId?: string; departmentId?: string },
  policies: { current: RepositoryPolicy; revision: RepositoryPolicy },
): Promise<AttendanceResultRow[]> {
  const currents = await connection
    .repository<AttendanceEvaluation>('attendanceEvaluations')
    .withPolicy(policies.current)
    .findMany({
      filter: (f) =>
        f.and([
          f.date('date').notBefore(`${input.month}-01`),
          f
            .date('date')
            .notAfter(
              `${input.month}-${new Date(Date.UTC(Number(input.month.slice(0, 4)), Number(input.month.slice(5)), 0)).getUTCDate()}`,
            ),
          ...(input.userId ? [f.string('userId').eq(input.userId)] : []),
          ...(input.departmentId
            ? [f.string('departmentId').eq(input.departmentId)]
            : []),
        ]),
      sort: (s) => [s.field('date').desc(), s.field('userId').asc()],
    });
  for (const row of currents)
    if (!row.id || !row.userId || !row.date || !row.currentRevisionId)
      throw new AttendanceError(
        'ATTENDANCE_ACCESS_DENIED',
        'The selected fields do not permit attendance results.',
      );
  if (!currents.length) return [];
  const revisions = await connection
    .repository<AttendanceEvaluationRevision>('attendanceEvaluationRevisions')
    .withPolicy(policies.revision)
    .findMany({
      filter: (f) =>
        f.or(currents.map((row) => f.string('id').eq(row.currentRevisionId!))),
    });
  const byId = new Map(revisions.map((r) => [r.id, r]));
  const rows: AttendanceResultRow[] = [];
  for (const current of currents) {
    const revision = byId.get(current.currentRevisionId);
    if (!revision) continue;
    if (
      !revision.result ||
      !revision.createdAt ||
      !revision.revision ||
      !revision.snapshot
    )
      throw new AttendanceError(
        'ATTENDANCE_ACCESS_DENIED',
        'The selected fields do not permit attendance result details.',
      );
    rows.push({
      id: current.id!,
      userId: current.userId!,
      date: current.date!,
      revision: revision.revision,
      calculatedAt: revision.createdAt,
      result: revision.result,
      approvedOvertimeMinutes: Number(
        revision.snapshot.approvedOvertimeMinutes ?? 0,
      ),
      missingPunches: [],
    });
  }
  if (rows.some((row) => row.result.missingPunches > 0)) {
    const missing = await connection
      .repository<import('./contract.js').AttendanceRecord>('attendanceRecords')
      .findMany({
        filter: (f) =>
          f.and([
            f.string('status').eq('missing'),
            f.or(
              rows
                .filter((row) => row.result.missingPunches > 0)
                .map((row) => f.string('userId').eq(row.userId)),
            ),
          ]),
      });
    for (const row of rows) {
      if (!row.result.missingPunches) continue;
      const endpoints = (
        row.result as typeof row.result & {
          missingEndpoints?: { kind: string; at: number }[];
        }
      ).missingEndpoints;
      row.missingPunches = missing
        .filter(
          (p) =>
            p.userId === row.userId &&
            (p.source === 'oa-evaluation'
              ? p.sourceData.evaluationDate === row.date &&
                (!endpoints ||
                  endpoints.some(
                    (e) =>
                      e.kind === p.punchKind &&
                      new Date(e.at).toISOString() === p.sourceData.expectedAt,
                  ))
              : p.date === row.date),
        )
        .map((p) => ({
          id: p.id,
          date: p.date,
          punchKind: p.punchKind,
          version: p.version,
        }));
    }
  }
  return rows;
}

export async function assertAttendanceDayEnded(
  connection: DatabaseConnection,
  userId: string,
  date: string,
  calendar: import('../platform/calendar.js').CalendarService,
  org: import('../org/contract.js').OrgService,
  now = new Date(),
) {
  const department = await org.primaryDepartmentOf(userId, connection);
  const schedule = department
    ? await connection
        .repository<
          import('../attendance-management/contract.js').SchedulePointer
        >('attendanceSchedules')
        .findOne({
          filter: (f) =>
            f.and([
              f.string('departmentId').eq(department.id),
              f.date('date').on(date),
            ]),
        })
    : undefined;
  const revision = schedule
    ? await connection
        .repository<
          import('../attendance-management/contract.js').ScheduleRevision
        >('attendanceScheduleRevisions')
        .findOne({ filter: { id: schedule.currentRevisionId } })
    : undefined;
  const shift = revision?.shiftRevisionId
    ? await connection
        .repository<
          import('../attendance-management/contract.js').ShiftRevision
        >('attendanceShiftRevisions')
        .findOne({ filter: { id: revision.shiftRevisionId } })
    : undefined;
  const end = shift
    ? Math.max(
        ...shift.intervals.map((interval) =>
          calendar
            .resolveLocalDateTime(
              calendar.addCalendarDays(date, interval.endDayOffset),
              interval.end,
            )
            .getTime(),
        ),
      )
    : calendar
        .resolveLocalDateTime(calendar.addCalendarDays(date, 1), '00:00')
        .getTime();
  if (end > now.getTime())
    throw new AttendanceError(
      'ATTENDANCE_DAY_NOT_ENDED',
      'The scheduled shift has not ended.',
    );
}
