import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type {
  DatabaseConnection,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import { PERSONAL_SCHEDULE_FIELDS } from './contract.js';
import type {
  PersonalSchedule,
  PersonalScheduleService,
  ScheduleInput,
} from './contract.js';
export class PersonalScheduleError extends Error {
  constructor(
    public readonly code:
      | 'ACCESS_DENIED'
      | 'NOT_FOUND'
      | 'INVALID_INPUT'
      | 'VERSION_CONFLICT'
      | 'SOURCE_MANAGED',
  ) {
    super(code);
  }
}
export function createPersonalScheduleService(
  audit: AuditService,
): PersonalScheduleService {
  const fail = (code: PersonalScheduleError['code']): never => {
    throw new PersonalScheduleError(code);
  };
  function values(i: ScheduleInput) {
    if (
      !z.iso.datetime({ offset: true }).safeParse(i.startAt).success ||
      !z.iso.datetime({ offset: true }).safeParse(i.endAt).success
    )
      fail('INVALID_INPUT');
    const startAt = new Date(i.startAt),
      endAt = new Date(i.endAt);
    if (
      !i.title.trim() ||
      i.title.trim().length > 200 ||
      i.description.length > 10000 ||
      !Number.isFinite(+startAt) ||
      !Number.isFinite(+endAt) ||
      startAt >= endAt
    )
      fail('INVALID_INPUT');
    return {
      title: i.title.trim(),
      description: i.description,
      startAt,
      endAt,
    };
  }
  async function get(
    id: string,
    actor: string,
    tx: DatabaseConnection,
    p: RepositoryPolicy,
  ) {
    if (!p || !actor) fail('ACCESS_DENIED');
    const row = await tx
      .repository<PersonalSchedule>('personalSchedules')
      .withPolicy(p)
      .findOne({ filter: { id, ownerUserId: actor } });
    if (!row || row.ownerUserId !== actor) return fail('NOT_FOUND');
    if (PERSONAL_SCHEDULE_FIELDS.some((field) => row[field] === undefined))
      fail('ACCESS_DENIED');
    return row as PersonalSchedule;
  }
  async function check(
    tx: DatabaseConnection,
    p: RepositoryPolicy,
    operation: 'createOne' | 'updateOne',
    id: string,
    v?: Record<string, unknown>,
  ) {
    if (!p) fail('ACCESS_DENIED');
    const result = await tx
      .repository('personalSchedules')
      .withPolicy(p)
      .validateMutation(
        operation === 'createOne'
          ? { operation, values: v! as RepositoryRecord }
          : { operation, filter: { id }, values: v! as RepositoryRecord },
      );
    if (!result.valid) fail('ACCESS_DENIED');
  }
  async function lock(
    id: string,
    actor: string,
    tx: DatabaseConnection,
    p: RepositoryPolicy,
    version: number,
  ) {
    await get(id, actor, tx, p);
    await tx.repository('personalSchedules').updateMany({
      filter: { id, ownerUserId: actor },
      values: { version: { increment: 0 } },
    });
    const row = await get(id, actor, tx, p);
    if (row.version !== version) fail('VERSION_CONFLICT');
    if (row.sourceBookingId) fail('SOURCE_MANAGED');
    return row;
  }
  return {
    get,
    async syncMeeting(booking, tx) {
      const repo = tx.repository<PersonalSchedule>('personalSchedules');
      const existing = await repo.findMany({
        filter: { sourceBookingId: booking.id },
      });
      const owners =
        booking.status === 'confirmed'
          ? new Set([booking.organizerUserId, ...booking.attendeeUserIds])
          : new Set<string>();
      for (const row of existing) {
        if (!owners.has(row.ownerUserId))
          await repo.deleteOne({ filter: { id: row.id } });
      }
      for (const ownerUserId of owners) {
        const row = existing.find((item) => item.ownerUserId === ownerUserId);
        const next = {
          title: booking.title,
          description: '',
          startAt: new Date(booking.startAt),
          endAt: new Date(booking.endAt),
        };
        if (row) {
          if (
            row.title !== next.title ||
            +new Date(row.startAt) !== +next.startAt ||
            +new Date(row.endAt) !== +next.endAt
          )
            await repo.updateOne({
              filter: { id: row.id },
              values: { ...next, version: row.version + 1 },
            });
        } else {
          await repo.createOne({
            values: {
              ...next,
              id: randomUUID(),
              ownerUserId,
              sourceBookingId: booking.id,
              version: 1,
            },
          });
        }
      }
    },
    async list(actor, tx, p, interval) {
      if (!p || !actor) fail('ACCESS_DENIED');
      const rows = await tx
        .repository<PersonalSchedule>('personalSchedules')
        .withPolicy(p)
        .findMany({
          filter: (f) =>
            f.and([
              f.string('ownerUserId').eq(actor),
              ...(interval
                ? [
                    f.date('startAt').before(interval.endAt),
                    f.date('endAt').after(interval.startAt),
                  ]
                : []),
            ]),
          sort: (s) => s.field('startAt').asc(),
          limit: 1001,
        });
      if (
        rows.length > 1000 ||
        rows.some((row) =>
          PERSONAL_SCHEDULE_FIELDS.some((field) => row[field] === undefined),
        )
      )
        fail('ACCESS_DENIED');
      return rows as PersonalSchedule[];
    },
    async create(input, actor, connection, p) {
      if (!actor || !p) fail('ACCESS_DENIED');
      return connection.transaction(async (tx) => {
        const v = {
          id: randomUUID(),
          ownerUserId: actor,
          ...values(input),
          version: 1,
        };
        await check(tx, p, 'createOne', v.id, v);
        await tx
          .repository('personalSchedules')
          .withPolicy(p)
          .createOne({ values: v });
        await audit.record(
          {
            actorId: actor,
            action: 'personalSchedule.create',
            targetType: 'personalSchedules',
            targetId: v.id,
            after: { version: 1 },
          },
          tx,
        );
        return get(v.id, actor, tx, p);
      });
    },
    async edit(id, version, input, actor, connection, p) {
      return connection.transaction(async (tx) => {
        const before = await lock(id, actor, tx, p, version),
          v = { ...values(input), version: before.version + 1 };
        await check(tx, p, 'updateOne', id, v);
        await tx
          .repository('personalSchedules')
          .withPolicy(p)
          .updateOne({ filter: { id, ownerUserId: actor }, values: v });
        await audit.record(
          {
            actorId: actor,
            action: 'personalSchedule.edit',
            targetType: 'personalSchedules',
            targetId: id,
            before: { version },
            after: { version: v.version },
          },
          tx,
        );
        return get(id, actor, tx, p);
      });
    },
    async remove(id, version, actor, connection, p) {
      await connection.transaction(async (tx) => {
        await lock(id, actor, tx, p, version);
        if (!p) fail('ACCESS_DENIED');
        await tx
          .repository('personalSchedules')
          .withPolicy(p)
          .deleteOne({ filter: { id, ownerUserId: actor } });
        await audit.record(
          {
            actorId: actor,
            action: 'personalSchedule.delete',
            targetType: 'personalSchedules',
            targetId: id,
            before: { version },
          },
          tx,
        );
      });
    },
  };
}
