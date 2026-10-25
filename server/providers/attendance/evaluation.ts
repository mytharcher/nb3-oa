import { calculateAttendance } from './calculation.js';
import type {
  AttendanceActivitySources,
  AttendanceBusinessEvidence,
} from './activity-sources.js';
import { demoNow } from '../demo-data/context.js';
import { randomUUID, createHash } from 'node:crypto';
import {
  lockUserForAdministration,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import type {
  DatabaseManager,
  DatabaseConnection,
  RepositoryRecord,
} from '@nocobase/db';
import type { EmployeeService } from '../employees/contract.js';
import type { OrgService } from '../org/contract.js';
import type { CalendarService } from '../platform/calendar.js';
import type { AuditService } from '../audit/index.js';
import type {
  SchedulePointer,
  ScheduleRevision,
  ShiftRevision,
} from '../attendance-management/contract.js';
import type { AttendanceRecord, AttendanceService } from './contract.js';
import type {
  AttendanceEvaluation,
  AttendanceEvaluationRevision,
  AttendanceEvaluationService,
} from './evaluation-contract.js';
import { AttendanceError } from './service.js';

export function createAttendanceEvaluationService(d: {
  db: DatabaseManager;
  users: UserAdministrationService;
  employees: EmployeeService;
  org: OrgService;
  calendar: CalendarService;
  audit: AuditService;
  sources: AttendanceActivitySources;
  attendance: AttendanceService;
}): AttendanceEvaluationService {
  return {
    async evaluate(input, connection) {
      // Snapshot caller-owned input before awaiting a lock.
      const values = { ...input };
      if (
        !values ||
        !validDate(values.date) ||
        !values.userId?.trim() ||
        values.userId.length > 64 ||
        !values.actorId?.trim() ||
        values.actorId.length > 64 ||
        !values.requestKey?.trim() ||
        values.requestKey.length > 128 ||
        !values.reason?.trim() ||
        values.reason.length > 2000
      )
        throw new AttendanceError(
          'ATTENDANCE_EVALUATION_INVALID',
          'Valid employee, date, actor, request key and reason are required.',
        );
      const work = async (tx: DatabaseConnection) => {
        await lockUserForAdministration(tx, values.userId);
        const user = await d.users.withConnection(tx).get(values.userId);
        const employee = await d.employees.getByUserId(values.userId, tx);
        if (!user || user.kind !== 'person' || !employee)
          throw new AttendanceError(
            'ATTENDANCE_IDENTITY_UNAVAILABLE',
            'A real person with an employee archive is required.',
          );
        const pointers = tx.repository<AttendanceEvaluation>(
          'attendanceEvaluations',
        );
        const revisions = tx.repository<AttendanceEvaluationRevision>(
          'attendanceEvaluationRevisions',
        );
        const pointer = await pointers.findOne({
          filter: (f) =>
            f.and([
              f.string('userId').eq(values.userId),
              f.date('date').on(values.date),
            ]),
        });
        if (pointer) {
          const replay = await revisions.findOne({
            filter: { evaluationId: pointer.id, requestKey: values.requestKey },
          });
          if (replay) {
            if (
              replay.actorId !== values.actorId ||
              replay.reason !== values.reason
            )
              throw new AttendanceError(
                'ATTENDANCE_EVALUATION_KEY_CONFLICT',
                'The request key belongs to a different evaluation command.',
              );
            return replay;
          }
        }
        const department = await d.org.primaryDepartmentOf(values.userId, tx);
        const schedule = department
          ? await tx
              .repository<SchedulePointer>('attendanceSchedules')
              .findOne({
                filter: (f) =>
                  f.and([
                    f.string('departmentId').eq(department.id),
                    f.date('date').on(values.date),
                  ]),
              })
          : undefined;
        const scheduleRevision = schedule
          ? await tx
              .repository<ScheduleRevision>('attendanceScheduleRevisions')
              .findOne({ filter: { id: schedule.currentRevisionId } })
          : undefined;
        const shift = scheduleRevision?.shiftRevisionId
          ? await tx
              .repository<ShiftRevision>('attendanceShiftRevisions')
              .findOne({ filter: { id: scheduleRevision.shiftRevisionId } })
          : undefined;
        const result: AttendanceEvaluationRevision['result'] = {
          status: 'normal',
          reasons: [],
          lateMinutes: 0,
          earlyMinutes: 0,
          missingPunches: 0,
          absentMinutes: 0,
        };
        const block = (reason: string) => {
          result.status = 'blocked';
          result.reasons.push(reason);
        };
        const calendar = {
          timeZone: d.calendar.timeZone(),
          day: d.calendar.dayKind(values.date),
          workday: d.calendar.isWorkday(values.date),
        };
        if (!department) block('missingPrimaryDepartment');
        if (!scheduleRevision) block('missingSchedule');
        if (scheduleRevision && !scheduleRevision.restDay && !shift)
          block('missingShiftRevision');
        if (shift && shift.timeZone !== calendar.timeZone)
          block('calendarTimeZoneChanged');
        const intervals: { startAt: string; endAt: string }[] = [];
        if (shift && result.status !== 'blocked') {
          try {
            for (const interval of shift.intervals)
              intervals.push({
                startAt: d.calendar
                  .resolveLocalDateTime(
                    d.calendar.addCalendarDays(
                      values.date,
                      interval.startDayOffset,
                    ),
                    interval.start,
                  )
                  .toISOString(),
                endAt: d.calendar
                  .resolveLocalDateTime(
                    d.calendar.addCalendarDays(
                      values.date,
                      interval.endDayOffset,
                    ),
                    interval.end,
                  )
                  .toISOString(),
              });
          } catch {
            block('unresolvableLocalTime');
          }
        }
        const dates = [values.date, d.calendar.addCalendarDays(values.date, 1)];
        const punches: AttendanceRecord[] = [];
        for (const date of dates)
          punches.push(
            ...(await tx
              .repository<AttendanceRecord>('attendanceRecords')
              .findMany({
                filter: (f) =>
                  f.and([
                    f.string('userId').eq(values.userId),
                    f.date('date').on(date),
                  ]),
                sort: (s) => s.field('id').asc(),
              })),
          );
        const corrections: Correction[] = [];
        for (const punch of punches) {
          if (punch.status === 'corrected') {
            const correction = await tx
              .repository<Correction>('attendanceCorrections')
              .findOne({
                filter: {
                  originalId: punch.id,
                  applicationId: punch.correctedByRequestId,
                  originalVersion: punch.version - 1,
                },
              });
            if (!correction) block('missingCorrectionFact');
            else corrections.push(correction);
          }
        }
        // The owning business adapters establish eligibility; attendance verifies its recorded activity.
        const activities = await tx
          .repository<Activity>('attendanceActivities')
          .findMany({
            filter: { userId: values.userId },
            sort: (s) => s.field('id').asc(),
          });
        const dayStart = d.calendar
          .resolveLocalDateTime(values.date, '00:00')
          .getTime();
        const relevantActivities = activities.filter((a) => {
          const start = instant(a.startAt),
            end = instant(a.endAt);
          if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            end <= start
          ) {
            block('invalidActivityTime');
            return true;
          }
          return intervals.length
            ? intervals.some(
                (interval) =>
                  start < instant(interval.endAt) &&
                  end > instant(interval.startAt),
              )
            : start <
                d.calendar
                  .resolveLocalDateTime(
                    d.calendar.addCalendarDays(values.date, 1),
                    '00:00',
                  )
                  .getTime() && end > dayStart;
        });
        let businessEvidence: AttendanceBusinessEvidence = {
          exemptions: [],
          approvedOvertimeMinutes: 0,
        };
        try {
          businessEvidence = await d.sources.read(
            values.userId,
            values.date,
            tx,
          );
        } catch {
          block('unverifiedActivitySource');
        }
        const exemptions = businessEvidence.exemptions
          .filter((e) => !e.activityId)
          .map((e) => ({ start: instant(e.startAt), end: instant(e.endAt) }));
        for (const activity of relevantActivities) {
          if (activity.active === false) continue;
          const proof = businessEvidence.exemptions.find(
            (e) =>
              e.kind === activity.kind &&
              e.activityId === activity.applicationId,
          );
          if (
            !proof ||
            instant(proof.startAt) !== instant(activity.startAt) ||
            instant(proof.endAt) !== instant(activity.endAt)
          ) {
            block('unverifiedActivitySource');
            continue;
          }
          const end =
            activity.status === 'active'
              ? instant(activity.endAt)
              : activity.actualEndAt
                ? instant(activity.actualEndAt)
                : NaN;
          if (
            !Number.isFinite(end) ||
            end <= instant(activity.startAt) ||
            end > instant(activity.endAt)
          ) {
            block('invalidActivityTime');
            continue;
          }
          exemptions.push({ start: instant(activity.startAt), end });
        }
        if (result.status !== 'blocked') {
          if (!calendar.workday || scheduleRevision?.restDay)
            result.status = 'rest';
          else {
            Object.assign(
              result,
              calculateAttendance({
                shifts: intervals.map((interval) => ({
                  start: instant(interval.startAt),
                  end: instant(interval.endAt),
                })),
                exemptions,
                punches: punches
                  .filter(
                    (p) =>
                      p.source !== 'wecom-checkin' ||
                      p.sourceData.workDate === values.date,
                  )
                  .map((p) => {
                    const at =
                      p.status === 'corrected'
                        ? corrections.find((c) => c.originalId === p.id)
                            ?.punchedAt
                        : p.punchedAt;
                    return {
                      id: p.id,
                      date: p.date,
                      kind: p.punchKind,
                      at: at ? instant(at) : null,
                      expectedAt:
                        typeof p.sourceData.expectedAt === 'string'
                          ? instant(p.sourceData.expectedAt)
                          : undefined,
                      syntheticMissing:
                        p.source === 'oa-evaluation' && p.status === 'missing',
                    };
                  }),
                localDate: (at) => d.calendar.localDate(new Date(at)),
                lateToleranceMinutes: shift!.lateToleranceMinutes,
                earlyToleranceMinutes: shift!.earlyToleranceMinutes,
                absenceThresholdMinutes: shift!.absenceThresholdMinutes,
              }),
            );
          }
        }
        if (result.status === 'exception') {
          const endpoints =
            (
              result as typeof result & {
                missingEndpoints?: { kind: 'in' | 'out'; at: number }[];
              }
            ).missingEndpoints ?? [];
          for (const endpoint of endpoints) {
            // A real date-only missing record already supports the existing correction workflow.
            if (
              punches.some(
                (p) =>
                  p.status === 'missing' &&
                  p.punchKind === endpoint.kind &&
                  p.date === d.calendar.localDate(new Date(endpoint.at)) &&
                  p.source !== 'oa-evaluation',
              )
            )
              continue;
            const expectedAt = new Date(endpoint.at).toISOString();
            await d.attendance.ingest(
              {
                userId: values.userId,
                date: d.calendar.localDate(new Date(endpoint.at)),
                punchKind: endpoint.kind,
                punchedAt: null,
                source: 'oa-evaluation',
                sourceKey: createHash('sha256')
                  .update(
                    JSON.stringify([values.userId, endpoint.kind, expectedAt]),
                  )
                  .digest('hex'),
                sourceData: {
                  expectedAt,
                  evaluationDate: values.date,
                  evidenceType: 'calculated-missing-punch',
                },
              },
              { actorId: values.actorId, connection: tx, calculated: true },
            );
          }
        }
        const id = pointer?.id ?? randomUUID();
        const revisionId = randomUUID();
        const { record } = await revisions.createOne({
          values: {
            id: revisionId,
            evaluationId: id,
            userId: values.userId,
            date: values.date,
            departmentId: department?.id ?? null,
            revision: (pointer?.version ?? -1) + 2,
            requestKey: values.requestKey,
            actorId: values.actorId,
            reason: values.reason,
            createdAt: demoNow().toISOString(),
            snapshot: {
              engineVersion: 2,
              approvedOvertimeMinutes: businessEvidence.approvedOvertimeMinutes,
              approvedExemptions: exemptions,
              userId: values.userId,
              date: values.date,
              employeeId: employee.id,
              departmentId: department?.id ?? null,
              calendar,
              schedule: scheduleRevision ?? null,
              shift: shift ?? null,
              intervals,
              punches: punches.map((p) => ({
                id: p.id,
                version: p.version,
                date: p.date,
                punchKind: p.punchKind,
                punchedAt: p.punchedAt,
                status: p.status,
                correctedByRequestId: p.correctedByRequestId,
              })),
              corrections,
              activityReferences: relevantActivities.map((a) => ({
                id: a.id,
                kind: a.kind,
                applicationId: a.applicationId,
                status: a.status,
              })),
            },
            result,
          },
        });
        if (pointer) {
          const changed = await pointers.updateMany({
            filter: { id, version: pointer.version },
            values: {
              currentRevisionId: revisionId,
              departmentId: department?.id ?? null,
              version: pointer.version + 1,
            },
          });
          if (changed.updatedCount !== 1)
            throw new AttendanceError(
              'ATTENDANCE_EVALUATION_CHANGED',
              'Evaluation changed concurrently.',
            );
        } else
          await pointers.createOne({
            values: {
              id,
              userId: values.userId,
              date: values.date,
              currentRevisionId: revisionId,
              departmentId: department?.id ?? null,
              version: 0,
            },
          });
        await d.audit.record(
          {
            actorId: values.actorId,
            action: 'attendance.evaluate',
            targetType: 'attendanceEvaluations',
            targetId: id,
            reason: values.reason,
            after: {
              revisionId,
              revision: record.revision,
              status: result.status,
            },
          },
          tx,
        );
        return record;
      };
      return connection ? connection.transaction(work) : d.db.transaction(work);
    },
    async read(id, connection, policies, revision) {
      if (
        revision !== undefined &&
        (!Number.isSafeInteger(revision) || revision < 1)
      )
        throw new AttendanceError(
          'ATTENDANCE_EVALUATION_INVALID',
          'A positive revision is required.',
        );
      if (!policies?.current || !policies?.revision)
        throw new AttendanceError(
          'ATTENDANCE_ACCESS_DENIED',
          'Explicit current and revision policies are required.',
        );
      if (policies.current.read === false || policies.revision.read === false)
        return undefined;
      const raw = await connection
        .repository<AttendanceEvaluation>('attendanceEvaluations')
        .findOne({ filter: { id } });
      if (!raw) return undefined;
      const current = await connection
        .repository<AttendanceEvaluation>('attendanceEvaluations')
        .withPolicy(policies.current)
        .findOne({ filter: { id } });
      if (!current || Object.keys(raw).some((k) => !Object.hasOwn(current, k)))
        return undefined;
      const filter =
        revision === undefined
          ? { id: raw.currentRevisionId }
          : { evaluationId: id, revision };
      const full = await connection
        .repository<AttendanceEvaluationRevision>(
          'attendanceEvaluationRevisions',
        )
        .findOne({ filter });
      const visible = await connection
        .repository<AttendanceEvaluationRevision>(
          'attendanceEvaluationRevisions',
        )
        .withPolicy(policies.revision)
        .findOne({ filter });
      if (
        !full ||
        !visible ||
        full.evaluationId !== id ||
        Object.keys(full).some((k) => !Object.hasOwn(visible, k))
      )
        return undefined;
      return visible as AttendanceEvaluationRevision;
    },
  };
}
function validDate(date: string): boolean {
  return (
    typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
  );
}
function instant(value: string): number {
  return Date.parse(
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : `${value.replace(' ', 'T')}Z`,
  );
}

interface Correction extends RepositoryRecord {
  id: string;
  originalId: string;
  applicationId: string;
  originalVersion: number;
  punchedAt: string;
  actorId: string;
  createdAt: string;
}
interface Activity extends RepositoryRecord {
  id: string;
  startAt: string;
  endAt: string;
  kind: string;
  applicationId: string;
  status: string;
  active?: boolean;
  actualEndAt?: string | null;
}
