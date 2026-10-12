import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createPlatformAppTest } from '../platform/helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { createMeetingRoomService } from '../../../server/providers/meeting-rooms/service.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { ruleServiceToken } from '../../../server/providers/platform/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
const test = createPlatformAppTest();
async function fixture(testApp: Parameters<typeof createEmployee>[0]) {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const owner = await createEmployee(testApp, 'Meeting organizer'),
    administrator = await createEmployee(testApp, 'Meeting administrator');
  await org.addDutyRoleMember('admin', administrator.userId, {
    actorId: administrator.userId,
  });
  let time = new Date('2030-01-01T00:00:00Z');
  const deps = {
    db,
    audit: c.resolve(auditServiceToken),
    org: c.resolve(orgServiceToken),
    employees: c.resolve(employeeServiceToken),
    users: c.resolve(userAdministrationServiceToken),
    calendar: c.resolve(calendarServiceToken),
    now: () => time,
  };
  const service = createMeetingRoomService(deps),
    cmd = (actorId = owner.userId) => ({ actorId, requestId: randomUUID() });
  const room = await db.transaction((tx) =>
    service.saveRoom(
      {
        ...cmd(administrator.userId),
        name: 'Boardroom',
        location: null,
        facilities: null,
        active: true,
        capacity: 4,
        requiresAdminConfirmation: true,
        reason: 'Initial real room',
      },
      tx,
    ),
  );
  const input = () => ({
    ...cmd(),
    roomId: room.id,
    title: 'Private meeting title',
    attendeeUserIds: [],
    date: '2030-01-02',
    startTime: '09:00',
    endTime: '10:00',
  });
  const create = (i = input()) => db.transaction((tx) => service.create(i, tx));
  return {
    db,
    service,
    deps,
    owner,
    administrator,
    room,
    cmd,
    input,
    create,
    setTime: (v: string) => {
      time = new Date(v);
    },
  };
}
test('pending confirmation reserves half-open slots, replay rejects changed payload and actor; lifecycle/audit rollback', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    input = f.input(),
    [booking] = await f.create(input);
  expect(booking.status).toBe('pendingConfirmation');
  expect((await f.create(input))[0].id).toBe(booking.id);
  await expect(f.create({ ...input, title: 'Changed' })).rejects.toThrow(
    'COMMAND_CONFLICT',
  );
  await expect(
    f.create({ ...input, actorId: f.administrator.userId }),
  ).rejects.toThrow('COMMAND_CONFLICT');
  await expect(f.create()).rejects.toThrow('TIME_CONFLICT');
  await expect(
    f.create({ ...f.input(), startTime: '10:00', endTime: '11:00' }),
  ).resolves.toHaveLength(1);
  const broken = createMeetingRoomService({
    ...f.deps,
    audit: {
      ...f.deps.audit,
      record: async () => {
        throw new Error('Audit failure');
      },
    },
  });
  await expect(
    f.db.transaction((tx) =>
      broken.create({ ...f.input(), startTime: '11:00', endTime: '12:00' }, tx),
    ),
  ).rejects.toThrow('Audit failure');
  expect(
    await f.db
      .repository('meetingBookings')
      .count({ filter: { roomId: f.room.id } }),
  ).toBe(2);
  expect(
    await f.db.repository('oaLifecycleTransitions').count({
      filter: (f) =>
        f.and([
          f.string('lifecycle').eq('oa.meetingBooking'),
          f.or([f.string('recordId').eq(booking.id)]),
        ]),
    }),
  ).toBe(1);
});
test('confirmation requires separate administrative identity; stale version, participant check-in and history are protected', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    [b] = await f.create();
  await expect(
    f.db.transaction((tx) =>
      f.service.act(
        { ...f.cmd(), id: b.id, expectedVersion: b.version, action: 'confirm' },
        tx,
      ),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  const confirmed = await f.db.transaction((tx) =>
    f.service.act(
      {
        ...f.cmd(f.administrator.userId),
        id: b.id,
        expectedVersion: b.version,
        action: 'confirm',
      },
      tx,
    ),
  );
  expect(confirmed.status).toBe('confirmed');
  await expect(
    f.db.transaction((tx) =>
      f.service.act(
        { ...f.cmd(), id: b.id, expectedVersion: b.version, action: 'cancel' },
        tx,
      ),
    ),
  ).rejects.toThrow('VERSION_CONFLICT');
  f.setTime('2030-01-02T01:00:00Z');
  await expect(
    f.db.transaction((tx) =>
      f.service.act(
        {
          ...f.cmd(f.administrator.userId),
          id: b.id,
          expectedVersion: confirmed.version,
          action: 'checkIn',
        },
        tx,
      ),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  const checked = await f.db.transaction((tx) =>
    f.service.act(
      {
        ...f.cmd(),
        id: b.id,
        expectedVersion: confirmed.version,
        action: 'checkIn',
      },
      tx,
    ),
  );
  expect(checked.checkedInAt).toBeTruthy();
  await expect(
    f.db.transaction((tx) =>
      f.service.act(
        {
          ...f.cmd(),
          id: b.id,
          expectedVersion: checked.version,
          action: 'cancel',
        },
        tx,
      ),
    ),
  ).rejects.toThrow('INVALID_STATE');
  expect(
    await f.db
      .repository('meetingBookingHistory')
      .count({ filter: { bookingId: b.id } }),
  ).toBe(3);
});
test('finite series is atomic if any occurrence conflicts and concurrent writers reserve only once', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  await f.create({ ...f.input(), date: '2030-01-03' });
  await expect(
    f.create({ ...f.input(), recurrence: { frequency: 'daily', count: 3 } }),
  ).rejects.toThrow('TIME_CONFLICT');
  expect(
    await f.db
      .repository('meetingBookings')
      .count({ filter: { roomId: f.room.id } }),
  ).toBe(1);
  const result = await Promise.allSettled([f.create(), f.create()]);
  expect(result.filter((v) => v.status === 'fulfilled')).toHaveLength(1);
});
test('future edits and cancellation require every version and roll back all occurrences on conflict', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    rows = await f.create({
      ...f.input(),
      recurrence: { frequency: 'weekly', count: 3 },
    }),
    anchor = rows[1];
  const versions = Object.fromEntries(
    rows.slice(1).map((b) => [b.id, b.version]),
  );
  const edit = {
    ...f.input(),
    id: anchor.id,
    target: 'future' as const,
    expectedVersions: versions,
    startTime: '10:00',
    endTime: '11:00',
    recurrence: undefined,
  };
  const changed = await f.db.transaction((tx) => f.service.edit(edit, tx));
  expect(changed).toHaveLength(2);
  expect(changed[0].version).toBe(anchor.version + 1);
  expect(
    (
      await f.db
        .repository('meetingBookings')
        .findOne({ filter: { id: rows[0].id } })
    )?.version,
  ).toBe(rows[0].version);
  await expect(
    f.db.transaction((tx) =>
      f.service.cancelFuture(
        { ...f.cmd(), id: anchor.id, expectedVersions: versions },
        tx,
      ),
    ),
  ).rejects.toThrow('VERSION_CONFLICT');
  expect(
    await f.db
      .repository('meetingBookings')
      .count({ filter: { roomId: f.room.id, status: 'pendingConfirmation' } }),
  ).toBe(3);
  const cancelled = await f.db.transaction((tx) =>
    f.service.cancelFuture(
      {
        ...f.cmd(),
        id: anchor.id,
        expectedVersions: Object.fromEntries(
          changed.map((b) => [b.id, b.version]),
        ),
      },
      tx,
    ),
  );
  expect(cancelled.every((b) => b.status === 'cancelled')).toBe(true);
  await expect(
    f.service.getBooking(rows[0].id, f.db.connection(), {
      read: { fields: ['id'], scope: true },
      create: false,
      update: false,
      delete: false,
    }),
  ).rejects.toThrow('ACCESS_DENIED');
});
test('edits move room reservations atomically, and a conflicting occurrence rolls back a finite series', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    rows = await f.create({
      ...f.input(),
      recurrence: { frequency: 'daily', count: 2 },
    });
  const destination = await f.db.transaction((tx) =>
    f.service.saveRoom(
      {
        ...f.cmd(f.administrator.userId),
        name: 'Second room',
        location: null,
        facilities: null,
        capacity: 2,
        active: true,
        requiresAdminConfirmation: false,
        reason: 'Cross room',
      },
      tx,
    ),
  );
  await f.create({
    ...f.input(),
    roomId: destination.id,
    date: '2030-01-03',
    startTime: '11:00',
    endTime: '12:00',
  });
  const edit = {
    ...f.input(),
    id: rows[0].id,
    target: 'future' as const,
    expectedVersions: Object.fromEntries(rows.map((b) => [b.id, b.version])),
    roomId: destination.id,
    startTime: '11:00',
    endTime: '12:00',
    recurrence: undefined,
  };
  await expect(
    f.db.transaction((tx) => f.service.edit(edit, tx)),
  ).rejects.toThrow('TIME_CONFLICT');
  expect(
    await f.db
      .repository('meetingBookings')
      .count({ filter: { roomId: f.room.id } }),
  ).toBe(2);
  const moved = await f.db.transaction((tx) =>
    f.service.edit(
      {
        ...edit,
        requestId: randomUUID(),
        startTime: '12:00',
        endTime: '13:00',
      },
      tx,
    ),
  );
  expect(
    moved.every((b) => b.roomId === destination.id && b.status === 'confirmed'),
  ).toBe(true);
  expect(
    await f.db
      .repository('meetingBookings')
      .count({ filter: { roomId: f.room.id, status: 'pendingConfirmation' } }),
  ).toBe(0);
});
test('admin self-confirmation, strict check-in end, disabled rooms, participant validity remain business guards', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  await testApp.application.container
    .resolve(organizationServiceToken)
    .addDutyRoleMember('admin', f.owner.userId, {
      actorId: f.administrator.userId,
    });
  const [booking] = await f.create();
  await expect(
    f.db.transaction((tx) =>
      f.service.act(
        {
          ...f.cmd(),
          id: booking.id,
          expectedVersion: booking.version,
          action: 'confirm',
        },
        tx,
      ),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  const confirmed = await f.db.transaction((tx) =>
    f.service.act(
      {
        ...f.cmd(f.administrator.userId),
        id: booking.id,
        expectedVersion: booking.version,
        action: 'confirm',
      },
      tx,
    ),
  );
  f.setTime('2030-01-02T02:00:00Z');
  await expect(
    f.db.transaction((tx) =>
      f.service.act(
        {
          ...f.cmd(),
          id: booking.id,
          expectedVersion: confirmed.version,
          action: 'checkIn',
        },
        tx,
      ),
    ),
  ).rejects.toThrow('INVALID_STATE');
  await expect(
    f.create({
      ...f.input(),
      date: '2030-01-03',
      attendeeUserIds: ['not-an-employee'],
    }),
  ).rejects.toThrow('INVALID_PARTICIPANT');
  await f.db.transaction((tx) =>
    f.service.saveRoom(
      {
        ...f.cmd(f.administrator.userId),
        ...f.room,
        expectedVersion: f.room.version,
        active: false,
        reason: 'Disabled',
      },
      tx,
    ),
  );
  await expect(f.create({ ...f.input(), date: '2030-01-03' })).rejects.toThrow(
    'ROOM_INACTIVE',
  );
});
test('company DST ambiguity or gap aborts the entire recurrence instead of shifting local time', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    rules = testApp.application.container.resolve(ruleServiceToken);
  await rules.set({
    key: 'calendar.timeZone',
    value: 'America/New_York',
    actorId: f.administrator.userId,
    note: 'Meeting DST proof',
  });
  await f.deps.calendar.reload();
  try {
    await expect(
      f.create({
        ...f.input(),
        date: '2030-03-09',
        startTime: '02:30',
        endTime: '03:30',
        recurrence: { frequency: 'daily', count: 2 },
      }),
    ).rejects.toMatchObject({ code: 'NONEXISTENT_LOCAL_TIME' });
    await expect(
      f.create({
        ...f.input(),
        date: '2030-11-03',
        startTime: '01:30',
        endTime: '02:30',
      }),
    ).rejects.toMatchObject({ code: 'AMBIGUOUS_LOCAL_TIME' });
    expect(
      await f.db
        .repository('meetingBookings')
        .count({ filter: { roomId: f.room.id } }),
    ).toBe(0);
  } finally {
    await rules.set({
      key: 'calendar.timeZone',
      value: 'Asia/Shanghai',
      actorId: f.administrator.userId,
      note: 'Restore company calendar',
    });
    await f.deps.calendar.reload();
  }
});
test('notification effects persist in the booking transaction and dispatch only after outer commit', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    queued: string[] = [],
    deliveries: string[] = [];
  const service = createMeetingRoomService({
    ...f.deps,
    dispatcher: {
      dispatch: async (id) => {
        queued.push(id);
      },
    },
    notify: async (_booking, key) => {
      deliveries.push(key);
    },
  });
  await expect(
    f.db.transaction(async (tx) => {
      await service.create(f.input(), tx);
      expect(queued).toHaveLength(0);
      throw new Error('Outer rollback');
    }),
  ).rejects.toThrow('Outer rollback');
  expect(queued).toHaveLength(0);
  expect(
    await f.db
      .repository('meetingBookings')
      .count({ filter: { roomId: f.room.id } }),
  ).toBe(0);
  await f.db.transaction((tx) => service.create(f.input(), tx));
  expect(queued).toHaveLength(1);
  expect(deliveries).toHaveLength(0);
  const run = await f.db
    .repository('oaLifecycleEffectRuns')
    .findOne({ filter: { id: Number(queued[0]) } });
  expect(run?.status).toBe('queued');
  await service.runtime.runEffect(queued[0]);
  expect(deliveries).toHaveLength(1);
  await service.runtime.runEffect(queued[0]);
  expect(deliveries).toHaveLength(1);
});
test('confirm and cancel racing with one expected version commit exactly one action', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    [booking] = await f.create();
  const results = await Promise.allSettled([
    f.db.transaction((tx) =>
      f.service.act(
        {
          ...f.cmd(f.administrator.userId),
          id: booking.id,
          expectedVersion: booking.version,
          action: 'confirm',
        },
        tx,
      ),
    ),
    f.db.transaction((tx) =>
      f.service.act(
        {
          ...f.cmd(),
          id: booking.id,
          expectedVersion: booking.version,
          action: 'cancel',
        },
        tx,
      ),
    ),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(
    (
      await f.db
        .repository('meetingBookings')
        .findOne({ filter: { id: booking.id } })
    )?.version,
  ).toBe(booking.version + 1);
  expect(
    await f.db
      .repository('meetingBookingHistory')
      .count({ filter: { bookingId: booking.id } }),
  ).toBe(2);
});
test('opposite room moves lock rooms in the same order and preserve both adjacent reservations', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    second = await f.db.transaction((tx) =>
      f.service.saveRoom(
        {
          ...f.cmd(f.administrator.userId),
          name: 'Opposite room',
          location: null,
          facilities: null,
          capacity: 4,
          active: true,
          requiresAdminConfirmation: false,
          reason: 'Lock order proof',
        },
        tx,
      ),
    );
  const [a] = await f.create(),
    [b] = await f.create({
      ...f.input(),
      roomId: second.id,
      startTime: '10:00',
      endTime: '11:00',
    });
  const results = await Promise.allSettled([
    f.db.transaction((tx) =>
      f.service.edit(
        {
          ...f.input(),
          id: a.id,
          target: 'this',
          expectedVersions: { [a.id]: a.version },
          roomId: second.id,
        },
        tx,
      ),
    ),
    f.db.transaction((tx) =>
      f.service.edit(
        {
          ...f.input(),
          id: b.id,
          target: 'this',
          expectedVersions: { [b.id]: b.version },
          roomId: f.room.id,
          startTime: '10:00',
          endTime: '11:00',
        },
        tx,
      ),
    ),
  ]);
  expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
  expect(
    (await f.db.repository('meetingBookings').findOne({ filter: { id: a.id } }))
      ?.roomId,
  ).toBe(second.id);
  expect(
    (await f.db.repository('meetingBookings').findOne({ filter: { id: b.id } }))
      ?.roomId,
  ).toBe(f.room.id);
});

