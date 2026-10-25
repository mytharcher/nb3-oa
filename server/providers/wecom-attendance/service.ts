import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseManager, DatabaseConnection } from '@nocobase/db';
import type { CalendarService } from '../platform/index.js';
import type { OrgService } from '../org/contract.js';
import type { AttendanceManagementService } from '../attendance-management/contract.js';
import type {
  AttendanceService,
  AttendanceIngestInput,
} from '../attendance/contract.js';
import type { EmployeeService } from '../employees/contract.js';
import type { AuditService } from '../audit/index.js';
import type {
  WecomAttendanceConfig,
  WecomAttendanceService,
  WecomAttendanceRun,
} from './contract.js';
import {
  WecomAttendanceClient,
  WecomAttendanceError,
  type WecomCheckin,
} from './client.js';
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const collection = 'wecomAttendanceRuns';
const fail = (code: string): never => {
  throw new WecomAttendanceError(code);
};
export function createWecomAttendanceService(d: {
  config: WecomAttendanceConfig;
  employees: EmployeeService;
  db: DatabaseManager;
  calendar: CalendarService;
  org: OrgService;
  management: AttendanceManagementService;
  attendance: AttendanceService;
  audit: AuditService;
  client?: Pick<WecomAttendanceClient, 'read'>;
}): WecomAttendanceService {
  const config = d.config;
  const configured = () =>
    !!config.corpId.trim() &&
    !!config.secret.trim() &&
    config.mappings.length > 0;
  const client = d.client ?? new WecomAttendanceClient(config);
  async function workDate(
    row: WecomCheckin,
    userId: string,
    tx: DatabaseConnection,
  ) {
    const department = await d.org.primaryDepartmentOf(userId, tx);
    if (!department) return fail('WECOM_MISSING_DEPARTMENT');
    const day = d.calendar.localDate(new Date(row.checkin_time * 1000));
    const dates = [d.calendar.addCalendarDays(day, -1), day];
    const candidates = new Set<string>();
    for (const date of dates) {
      // Trusted source integration consumes the schedule owner's public facade, not its private tables.
      const schedule = await d.management.schedule(department.id, date, tx, {
        current: { read: true, create: false, update: false, delete: false },
        revision: { read: true, create: false, update: false, delete: false },
      });
      if (!schedule?.revision.shiftRevisionId || schedule.revision.restDay)
        continue;
      const shift = await d.management.shiftRevision(
        schedule.revision.shiftRevisionId,
        tx,
      );
      if (!shift || shift.timeZone !== d.calendar.timeZone())
        return fail('WECOM_SCHEDULE_UNRESOLVED');
      for (const interval of shift.intervals) {
        const isIn = row.checkin_type === '上班打卡';
        const expected =
          d.calendar
            .resolveLocalDateTime(
              d.calendar.addCalendarDays(
                date,
                isIn ? interval.startDayOffset : interval.endDayOffset,
              ),
              isIn ? interval.start : interval.end,
            )
            .getTime() / 1000;
        if (row.sch_checkin_time) {
          if (expected === row.sch_checkin_time) candidates.add(date);
        } else {
          // The allowed assignment band is explicit, symmetric and bounded. Competing days remain blocked.
          if (Math.abs(row.checkin_time - expected) <= 12 * 3600)
            candidates.add(date);
        }
      }
    }
    if (candidates.size !== 1) return fail('WECOM_WORKDAY_AMBIGUOUS');
    return [...candidates][0];
  }
  return {
    status: () => ({
      enabled: config.enabled,
      configured: configured(),
      mappedUsers: config.mappings.length,
    }),
    async sync(input) {
      if (!config.enabled) return fail('WECOM_DISABLED');
      if (!configured()) return fail('WECOM_NOT_CONFIGURED');
      if (
        !input.reason.trim() ||
        !input.requestKey.trim() ||
        input.requestKey.length > 128
      )
        return fail('WECOM_INVALID_REQUEST');
      const mapping = [...config.mappings].sort((a, b) =>
        a.wecomUserId.localeCompare(b.wecomUserId),
      );
      if (
        mapping.some((m) => !m.wecomUserId || !m.userId) ||
        new Set(mapping.map((m) => m.userId)).size !== mapping.length ||
        new Set(mapping.map((m) => m.wecomUserId)).size !== mapping.length
      )
        return fail('WECOM_INVALID_MAPPING');
      for (const item of mapping)
        if (!(await d.employees.getByUserId(item.userId)))
          return fail('WECOM_INVALID_MAPPING');
      const days: string[] = [];
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)
      )
        return fail('WECOM_INVALID_WINDOW');
      for (
        let date = input.startDate;
        date <= input.endDate && days.length <= 7;
        date = d.calendar.addCalendarDays(date, 1)
      )
        days.push(date);
      if (
        !days.length ||
        days.length > 7 ||
        input.endDate >= d.calendar.localDate(new Date())
      )
        return fail('WECOM_INVALID_WINDOW');
      const id = hash([input.actorId, input.requestKey]),
        leaseToken = randomUUID();
      const configurationHash = hash([config.corpId, mapping]);
      const claim = await d.db.transaction(async (tx) => {
        const repo = tx.repository<WecomAttendanceRun>(collection),
          now = new Date().toISOString();
        await repo.upsertOne({
          filter: { id },
          create: {
            id,
            ...input,
            state: 'failed',
            errorCode: null,
            configurationHash,
            committedRecords: 0,
            completedBatches: 0,
            completedKeys: [],
            attempts: 0,
            leaseToken: null,
            leaseUntil: null,
            createdAt: now,
            updatedAt: now,
          },
          update: { id },
        });
        const current = (await repo.findOne({ filter: { id } }))!;
        if (
          current.startDate !== input.startDate ||
          current.endDate !== input.endDate ||
          current.configurationHash !== configurationHash ||
          current.reason !== input.reason
        )
          return fail('WECOM_REQUEST_CONFLICT');
        if (current.state === 'completed') return current;
        if (
          current.leaseUntil &&
          new Date(current.leaseUntil).getTime() > Date.now()
        )
          return fail('WECOM_RUNNING');
        await repo.updateOne({
          filter: { id },
          values: {
            state: 'running',
            errorCode: null,
            attempts: current.attempts + 1,
            leaseToken,
            leaseUntil: new Date(Date.now() + 600000).toISOString(),
            updatedAt: now,
          },
        });
        return (await repo.findOne({ filter: { id } }))!;
      });
      if (claim.state === 'completed') return claim;
      try {
        for (const day of days)
          for (let offset = 0; offset < mapping.length; offset += 100) {
            const batch = mapping.slice(offset, offset + 100),
              key = hash([day, batch]);
            const current = (await d.db
              .connection()
              .repository<WecomAttendanceRun>(collection)
              .findOne({ filter: { id } }))!;
            if (current.completedKeys.includes(key)) continue;
            const start =
              d.calendar.resolveLocalDateTime(day, '00:00').getTime() / 1000;
            const end =
              d.calendar
                .resolveLocalDateTime(
                  d.calendar.addCalendarDays(day, 1),
                  '00:00',
                )
                .getTime() / 1000;
            const rows = await client.read(
              batch.map((m) => m.wecomUserId),
              start,
              end,
            );
            await d.db.transaction(async (tx) => {
              const repo = tx.repository<WecomAttendanceRun>(collection);
              await repo.upsertOne({
                filter: { id },
                create: current,
                update: { id },
              });
              const locked = (await repo.findOne({ filter: { id } }))!;
              if (locked.leaseToken !== leaseToken)
                return fail('WECOM_LEASE_LOST');
              if (locked.completedKeys.includes(key)) return;
              const inputs: AttendanceIngestInput[] = [];
              for (const row of rows) {
                const userId = batch.find(
                  (m) => m.wecomUserId === row.userid,
                )?.userId;
                if (!userId) return fail('WECOM_INVALID_MAPPING');
                const date = await workDate(row, userId, tx);
                const sourceData = {
                  workDate: date,
                  corpId: config.corpId,
                  wecomUserId: row.userid,
                  checkinType: row.checkin_type,
                  checkinTime: row.checkin_time,
                  scheduledTime: row.sch_checkin_time ?? null,
                  exceptionType: row.exception_type ?? '',
                  groupId: row.groupid ?? null,
                  scheduleId: row.schedule_id ?? null,
                  timelineId: row.timeline_id ?? null,
                };
                inputs.push({
                  userId,
                  date: d.calendar.localDate(new Date(row.checkin_time * 1000)),
                  punchKind: row.checkin_type === '上班打卡' ? 'in' : 'out',
                  punchedAt: new Date(row.checkin_time * 1000).toISOString(),
                  source: 'wecom-checkin',
                  sourceKey: hash([
                    config.corpId,
                    row.userid,
                    row.checkin_type,
                    row.checkin_time,
                    row.sch_checkin_time ?? null,
                    row.groupid ?? null,
                    row.schedule_id ?? null,
                    row.timeline_id ?? null,
                  ]),
                  sourceData,
                });
              }
              for (let index = 0; index < inputs.length; index += 1000)
                await d.attendance.ingestBatch(inputs.slice(index, index + 1000), {
                  actorId: input.actorId,
                  connection: tx,
                });
              await repo.updateOne({
                filter: { id },
                values: {
                  completedKeys: [...locked.completedKeys, key],
                  completedBatches: locked.completedBatches + 1,
                  committedRecords: locked.committedRecords + inputs.length,
                  leaseUntil: new Date(Date.now() + 600000).toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              });
            });
          }
        await d.db.transaction(async (tx) => {
          await tx.repository<WecomAttendanceRun>(collection).updateOne({
            filter: { id, leaseToken },
            values: {
              state: 'completed',
              errorCode: null,
              leaseToken: null,
              leaseUntil: null,
              updatedAt: new Date().toISOString(),
            },
          });
          await d.audit.record(
            {
              actorId: input.actorId,
              action: 'attendance.wecomSync',
              targetType: collection,
              targetId: id,
              after: {
                startDate: input.startDate,
                endDate: input.endDate,
                reason: input.reason,
              },
            },
            tx,
          );
        });
      } catch (error) {
        await d.db
          .connection()
          .repository<WecomAttendanceRun>(collection)
          .updateOne({
            filter: { id, leaseToken },
            values: {
              state: 'failed',
              errorCode:
                error instanceof WecomAttendanceError
                  ? error.code
                  : 'WECOM_SYNC_FAILED',
              leaseToken: null,
              leaseUntil: null,
              updatedAt: new Date().toISOString(),
            },
          });
      }
      return (await d.db
        .connection()
        .repository<WecomAttendanceRun>(collection)
        .findOne({ filter: { id } }))!;
    },
  };
}
