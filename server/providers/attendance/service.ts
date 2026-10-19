import { demoNow } from '../demo-data/context.js';
import { isDeepStrictEqual } from 'node:util';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import type { EmployeeService } from '../employees/contract.js';
import { randomUUID } from 'node:crypto';
import type { DatabaseManager, DatabaseConnection } from '@nocobase/db';
import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { AuditService } from '../audit/index.js';
import type { CalendarService } from '../platform/index.js';
import type {
  AttendanceIngestInput,
  AttendanceRecord,
  AttendanceService,
} from './contract.js';
export class AttendanceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AttendanceError';
  }
}
export function createAttendanceService(d: {
  db: DatabaseManager;
  users: UserAdministrationService;
  employees: EmployeeService;
  audit: AuditService;
  calendar: CalendarService;
}): AttendanceService {
  const service: AttendanceService = {
    get: (id, connection) =>
      (connection ?? d.db)
        .repository<AttendanceRecord>('attendanceRecords')
        .findOne({ filter: { id } }),
    async ingest(input, context) {
      const work = async (connection: DatabaseConnection) => {
        validateEvidence(input);
        await lockUserForAdministration(connection, input.userId);
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
          !Number.isFinite(Date.parse(`${input.date}T00:00:00Z`)) ||
          new Date(`${input.date}T00:00:00Z`).toISOString().slice(0, 10) !==
            input.date ||
          !['in', 'out'].includes(input.punchKind)
        )
          throw new AttendanceError(
            'ATTENDANCE_INVALID_INPUT',
            'A valid date and punch kind are required.',
          );
        if (
          input.punchedAt &&
          (!Number.isFinite(Date.parse(input.punchedAt)) ||
            d.calendar.localDate(new Date(input.punchedAt)) !== input.date)
        )
          throw new AttendanceError(
            'ATTENDANCE_INVALID_TIME',
            'The punch time must fall on the local attendance date.',
          );
        const rawRepository =
          connection.repository<AttendanceRecord>('attendanceRecords');
        const repository = context.policy
          ? rawRepository.withPolicy(context.policy)
          : rawRepository;
        const previous = (await repository.findOne({
          filter: { source: input.source, sourceKey: input.sourceKey },
        })) as AttendanceRecord | undefined;
        if (context.policy) {
          const raw = await rawRepository.findOne({
            filter: { source: input.source, sourceKey: input.sourceKey },
          });
          if (
            raw &&
            (!previous ||
              Object.keys(raw).some((field) => !Object.hasOwn(previous, field)))
          )
            throw new AttendanceError(
              'ATTENDANCE_ACCESS_DENIED',
              'Evidence is not completely readable.',
            );
        }
        if (previous) {
          if (
            previous.userId !== input.userId ||
            previous.date !== input.date ||
            previous.punchKind !== input.punchKind ||
            normalizeTime(previous.punchedAt) !==
              normalizeTime(input.punchedAt) ||
            !isDeepStrictEqual(previous.sourceData, input.sourceData)
          )
            throw new AttendanceError(
              'ATTENDANCE_SOURCE_CONFLICT',
              'This source key already identifies different attendance evidence.',
            );
          return previous;
        }
        const now = demoNow().toISOString();
        const { record } = await repository.createOne({
          values: {
            ...input,
            id: randomUUID(),
            version: 0,
            status: input.punchedAt ? 'recorded' : 'missing',
            correctedByRequestId: null,
            createdAt: now,
            updatedAt: now,
          },
        });
        await d.audit.record(
          {
            actorId: context.actorId,
            action: 'attendance.ingest',
            targetType: 'attendanceRecords',
            targetId: record.id,
          },
          connection,
        );
        const visible = await repository.findOne({ filter: { id: record.id } });
        const full = await rawRepository.findOne({ filter: { id: record.id } });
        if (
          !full ||
          !visible ||
          Object.keys(full).some((field) => !Object.hasOwn(visible, field))
        )
          throw new AttendanceError(
            'ATTENDANCE_ACCESS_DENIED',
            'Imported evidence is not completely readable.',
          );
        return full;
      };
      return context.connection
        ? work(context.connection)
        : d.db.transaction(work);
    },
    async ingestBatch(inputs, context) {
      if (
        !Array.isArray(inputs) ||
        inputs.length < 1 ||
        inputs.length > 1000 ||
        !context.actorId?.trim()
      )
        throw new AttendanceError(
          'ATTENDANCE_INVALID_BATCH',
          'A batch of 1–1000 rows and an actor are required.',
        );
      // Snapshot caller-owned objects before awaits so validation cannot be invalidated by mutation.
      const rows: AttendanceIngestInput[] = inputs.map(
        (input: AttendanceIngestInput) => {
          validateEvidence(input);
          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
            !Number.isFinite(Date.parse(`${input.date}T00:00:00Z`)) ||
            new Date(`${input.date}T00:00:00Z`).toISOString().slice(0, 10) !==
              input.date ||
            !['in', 'out'].includes(input.punchKind)
          )
            throw new AttendanceError(
              'ATTENDANCE_INVALID_INPUT',
              'A valid date and punch kind are required.',
            );
          if (
            input.punchedAt &&
            (!Number.isFinite(Date.parse(input.punchedAt)) ||
              d.calendar.localDate(new Date(input.punchedAt)) !== input.date)
          )
            throw new AttendanceError(
              'ATTENDANCE_INVALID_TIME',
              'The punch time must fall on the local attendance date.',
            );
          return {
            ...input,
            sourceData: JSON.parse(JSON.stringify(input.sourceData)) as Record<
              string,
              unknown
            >,
          };
        },
      );
      if (
        rows.reduce(
          (bytes, row) =>
            bytes + Buffer.byteLength(JSON.stringify(row.sourceData), 'utf8'),
          0,
        ) >
        8 * 1024 * 1024
      )
        throw new AttendanceError(
          'ATTENDANCE_INVALID_BATCH',
          'Batch source evidence must not exceed 8 MiB.',
        );
      const work = async (connection: DatabaseConnection) => {
        // Stable identity lock order across different batch row orders.
        for (const userId of [
          ...new Set(rows.map((row) => row.userId)),
        ].sort()) {
          await lockUserForAdministration(connection, userId);
          const user = await d.users.withConnection(connection).get(userId);
          const employee = await d.employees.getByUserId(userId, connection);
          // Historical evidence may refer to departed/disabled real employees.
          if (!user || user.kind !== 'person' || !employee)
            throw new AttendanceError(
              'ATTENDANCE_IDENTITY_UNAVAILABLE',
              'Attendance evidence requires a real person with an employee archive.',
            );
        }
        const results: AttendanceRecord[] = [];
        for (const row of rows)
          results.push(await service.ingest(row, { ...context, connection }));
        return results;
      };
      return context.connection
        ? context.connection.transaction(work)
        : d.db.transaction(work);
    },
    async recordActivity(input, connection) {
      await lockUserForAdministration(connection, input.userId);
      const existing = await connection
        .repository('attendanceActivities')
        .findOne({
          filter: { kind: input.kind, applicationId: input.applicationId },
        });
      if (existing)
        throw new AttendanceError(
          'ATTENDANCE_ACTIVITY_DUPLICATE',
          'This application already has an attendance activity.',
        );
      await connection.repository('attendanceActivities').createOne({
        values: {
          kind: input.kind,
          applicationId: input.applicationId,
          userId: input.userId,
          startAt: input.startAt,
          endAt: input.endAt,
          actorId: input.actorId,
          id: randomUUID(),
          active: true,
          status: 'active',
          actualEndAt: null,
          createdAt: input.now.toISOString(),
          updatedAt: input.now.toISOString(),
        },
      });
      await d.audit.record(
        {
          actorId: input.actorId,
          action: 'attendance.activity',
          targetType: 'attendanceActivities',
          targetId: input.applicationId,
        },
        connection,
      );
    },
    async endActivity(input, connection) {
      await lockUserForAdministration(connection, input.userId);
      const repository = connection.repository<{
        id: string;
        userId: string;
        startAt: string;
        endAt: string;
        status: string;
        active: boolean;
        kind: string;
        applicationId: string;
        updatedAt: string;
        actualEndAt: string | null;
      }>('attendanceActivities');
      const existing = await repository.findOne({
        filter: { kind: input.kind, applicationId: input.applicationId },
      });
      if (!existing) return;
      if (existing.userId !== input.userId || existing.status !== 'active')
        throw new AttendanceError(
          'ATTENDANCE_ACTIVITY_CHANGED',
          'The attendance activity changed.',
        );
      const started = Date.parse(existing.startAt) < input.now.getTime();
      const actualEndAt = started
        ? new Date(
            Math.min(Date.parse(existing.endAt), input.now.getTime()),
          ).toISOString()
        : null;
      const result = await repository.updateMany({
        filter: { id: existing.id, status: 'active' },
        values: {
          status: input.status,
          active: started,
          actualEndAt,
          updatedAt: input.now.toISOString(),
        },
      });
      if (result.updatedCount !== 1)
        throw new AttendanceError(
          'ATTENDANCE_ACTIVITY_CHANGED',
          'The attendance activity changed.',
        );
      await d.audit.record(
        {
          actorId: input.actorId,
          action: 'attendance.endActivity',
          targetType: 'attendanceActivities',
          targetId: input.applicationId,
          after: { status: input.status, actualEndAt },
        },
        connection,
      );
    },
    async correct(input, connection) {
      await lockUserForAdministration(connection, input.userId);
      const repository =
        connection.repository<AttendanceRecord>('attendanceRecords');
      const original = await repository.findOne({
        filter: { id: input.originalId },
      });
      if (
        !original ||
        original.userId !== input.userId ||
        original.status !== 'missing' ||
        original.version !== input.originalVersion
      )
        throw new AttendanceError(
          'ATTENDANCE_BASELINE_CHANGED',
          'The missing-punch evidence has changed; submit a fresh request.',
        );
      if (
        !Number.isFinite(Date.parse(input.punchedAt)) ||
        d.calendar.localDate(new Date(input.punchedAt)) !== original.date
      )
        throw new AttendanceError(
          'ATTENDANCE_INVALID_TIME',
          'The corrected punch time must fall on the missing-punch date.',
        );
      const now = demoNow().toISOString();
      const changed = await repository.updateMany({
        filter: {
          id: original.id,
          status: 'missing',
          version: input.originalVersion,
        },
        values: {
          status: 'corrected',
          version: input.originalVersion + 1,
          correctedByRequestId: input.applicationId,
          updatedAt: now,
        },
      });
      if (changed.updatedCount !== 1)
        throw new AttendanceError(
          'ATTENDANCE_BASELINE_CHANGED',
          'The missing-punch evidence has changed; submit a fresh request.',
        );
      // The original punchedAt/sourceData are immutable evidence. The correction is a separate fact.
      await connection.repository('attendanceCorrections').createOne({
        values: {
          id: randomUUID(),
          applicationId: input.applicationId,
          originalId: input.originalId,
          originalVersion: input.originalVersion,
          punchedAt: input.punchedAt,
          actorId: input.actorId,
          createdAt: now,
        },
      });
      await d.audit.record(
        {
          actorId: input.actorId,
          action: 'attendance.correct',
          targetType: 'attendanceRecords',
          targetId: input.originalId,
          after: {
            applicationId: input.applicationId,
            punchedAt: input.punchedAt,
          },
        },
        connection,
      );
    },
  };
  return service;
}