test('a cancelled middle recurrence retains history while future edit and cancellation atomically process all remaining active occurrences', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    rows = await f.create({
      ...f.input(),
      recurrence: { frequency: 'daily', count: 3 },
    });
  const middle = await f.db.transaction((tx) =>
    f.service.act(
      {
        ...f.cmd(),
        id: rows[1].id,
        expectedVersion: rows[1].version,
        action: 'cancel',
      },
      tx,
    ),
  );
  const remaining = [rows[0], rows[2]];
  const changed = await f.db.transaction((tx) =>
    f.service.edit(
      {
        ...f.input(),
        id: rows[0].id,
        target: 'future',
        expectedVersions: Object.fromEntries(
          remaining.map((row) => [row.id, row.version]),
        ),
        startTime: '10:00',
        endTime: '11:00',
      },
      tx,
    ),
  );
  expect(changed.map((row) => row.id).sort()).toEqual(
    remaining.map((row) => row.id).sort(),
  );
  const cancelled = await f.db.transaction((tx) =>
    f.service.cancelFuture(
      {
        ...f.cmd(),
        id: rows[0].id,
        expectedVersions: Object.fromEntries(
          changed.map((row) => [row.id, row.version]),
        ),
      },
      tx,
    ),
  );
  expect(cancelled).toHaveLength(2);
  expect(cancelled.every((row) => row.status === 'cancelled')).toBe(true);
  const preserved = await f.db
    .repository('meetingBookings')
    .findOne({ filter: { id: middle.id } });
  expect(preserved?.version).toBe(middle.version);
  expect(preserved?.status).toBe('cancelled');
});

test('disabled actors cannot create, edit or replay an old booking command even while their employee and grants remain active', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    input = f.input(),
    rows = await f.create(input);
  await f.db.transaction((tx) =>
    f.deps.users.withConnection(tx).disable(f.owner.userId),
  );
  await expect(f.create(input)).rejects.toThrow('ACCESS_DENIED');
  expect(
    await f.service.businessActions(rows[0], f.owner.userId, f.db.connection()),
  ).toEqual([]);
  await expect(
    f.db.transaction((tx) =>
      f.service.act(
        {
          ...f.cmd(),
          id: rows[0].id,
          expectedVersion: rows[0].version,
          action: 'cancel',
        },
        tx,
      ),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  expect(
    (
      await f.db
        .repository('meetingBookings')
        .findOne({ filter: { id: rows[0].id } })
    )?.status,
  ).toBe('pendingConfirmation');
});
