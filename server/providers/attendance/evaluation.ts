import { demoNow } from '../demo-data/context.js';
import { randomUUID } from 'node:crypto';
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
import type { AttendanceRecord } from './contract.js';
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
        // Rows are not proof of approved business sources. Conservatively block overlap until owner adapters exist.
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
        if (relevantActivities.length) block('unverifiedActivitySource');
        if (result.status !== 'blocked') {
          if (!calendar.workday || scheduleRevision?.restDay)
            result.status = 'rest';
          else if (intervals.length !== 1)
            block('multipleIntervalsRequireMatchingAdapter');
          else {
            const interval = intervals[0];
            const effective = punches.map((p) => ({
              id: p.id,
              date: p.date,
              kind: p.punchKind,
              at:
                p.status === 'corrected'
                  ? corrections.find((c) => c.originalId === p.id)?.punchedAt
                  : p.punchedAt,
            }));
            const start = instant(interval.startAt),
              end = instant(interval.endAt);
            // Each punch belongs to the company date of its explicit endpoint.
            // A next-day out must never complete a same-day shift; overnight out is intentionally next-day.
            const startDate = d.calendar.localDate(new Date(start));
            const endDate = d.calendar.localDate(new Date(end));
            const ins = effective.filter(
              (p) =>
                p.kind === 'in' &&
                p.date === startDate &&
                (p.at === null ||
                  (p.at &&
                    d.calendar.localDate(new Date(instant(p.at))) ===
                      startDate &&
                    instant(p.at) < end)),
            );
            const outs = effective.filter(
              (p) =>
                p.kind === 'out' &&
                p.date === endDate &&
                (p.at === null ||
                  (p.at &&
                    d.calendar.localDate(new Date(instant(p.at))) === endDate &&
                    instant(p.at) > start)),
            );
            if (ins.length > 1 || outs.length > 1)
              block('ambiguousPunchEvidence');
            else {
              const inAt = ins[0]?.at,
                outAt = outs[0]?.at;
              result.missingPunches = Number(!inAt) + Number(!outAt);
              result.lateMinutes = inAt
                ? Math.max(0, (instant(String(inAt)) - start) / 60000)
                : 0;
              result.earlyMinutes = outAt
                ? Math.max(0, (end - instant(String(outAt))) / 60000)
                : 0;
              if (
                inAt &&
                outAt &&
                instant(String(inAt)) >= instant(String(outAt))
              )
                block('invalidPunchOrder');
              else {
                if (result.missingPunches) result.reasons.push('missingPunch');
                if (result.lateMinutes > shift!.lateToleranceMinutes)
                  result.reasons.push('late');
                if (result.earlyMinutes > shift!.earlyToleranceMinutes)
                  result.reasons.push('early');
                if (
                  result.missingPunches === 2 &&
                  (end - start) / 60000 >= shift!.absenceThresholdMinutes
                ) {
                  result.absentMinutes = (end - start) / 60000;
                  result.reasons.push('absent');
                }
                result.status = result.reasons.length ? 'exception' : 'normal';
              }
            }
          }
        }
        const id = pointer?.id ?? randomUUID();
        const revisionId = randomUUID();
        const { record } = await revisions.createOne({
          values: {
            id: revisionId,
            evaluationId: id,
            revision: (pointer?.version ?? -1) + 2,
            requestKey: values.requestKey,
            actorId: values.actorId,
            reason: values.reason,
            createdAt: demoNow().toISOString(),
            snapshot: {
              engineVersion: 1,
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
}
