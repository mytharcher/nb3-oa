import { demoNow } from '../demo-data/context.js';
import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, FilterBuilder } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { OrgService } from '../org/contract.js';
import { isLocalDate } from '../platform/time-zone.js';
import type { CalendarService } from '../platform/index.js';
import {
  AttendanceConfigurationError,
  validateShift,
  type ShiftDefinition,
} from './shift.js';
import type {
  AttendanceManagementService,
  AttendanceWritePolicies,
  ShiftPointer,
  ShiftRevision,
  SchedulePointer,
  ScheduleRevision,
} from './contract.js';
/** Trusted facade. Routes must authorize the current action, fields and record before calling. */
export function createAttendanceManagementService(d: {
  audit: AuditService;
  calendar: CalendarService;
  org: OrgService;
}): AttendanceManagementService {
  return {
    async saveShift(
      input: {
        id?: string;
        code: string;
        definition: ShiftDefinition;
        enabled: boolean;
        expectedVersion: number | null;
        actorId: string;
        reason: string;
      },
      connection: DatabaseConnection,
      policies?: AttendanceWritePolicies,
    ): Promise<{ shift: ShiftPointer; revision: ShiftRevision }> {
      const definition = validateShift(input.definition);
      if (definition.timeZone !== d.calendar.timeZone())
        throw new AttendanceConfigurationError(
          'ATTENDANCE_SHIFT_TIME_ZONE_CHANGED',
        );
      if (
        !/^[a-zA-Z0-9_-]{1,64}$/.test(input.code) ||
        !input.actorId ||
        !input.reason.trim() ||
        input.reason.length > 2000 ||
        typeof input.enabled !== 'boolean' ||
        (input.id
          ? !Number.isSafeInteger(input.expectedVersion) ||
            input.expectedVersion! < 0 ||
            input.expectedVersion! >= 2147483647
          : input.expectedVersion !== null)
      )
        throw new AttendanceConfigurationError('ATTENDANCE_SHIFT_INVALID');
      return connection.transaction(async (tx) => {
        const pointers = policies
          ? tx
              .repository<ShiftPointer>('attendanceShifts')
              .withPolicy(policies.pointer)
          : tx.repository<ShiftPointer>('attendanceShifts');
        const revisions = policies
          ? tx
              .repository<ShiftRevision>('attendanceShiftRevisions')
              .withPolicy(policies.revision)
          : tx.repository<ShiftRevision>('attendanceShiftRevisions');
        let previous: ShiftPointer | undefined;
        if (input.id) {
          const locked = await pointers.updateMany({
            filter: { id: input.id },
            values: { version: { increment: 0 } },
          });
          if (locked.updatedCount !== 1)
            throw new AttendanceConfigurationError(
              'ATTENDANCE_SHIFT_NOT_FOUND',
            );
          const visible = await pointers.findOne({ filter: { id: input.id } });
          if (
            visible &&
            [
              'id',
              'code',
              'name',
              'enabled',
              'currentRevision',
              'version',
            ].some((field) => !Object.hasOwn(visible, field))
          )
            throw new AttendanceConfigurationError('ATTENDANCE_ACCESS_DENIED');
          previous = visible as ShiftPointer | undefined;
          if (!previous || previous.version !== input.expectedVersion)
            throw new AttendanceConfigurationError(
              'ATTENDANCE_VERSION_CONFLICT',
            );
          if (previous.code !== input.code)
            throw new AttendanceConfigurationError(
              'ATTENDANCE_SHIFT_CODE_IMMUTABLE',
            );
        } else if (await pointers.exists({ filter: { code: input.code } })) {
          throw new AttendanceConfigurationError(
            'ATTENDANCE_SHIFT_CODE_CONFLICT',
          );
        }
        const id = previous?.id ?? randomUUID();
        const revisionNumber = (previous?.currentRevision ?? 0) + 1;
        const revision: ShiftRevision = {
          ...definition,
          id: randomUUID(),
          shiftId: id,
          revision: revisionNumber,
          actorId: input.actorId,
          createdAt: demoNow().toISOString(),
        };
        await revisions.createOne({ values: revision });
        const values = {
          name: definition.name,
          enabled: input.enabled,
          currentRevision: revisionNumber,
          version: (previous?.version ?? -1) + 1,
        };
        if (previous)
          await pointers.updateOne({
            filter: { id, version: previous.version },
            values,
          });
        else
          await pointers.createOne({
            values: { id, code: input.code, ...values },
          });
        if (policies) {
          const visible = await pointers.findOne({ filter: { id } });
          if (
            !visible ||
            [
              'id',
              'code',
              'name',
              'enabled',
              'currentRevision',
              'version',
            ].some((field) => !Object.hasOwn(visible, field))
          )
            throw new AttendanceConfigurationError('ATTENDANCE_ACCESS_DENIED');
        }
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'attendance.shift.save',
            targetType: 'attendanceShifts',
            targetId: id,
            before: previous
              ? {
                  revision: previous.currentRevision,
                  enabled: previous.enabled,
                }
              : null,
            after: { revision: revisionNumber, enabled: input.enabled },
            reason: input.reason.trim(),
          },
          tx,
        );
        return { shift: { id, code: input.code, ...values }, revision };
      });
    },
    async saveSchedule(
      input: {
        departmentId: string;
        date: string;
        shiftRevisionId: string | null;
        restDay: boolean;
        expectedVersion: number | null;
        actorId: string;
        reason: string;
      },
      connection: DatabaseConnection,
      policies?: AttendanceWritePolicies,
    ) {
      if (
        !input.departmentId ||
        !isLocalDate(input.date) ||
        !input.actorId ||
        !input.reason.trim() ||
        input.reason.length > 2000 ||
        typeof input.restDay !== 'boolean' ||
        (input.restDay
          ? input.shiftRevisionId !== null
          : !input.shiftRevisionId) ||
        (input.expectedVersion !== null &&
          (!Number.isSafeInteger(input.expectedVersion) ||
            input.expectedVersion < 0 ||
            input.expectedVersion >= 2147483647))
      )
        throw new AttendanceConfigurationError('ATTENDANCE_SCHEDULE_INVALID');
      return connection.transaction(async (tx) => {
        if (!(await d.org.activeChain(input.departmentId, tx)))
          throw new AttendanceConfigurationError(
            'ATTENDANCE_DEPARTMENT_UNAVAILABLE',
          );
        if (input.shiftRevisionId) {
          const revision = await tx
            .repository<ShiftRevision>('attendanceShiftRevisions')
            .findOne({ filter: { id: input.shiftRevisionId } });
          const pointer =
            revision &&
            (await tx
              .repository<ShiftPointer>('attendanceShifts')
              .findOne({ filter: { id: revision.shiftId } }));
          if (!revision || !pointer?.enabled)
            throw new AttendanceConfigurationError(
              'ATTENDANCE_SHIFT_NOT_FOUND',
            );
          if (revision.timeZone !== d.calendar.timeZone())
            throw new AttendanceConfigurationError(
              'ATTENDANCE_SHIFT_TIME_ZONE_CHANGED',
            );
          // Resolve all configured boundaries now; gaps/folds are errors, never silently shifted.
          try {
            for (const interval of revision.intervals) {
              d.calendar.resolveLocalDateTime(
                d.calendar.addCalendarDays(input.date, interval.startDayOffset),
                interval.start,
              );
              d.calendar.resolveLocalDateTime(
                d.calendar.addCalendarDays(input.date, interval.endDayOffset),
                interval.end,
              );
            }
          } catch {
            throw new AttendanceConfigurationError(
              'ATTENDANCE_LOCAL_TIME_INVALID',
            );
          }
        }
        const repository = policies
          ? tx
              .repository<SchedulePointer>('attendanceSchedules')
              .withPolicy(policies.pointer)
          : tx.repository<SchedulePointer>('attendanceSchedules');
        const revisions = policies
          ? tx
              .repository('attendanceScheduleRevisions')
              .withPolicy(policies.revision)
          : tx.repository('attendanceScheduleRevisions');
        const keys = { departmentId: input.departmentId, date: input.date };
        const filter = (f: FilterBuilder) =>
          f.and([
            f.string('departmentId').eq(input.departmentId),
            f.date('date').on(input.date),
          ]);
        await repository.updateMany({
          filter,
          values: { version: { increment: 0 } },
        });
        const previous = await repository.findOne({ filter });
        if (
          previous &&
          ['id', 'departmentId', 'date', 'currentRevisionId', 'version'].some(
            (field) => !Object.hasOwn(previous, field),
          )
        )
          throw new AttendanceConfigurationError('ATTENDANCE_ACCESS_DENIED');
        if (
          previous
            ? previous.version !== input.expectedVersion
            : input.expectedVersion !== null
        )
          throw new AttendanceConfigurationError('ATTENDANCE_VERSION_CONFLICT');
        const id =
          typeof previous?.id === 'string' ? previous.id : randomUUID();
        const version = previous ? Number(previous.version) + 1 : 0;
        const revisionId = randomUUID();
        await revisions.createOne({
          values: {
            id: revisionId,
            scheduleId: id,
            revision: version + 1,
            shiftRevisionId: input.shiftRevisionId,
            restDay: input.restDay,
            actorId: input.actorId,
            reason: input.reason.trim(),
            createdAt: demoNow().toISOString(),
          },
        });
        const values = { currentRevisionId: revisionId, version };
        if (previous)
          await repository.updateOne({
            filter: { id, version: previous.version },
            values,
          });
        else
          await repository.createOne({
            values: { id, ...keys, ...values },
          });
        // Scoped read in this transaction is required: create cannot constrain department.
        if (policies) {
          const visible = await repository.findOne({ filter: { id } });
          if (
            !visible ||
            ['id', 'departmentId', 'date', 'currentRevisionId', 'version'].some(
              (field) => !Object.hasOwn(visible, field),
            )
          )
            throw new AttendanceConfigurationError('ATTENDANCE_ACCESS_DENIED');
        }
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'attendance.schedule.save',
            targetType: 'attendanceSchedules',
            targetId: id,
            before: previous
              ? { revisionId: previous.currentRevisionId }
              : null,
            after: { revisionId },
            reason: input.reason.trim(),
          },
          tx,
        );
        return { id, ...keys, ...values };
      });
    },
    async listShifts(input, tx, policy) {
      if (
        !Number.isSafeInteger(input.page) ||
        input.page < 1 ||
        !Number.isSafeInteger(input.pageSize) ||
        input.pageSize < 1 ||
        input.pageSize > 100 ||
        (input.search !== undefined &&
          (typeof input.search !== 'string' || input.search.length > 200)) ||
        (input.enabled !== undefined &&
          !['all', 'true', 'false'].includes(input.enabled)) ||
        (input.sort !== undefined &&
          !['code', 'name', 'currentRevision'].includes(input.sort)) ||
        (input.direction !== undefined &&
          !['asc', 'desc'].includes(input.direction))
      )
        throw new AttendanceConfigurationError('ATTENDANCE_LIST_INVALID');
      const repository = tx
        .repository<ShiftPointer>('attendanceShifts')
        .withPolicy(policy);
      const filter = (f: FilterBuilder) =>
        f.and([
          ...(input.search
            ? [
                f.or([
                  f
                    .string('code')
                    .includes(input.search, { mode: 'insensitive' }),
                  f
                    .string('name')
                    .includes(input.search, { mode: 'insensitive' }),
                ]),
              ]
            : []),
          ...(input.enabled && input.enabled !== 'all'
            ? [
                input.enabled === 'true'
                  ? f.boolean('enabled').isTrue()
                  : f.boolean('enabled').isFalse(),
              ]
            : []),
        ]);
      const total = await repository.count({ filter });
      const items = await repository.findMany({
        filter,
        sort: (s) => [
          input.direction === 'desc'
            ? s.field(input.sort ?? 'code').desc()
            : s.field(input.sort ?? 'code').asc(),
          s.field('id').asc(),
        ],
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
      });
      return { items, total };
    },
    async schedule(departmentId, date, tx, policies, revisionNumber) {
      if (
        !isLocalDate(date) ||
        (revisionNumber !== undefined &&
          (!Number.isSafeInteger(revisionNumber) || revisionNumber < 1))
      )
        throw new AttendanceConfigurationError('ATTENDANCE_SCHEDULE_INVALID');
      const current = await tx
        .repository<SchedulePointer>('attendanceSchedules')
        .withPolicy(policies.current)
        .findOne({
          filter: (f) =>
            f.and([
              f.string('departmentId').eq(departmentId),
              f.date('date').on(date),
            ]),
        });
      if (!current) return undefined;
      if (typeof current.currentRevisionId !== 'string')
        throw new AttendanceConfigurationError(
          'ATTENDANCE_SCHEDULE_NOT_READABLE',
        );
      const revision = await tx
        .repository<ScheduleRevision>('attendanceScheduleRevisions')
        .withPolicy(policies.revision)
        .findOne({
          filter: revisionNumber
            ? { scheduleId: current.id, revision: revisionNumber }
            : { id: current.currentRevisionId },
        });
      if (!revision)
        throw new AttendanceConfigurationError(
          'ATTENDANCE_SCHEDULE_NOT_READABLE',
        );
      return { current, revision };
    },
    async shiftRevision(
      id: string,
      tx: DatabaseConnection,
    ): Promise<ShiftRevision | undefined> {
      return tx
        .repository<ShiftRevision>('attendanceShiftRevisions')
        .findOne({ filter: { id } });
    },
  };
}
