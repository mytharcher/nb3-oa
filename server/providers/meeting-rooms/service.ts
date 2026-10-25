import type { PersonalScheduleService } from '../personal-schedules/contract.js';
import { demoNow } from '../demo-data/context.js';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import { createHash, randomUUID } from 'node:crypto';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import {
  LifecycleRuntime,
  defineLifecycle,
  defineEffect,
  type EffectDispatcher,
  type JsonObject,
} from '@nocobase/lifecycle';
import { LocalDateTimeError } from '../platform/time-zone.js';
import { createAppLifecycleStore } from '../approval-runtime/repository-store.js';
import type { AuditService } from '../audit/index.js';
import type { EmployeeService } from '../employees/contract.js';
import type { OrgService } from '../org/contract.js';
import type { CalendarService } from '../platform/calendar.js';
import { BOOKING_READ_FIELDS } from './contract.js';
import type {
  BookingInput,
  Command,
  MeetingBooking,
  MeetingRoom,
  MeetingRoomService,
  MeetingBookingAction,
} from './contract.js';
export class MeetingRoomError extends Error {
  constructor(
    public readonly code: string,
    public readonly dates?: readonly string[],
  ) {
    super(code);
  }
}
function fail(code: string): never {
  throw new MeetingRoomError(code);
}
const hash = (value: unknown) =>
  createHash('sha256')
    .update(
      JSON.stringify(value, (_k, v: unknown) =>
        v && typeof v === 'object' && !Array.isArray(v)
          ? Object.fromEntries(
              Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
            )
          : v,
      ),
    )
    .digest('hex');