function normalizeTime(value: string | null): string | null {
  if (value === null) return null;
  // Database UTC datetime text must never be interpreted in the host timezone.
  const explicit = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
    ? value
    : `${value.replace(' ', 'T')}Z`;
  return new Date(explicit).toISOString();
}
function validateEvidence(input: AttendanceIngestInput): void {
  const fail = () => {
    throw new AttendanceError(
      'ATTENDANCE_INVALID_INPUT',
      'Valid identity, source, source key and JSON source evidence are required.',
    );
  };
  if (
    !input ||
    typeof input.userId !== 'string' ||
    !input.userId.trim() ||
    input.userId.length > 64 ||
    typeof input.source !== 'string' ||
    !input.source.trim() ||
    input.source.length > 64 ||
    typeof input.sourceKey !== 'string' ||
    !input.sourceKey.trim() ||
    input.sourceKey.length > 255 ||
    !input.sourceData ||
    Object.getPrototypeOf(input.sourceData) !== Object.prototype
  )
    fail();
  const seen = new Set<object>();
  let nodes = 0;
  const json = (value: unknown, depth = 0): void => {
    if (++nodes > 10000 || depth > 32) return fail();
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    )
      return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (typeof value !== 'object' || !value || seen.has(value)) return fail();
    if (
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype
    )
      return fail();
    if (Reflect.ownKeys(value).some((key) => typeof key === 'symbol'))
      return fail();
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const array = Array.isArray(value);
    if (array) {
      // JSON arrays serialize only consecutive integer indices. No holes or extra own facts.
      if (Object.keys(descriptors).length !== value.length + 1) return fail();
      for (let index = 0; index < value.length; index++)
        if (!Object.hasOwn(descriptors, String(index))) return fail();
    }
    seen.add(value);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (array && key === 'length') continue;
      if (!descriptor.enumerable || descriptor.get || descriptor.set)
        return fail();
      json(descriptor.value, depth + 1);
    }
    seen.delete(value);
  };
  json(input.sourceData);
  if (Buffer.byteLength(JSON.stringify(input.sourceData), 'utf8') > 65536)
    fail();
  if (
    input.punchedAt !== null &&
    (typeof input.punchedAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/i.test(
        input.punchedAt,
      ) ||
      !Number.isFinite(
        Date.parse(`${input.punchedAt.slice(0, 10)}T00:00:00Z`),
      ) ||
      new Date(`${input.punchedAt.slice(0, 10)}T00:00:00Z`)
        .toISOString()
        .slice(0, 10) !== input.punchedAt.slice(0, 10))
  )
    fail();
}