export function createMeetingRoomService(d: {
  db: DatabaseManager;
  schedules: PersonalScheduleService;
  dispatcher?: EffectDispatcher;
  notify?: (booking: MeetingBooking, key: string) => Promise<void>;
  audit: AuditService;
  employees: EmployeeService;
  users: UserAdministrationService;
  org: OrgService;
  calendar: CalendarService;
  now?: () => Date;
}): MeetingRoomService & { runtime: LifecycleRuntime } {
  const now = () => d.now?.() ?? demoNow();
  const notice = defineEffect<{
    record: MeetingBooking & { readonly [key: string]: unknown };
    state: MeetingBooking['status'];
  }>({
    name: 'oa.meetingBooking.notice',
    retry: { attempts: 5, backoffMs: 5000, factor: 2 },
    run: ({ record, idempotencyKey }) =>
      d.notify?.(record, idempotencyKey) ?? Promise.resolve(),
  });
  const lifecycle = defineLifecycle<{
    record: MeetingBooking & { readonly [key: string]: unknown };
    state: MeetingBooking['status'];
  }>({
    name: 'oa.meetingBooking',
    collection: 'meetingBookings',
    versionField: 'version',
    initial: ['confirmed', 'pendingConfirmation'],
    states: [
      'pendingConfirmation',
      'confirmed',
      { name: 'cancelled', final: true },
      { name: 'rejected', final: true },
    ],
    onEnter: {
      confirmed: [notice],
      pendingConfirmation: [notice],
      cancelled: [notice],
      rejected: [notice],
    },
    transitions: {
      confirm: {
        from: 'pendingConfirmation',
        to: 'confirmed',
        accept: ['confirmedBy', 'confirmedAt', 'reason'],
      },
      reject: {
        from: 'pendingConfirmation',
        to: 'rejected',
        accept: ['reason'],
      },
      cancel: {
        from: ['confirmed', 'pendingConfirmation'],
        to: 'cancelled',
        accept: ['reason'],
      },
      checkIn: {
        from: 'confirmed',
        to: 'confirmed',
        accept: ['checkedInBy', 'checkedInAt', 'reason'],
      },
      edit: {
        from: ['confirmed', 'pendingConfirmation'],
        to: ['confirmed', 'pendingConfirmation'],
        route: ({ input }) =>
          input.pending ? 'pendingConfirmation' : 'confirmed',
        accept: [
          'roomId',
          'title',
          'attendeeUserIds',
          'startAt',
          'endAt',
          'companyTimeZone',
          'reason',
          'confirmedAt',
          'confirmedBy',
        ],
      },
    },
  });
  const runtime = new LifecycleRuntime({
    store: createAppLifecycleStore(d.db, {
      collections: {
        transitions: 'oaLifecycleTransitions',
        effectRuns: 'oaLifecycleEffectRuns',
      },
    }),
    clock: now,
    dispatcher: d.dispatcher,
  });
  runtime.register(lifecycle);

  function resolve(date: string, time: string) {
    try {
      return d.calendar.resolveLocalDateTime(date, time);
    } catch (error) {
      if (error instanceof LocalDateTimeError)
        throw new MeetingRoomError(error.code, [date]);
      throw error;
    }
  }
  async function activeActor(actor: string, tx: DatabaseConnection) {
    const employee = await d.employees.getByUserId(actor, tx),
      user = await d.users.withConnection(tx).get(actor);
    return (
      !!employee?.active &&
      employee.status !== 'left' &&
      !!user &&
      user.kind === 'person' &&
      !user.disabledAt
    );
  }
  async function admin(actor: string, tx: DatabaseConnection) {
    return (
      (await activeActor(actor, tx)) && d.org.hasDutyRole(actor, 'admin', tx)
    );
  }
  async function lock(
    id: string,
    tx: DatabaseConnection,
  ): Promise<MeetingRoom> {
    const updated = await tx
      .repository('meetingRooms')
      .updateMany({ filter: { id }, values: { version: { increment: 0 } } });
    if (updated.updatedCount !== 1) fail('ROOM_NOT_FOUND');
    const room = await tx
      .repository<MeetingRoom>('meetingRooms')
      .findOne({ filter: { id } });
    if (!room) fail('ROOM_NOT_FOUND');
    return room;
  }
  async function command<T>(
    input: Command,
    kind: string,
    tx: DatabaseConnection,
    work: () => Promise<T>,
  ): Promise<T> {
    if (!input.requestId || input.requestId.length > 128)
      fail('INVALID_REQUEST_ID');
    const id = hash(input.requestId),
      payloadHash = hash({ kind, input });
    const existing = await tx
      .repository<{
        id: string;
        actorId: string;
        payloadHash: string;
        result: T;
      }>('meetingBookingCommands')
      .findOne({ filter: { id } });
    if (existing) {
      if (
        existing.actorId !== input.actorId ||
        existing.payloadHash !== payloadHash
      )
        fail('COMMAND_CONFLICT');
      return existing.result;
    }
    const result = await work();
    await tx.repository('meetingBookingCommands').createOne({
      values: {
        id,
        actorId: input.actorId,
        payloadHash,
        result: JSON.parse(JSON.stringify(result)) as
          Record<string, unknown> | readonly unknown[],
      },
    });
    await d.audit.record(
      {
        actorId: input.actorId,
        action: 'meeting.command',
        targetType: 'meetingBookingCommands',
        targetId: id,
        after: { kind },
      },
      tx,
    );
    return result;
  }
  async function history(
    actorId: string,
    action: string,
    before: MeetingBooking | null,
    after: MeetingBooking,
    tx: DatabaseConnection,
  ) {
    await d.schedules.syncMeeting(after, tx);
    await tx.repository('meetingBookingHistory').createOne({
      values: {
        id: randomUUID(),
        bookingId: after.id,
        actorId,
        action,
        administrative: await admin(actorId, tx),
        before: before ? { ...before } : null,
        after: { ...after },
        at: now(),
      },
    });
    await d.audit.record(
      {
        actorId,
        action: `meeting.${action}`,
        targetType: 'meetingBookings',
        targetId: after.id,
        before: before ? { ...before } : null,
        after: { ...after },
        reason: after.reason,
      },
      tx,
    );
  }
  async function checkMutation(
    tx: DatabaseConnection,
    collection: string,
    policy: RepositoryPolicy | undefined,
    values: Record<string, unknown>,
    id?: string,
  ) {
    if (!policy) return;
    const repository = tx.repository(collection).withPolicy(policy);
    if (id && !(await repository.exists({ filter: { id } })))
      fail('BOOKING_NOT_FOUND');
    const checked = await repository.validateMutation(
      id
        ? {
            operation: 'updateOne',
            filter: { id },
            values: values as RepositoryRecord,
          }
        : { operation: 'createOne', values: values as RepositoryRecord },
    );
    if (!checked.valid) fail('ACCESS_DENIED');
  }
  async function occupied(
    roomId: string,
    start: Date,
    end: Date,
    tx: DatabaseConnection,
  ) {
    return tx.repository<MeetingBooking>('meetingBookings').exists({
      filter: (f) =>
        f.and([
          f.string('roomId').eq(roomId),
          f.or([
            f.string('status').eq('confirmed'),
            f.string('status').eq('pendingConfirmation'),
          ]),
          f.date('startAt').before(end),
          f.date('endAt').after(start),
        ]),
    });
  }
  async function futureCandidates(id: string, tx: DatabaseConnection) {
    const first = await tx
      .repository<MeetingBooking>('meetingBookings')
      .findOne({ filter: { id } });
    if (!first?.seriesId) fail('INVALID_SERIES');
    return tx.repository<MeetingBooking>('meetingBookings').findMany({
      filter: (f) =>
        f.and([
          f.string('seriesId').eq(first.seriesId),
          f.date('startAt').notBefore(new Date(first.startAt)),
          f.or([
            f.string('status').eq('confirmed'),
            f.string('status').eq('pendingConfirmation'),
          ]),
        ]),
      sort: (s) => [s.field('startAt').asc(), s.field('id').asc()],
    });
  }
  return {
    futureCandidates,
    async businessActions(row, actorId, tx) {
      const employee = await d.employees.getByUserId(actorId, tx);
      if (
        !employee?.active ||
        employee.status === 'left' ||
        !(await activeActor(actorId, tx))
      )
        return [];
      const self = row.organizerUserId === actorId,
        isAdmin = await admin(actorId, tx),
        t = now();
      const future = new Date(row.startAt) > t;
      const mutable =
        ['confirmed', 'pendingConfirmation'].includes(row.status) &&
        !row.checkedInAt &&
        future;
      const result: MeetingBookingAction[] = [];
      if (mutable && self) result.push('edit');
      if (mutable && (self || isAdmin)) result.push('cancel');
      if (row.status === 'pendingConfirmation' && future && isAdmin && !self) {
        result.push('reject');
        const room = await tx
          .repository<MeetingRoom>('meetingRooms')
          .findOne({ filter: { id: row.roomId } });
        if (
          room?.active &&
          new Set([row.organizerUserId, ...row.attendeeUserIds]).size <=
            room.capacity
        )
          result.push('confirm');
      }
      if (
        row.status === 'confirmed' &&
        !row.checkedInAt &&
        new Date(row.startAt) <= t &&
        new Date(row.endAt) > t &&
        (self || row.attendeeUserIds.includes(actorId))
      )
        result.push('checkIn');
      return result;
    },
    runtime,
    async getBooking(id, tx, policy) {
      const row = await tx
        .repository<MeetingBooking>('meetingBookings')
        .withPolicy(policy)
        .findOne({ filter: { id } });
      if (!row) return undefined;
      if (BOOKING_READ_FIELDS.some((field) => !(field in row)))
        fail('ACCESS_DENIED');
      return row as MeetingBooking;
    },
    async saveRoom(input, connection, policy) {
      return connection.transaction(async (tx) => {
        if (!(await admin(input.actorId, tx))) fail('ACCESS_DENIED');
        const before = input.id ? await lock(input.id, tx) : null;
        return command(input, 'room.save', tx, async () => {
          if (
            !input.name.trim() ||
            !input.reason.trim() ||
            !Number.isSafeInteger(input.capacity) ||
            input.capacity < 1 ||
            input.capacity > 10000
          )
            fail('INVALID_ROOM');
          if (before && before.version >= 2147483647) fail('VERSION_CONFLICT');
          if (before && before.version !== input.expectedVersion)
            fail('VERSION_CONFLICT');
          const after: MeetingRoom = {
            id: input.id ?? randomUUID(),
            name: input.name.trim(),
            location: input.location,
            facilities: input.facilities,
            capacity: input.capacity,
            active: input.active,
            requiresAdminConfirmation: input.requiresAdminConfirmation,
            version: (before?.version ?? 0) + 1,
          };
          await checkMutation(
            tx,
            'meetingRooms',
            policy,
            { ...after },
            before?.id,
          );
          if (before)
            await tx.repository('meetingRooms').updateOne({
              filter: { id: after.id, version: before.version },
              values: { ...after },
            });
          else
            await tx
              .repository('meetingRooms')
              .createOne({ values: { ...after } });
          await d.audit.record(
            {
              actorId: input.actorId,
              action: 'meeting.room.save',
              targetType: 'meetingRooms',
              targetId: after.id,
              before,
              after,
              reason: input.reason,
            },
            tx,
          );
          return after;
        });
      });
    },
    async create(input: BookingInput, connection, policy) {
      return connection.transaction(async (tx) => {
        if (!(await activeActor(input.actorId, tx))) fail('ACCESS_DENIED');
        const room = await lock(input.roomId, tx);
        return command(input, 'booking.create', tx, async () => {
          if (!room.active) fail('ROOM_INACTIVE');
          const employee = await d.employees.getByUserId(input.actorId, tx);
          if (!employee?.active || employee.status === 'left')
            fail('ACTIVE_EMPLOYEE_REQUIRED');
          if (
            !input.title.trim() ||
            input.title.length > 200 ||
            new Set(input.attendeeUserIds).size !== input.attendeeUserIds.length
          )
            fail('INVALID_BOOKING');
          const organizer = await d.employees.getByUserId(input.actorId, tx);
          if (!organizer?.active || organizer.status === 'left')
            fail('ACTIVE_EMPLOYEE_REQUIRED');
          const participants = await d.employees.getByUserIds(
            input.attendeeUserIds,
            tx,
          );
          if (
            input.attendeeUserIds.some(
              (id) =>
                !participants.get(id)?.active ||
                participants.get(id)?.status === 'left',
            )
          )
            fail('INVALID_PARTICIPANT');
          if (
            new Set([input.actorId, ...input.attendeeUserIds]).size >
            room.capacity
          )
            fail('CAPACITY_EXCEEDED');
          const count = input.recurrence?.count ?? 1;
          if (!Number.isSafeInteger(count) || count < 1 || count > 52)
            fail('INVALID_RECURRENCE');
          const step = input.recurrence?.frequency === 'weekly' ? 7 : 1;
          const instances = Array.from({ length: count }, (_, i) => {
            const date = d.calendar.addCalendarDays(input.date, i * step);
            return {
              start: resolve(date, input.startTime),
              end: resolve(date, input.endTime),
            };
          });
          const conflicts: string[] = [];
          for (const v of instances) {
            if (v.end <= v.start || v.start <= now()) fail('INVALID_INTERVAL');
            if (await occupied(room.id, v.start, v.end, tx))
              conflicts.push(d.calendar.localDate(v.start));
          }
          if (conflicts.length)
            throw new MeetingRoomError('TIME_CONFLICT', conflicts);
          const seriesId = count > 1 ? randomUUID() : null,
            results: MeetingBooking[] = [];
          for (const v of instances) {
            const row: MeetingBooking = {
              id: randomUUID(),
              seriesId,
              roomId: room.id,
              organizerEmployeeId: employee.id,
              organizerUserId: input.actorId,
              title: input.title.trim(),
              companyTimeZone: d.calendar.timeZone(),
              attendeeUserIds: input.attendeeUserIds,
              status: room.requiresAdminConfirmation
                ? 'pendingConfirmation'
                : 'confirmed',
              startAt: v.start,
              endAt: v.end,
              confirmedBy: null,
              confirmedAt: room.requiresAdminConfirmation ? null : now(),
              checkedInBy: null,
              checkedInAt: null,
              reason: null,
              version: 1,
            };
            await checkMutation(tx, 'meetingBookings', policy, { ...row });
            const { status, version: _version, ...values } = row;
            const created = await runtime.create('oa.meetingBooking', values, {
              actor: { id: input.actorId },
              state: status,
              transaction: tx,
            });
            Object.assign(row, created);
            await history(input.actorId, 'create', null, row, tx);
            results.push(row);
          }
          return results;
        });
      });
    },
    async edit(input, connection, policy) {
      return connection.transaction(async (tx) => {
        if (!(await activeActor(input.actorId, tx))) fail('ACCESS_DENIED');
        const first = await tx
          .repository<MeetingBooking>('meetingBookings')
          .findOne({ filter: { id: input.id } });
        if (!first) fail('BOOKING_NOT_FOUND');
        const initial =
          input.target === 'future' && first.seriesId
            ? await futureCandidates(first.id, tx)
            : [first];
        const rooms = [
          ...new Set([...initial.map((b) => b.roomId), input.roomId]),
        ].sort();
        let destination: MeetingRoom | undefined;
        for (const id of rooms) {
          const locked = await lock(id, tx);
          if (id === input.roomId) destination = locked;
        }
        return command(input, 'booking.edit', tx, async () => {
          if (!destination?.active) fail('ROOM_INACTIVE');
          const rows = await tx
            .repository<MeetingBooking>('meetingBookings')
            .findMany({
              filter: (f) => f.or(initial.map((b) => f.string('id').eq(b.id))),
            });
          if (input.target === 'future' && !first.seriesId)
            fail('INVALID_SERIES');
          if (rows.length !== Object.keys(input.expectedVersions).length)
            fail('VERSION_CONFLICT');
          if (
            !input.title.trim() ||
            input.title.length > 200 ||
            new Set(input.attendeeUserIds).size !== input.attendeeUserIds.length
          )
            fail('INVALID_BOOKING');
          const organizer = await d.employees.getByUserId(input.actorId, tx);
          if (!organizer?.active || organizer.status === 'left')
            fail('ACTIVE_EMPLOYEE_REQUIRED');
          const participants = await d.employees.getByUserIds(
            input.attendeeUserIds,
            tx,
          );
          if (
            input.attendeeUserIds.some(
              (id) =>
                !participants.get(id)?.active ||
                participants.get(id)?.status === 'left',
            )
          )
            fail('INVALID_PARTICIPANT');
          if (policy)
            for (const row of rows) {
              const scoped = await tx
                .repository('meetingBookings')
                .withPolicy(policy)
                .findOne({ filter: { id: row.id } });
              if (!scoped) fail('BOOKING_NOT_FOUND');
              if (Object.keys(row).some((field) => !(field in scoped)))
                fail('ACCESS_DENIED');
            }
          const candidate = rows.map((before) => {
            if (before.organizerUserId !== input.actorId) fail('ACCESS_DENIED');
            if (
              before.version !== input.expectedVersions[before.id] ||
              !rooms.includes(before.roomId)
            )
              fail('VERSION_CONFLICT');
            if (
              !['confirmed', 'pendingConfirmation'].includes(before.status) ||
              before.checkedInAt ||
              new Date(before.startAt) <= now()
            )
              fail('INVALID_STATE');
            if (
              new Set([before.organizerUserId, ...input.attendeeUserIds]).size >
              destination.capacity
            )
              fail('CAPACITY_EXCEEDED');
            const date =
              input.target === 'future'
                ? d.calendar.localDate(new Date(before.startAt))
                : input.date;
            const start = resolve(date, input.startTime),
              end = resolve(date, input.endTime);
            if (end <= start || start <= now()) fail('INVALID_INTERVAL');
            return { before, start, end };
          });
          const existing = await tx
            .repository<MeetingBooking>('meetingBookings')
            .findMany({ filter: { roomId: input.roomId } });
          for (const [index, v] of candidate.entries()) {
            if (
              existing.some(
                (b) =>
                  !Object.hasOwn(input.expectedVersions, b.id) &&
                  ['confirmed', 'pendingConfirmation'].includes(b.status) &&
                  new Date(b.startAt) < v.end &&
                  new Date(b.endAt) > v.start,
              ) ||
              candidate.some(
                (o, i) => i !== index && o.start < v.end && o.end > v.start,
              )
            )
              throw new MeetingRoomError('TIME_CONFLICT', [
                d.calendar.localDate(v.start),
              ]);
          }
          const results: MeetingBooking[] = [];
          for (const v of candidate) {
            const pending = destination.requiresAdminConfirmation;
            await checkMutation(
              tx,
              'meetingBookings',
              policy,
              {
                ...v.before,
                roomId: input.roomId,
                title: input.title.trim(),
                attendeeUserIds: input.attendeeUserIds,
                startAt: v.start,
                endAt: v.end,
                version: v.before.version + 1,
                status: pending ? 'pendingConfirmation' : 'confirmed',
                companyTimeZone: d.calendar.timeZone(),
                confirmedBy: null,
                confirmedAt: pending ? null : now(),
                reason: null,
              },
              v.before.id,
            );
            const moved = await runtime.fire(
              'oa.meetingBooking',
              v.before.id,
              'edit',
              {
                actor: { id: input.actorId },
                expect: { version: v.before.version },
                transaction: tx,
                input: {
                  pending,
                  roomId: input.roomId,
                  title: input.title.trim(),
                  attendeeUserIds: input.attendeeUserIds,
                  startAt: v.start.toISOString(),
                  endAt: v.end.toISOString(),
                  companyTimeZone: d.calendar.timeZone(),
                  confirmedBy: null,
                  confirmedAt: pending ? null : now().toISOString(),
                  reason: null,
                },
              },
            );
            const after = moved.record as unknown as MeetingBooking;
            await history(input.actorId, 'edit', v.before, after, tx);
            results.push(after);
          }
          return results;
        });
      });
    },
    async cancelFuture(input, connection, policy) {
      return connection.transaction(async (tx) => {
        if (!(await activeActor(input.actorId, tx))) fail('ACCESS_DENIED');
        const first = await tx
          .repository<MeetingBooking>('meetingBookings')
          .findOne({ filter: { id: input.id } });
        if (!first?.seriesId) fail('INVALID_SERIES');
        const rows = await futureCandidates(first.id, tx);
        for (const id of [...new Set(rows.map((b) => b.roomId))].sort())
          await lock(id, tx);
        return command(input, 'booking.cancelFuture', tx, async () => {
          if (rows.length !== Object.keys(input.expectedVersions).length)
            fail('VERSION_CONFLICT');
          const results: MeetingBooking[] = [];
          for (const row of rows) {
            if (row.version !== input.expectedVersions[row.id])
              fail('VERSION_CONFLICT');
            results.push(
              await this.act(
                {
                  id: row.id,
                  actorId: input.actorId,
                  requestId: hash([input.requestId, row.id]),
                  expectedVersion: row.version,
                  action: 'cancel',
                  reason: input.reason,
                },
                tx,
                policy,
              ),
            );
          }
          return results;
        });
      });
    },
    async act(input, connection, policy) {
      return connection.transaction(async (tx) => {
        if (!(await activeActor(input.actorId, tx))) fail('ACCESS_DENIED');
        const first = await tx
          .repository<MeetingBooking>('meetingBookings')
          .findOne({ filter: { id: input.id } });
        if (!first) fail('BOOKING_NOT_FOUND');
        const room = await lock(first.roomId, tx);
        return command(input, `booking.${input.action}`, tx, async () => {
          const before = await tx
            .repository<MeetingBooking>('meetingBookings')
            .findOne({ filter: { id: input.id } });
          if (!before) fail('BOOKING_NOT_FOUND');
          if (before.roomId !== first.roomId) fail('VERSION_CONFLICT');
          if (before.version >= 2147483647) fail('VERSION_CONFLICT');
          if (before.version !== input.expectedVersion)
            fail('VERSION_CONFLICT');
          const isAdmin = await admin(input.actorId, tx),
            self = before.organizerUserId === input.actorId,
            t = now();
          const after = {
            ...before,
            version: before.version + 1,
            reason: input.reason?.trim() || null,
          };
          if (input.action === 'confirm' || input.action === 'reject') {
            if (!isAdmin || self) fail('ACCESS_DENIED');
            if (
              before.status !== 'pendingConfirmation' ||
              new Date(before.startAt) <= t
            )
              fail('INVALID_STATE');
            if (input.action === 'confirm') {
              if (!room.active) fail('ROOM_INACTIVE');
              if (
                new Set([before.organizerUserId, ...before.attendeeUserIds])
                  .size > room.capacity
              )
                fail('CAPACITY_EXCEEDED');
              after.status = 'confirmed';
              after.confirmedBy = input.actorId;
              after.confirmedAt = t;
            } else {
              if (!after.reason) fail('REASON_REQUIRED');
              after.status = 'rejected';
            }
          } else if (input.action === 'cancel') {
            if (!self && !isAdmin) fail('ACCESS_DENIED');
            if (!self && !after.reason) fail('REASON_REQUIRED');
            if (
              !['confirmed', 'pendingConfirmation'].includes(before.status) ||
              before.checkedInAt ||
              new Date(before.startAt) <= t
            )
              fail('INVALID_STATE');
            after.status = 'cancelled';
          } else {
            if (!self && !before.attendeeUserIds.includes(input.actorId))
              fail('ACCESS_DENIED');
            if (
              before.status !== 'confirmed' ||
              before.checkedInAt ||
              new Date(before.startAt) > t ||
              new Date(before.endAt) <= t
            )
              fail('INVALID_STATE');
            after.checkedInAt = t;
            after.checkedInBy = input.actorId;
          }
          await checkMutation(
            tx,
            'meetingBookings',
            policy,
            { ...after },
            before.id,
          );
          const { status: _status, version: _version, ...patch } = after;
          const changed = await runtime.fire(
            'oa.meetingBooking',
            before.id,
            input.action,
            {
              actor: { id: input.actorId },
              expect: { version: input.expectedVersion },
              input: JSON.parse(JSON.stringify(patch)) as JsonObject,
              transaction: tx,
            },
          );
          Object.assign(after, changed.record);
          await history(input.actorId, input.action, before, after, tx);
          return after;
        });
      });
    },
  };
}
