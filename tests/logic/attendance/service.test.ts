// @vitest-environment node
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { test } from './helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import {
  ruleServiceToken,
  calendarServiceToken,
} from '../../../server/providers/platform/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { createAttendanceManagementService } from '../../../server/providers/attendance-management/service.js';
test('keeps immutable shift revisions and rolls pointer, revision and audit back together', async ({
  testApp,
}) => {
  const db = testApp.application.container.resolve(databaseManagerToken);
  const audit = testApp.application.container.resolve(auditServiceToken);
  const calendar = testApp.application.container.resolve(calendarServiceToken);
  const service = createAttendanceManagementService({
    audit,
    calendar,
    org: testApp.application.container.resolve(orgServiceToken),
  });
  const input = {
    code: 'night',
    definition: {
      name: 'Night',
      timeZone: calendar.timeZone(),
      intervals: [
        {
          start: '22:00',
          startDayOffset: 0 as const,
          end: '06:00',
          endDayOffset: 1 as const,
        },
      ],
      lateToleranceMinutes: 5,
      earlyToleranceMinutes: 5,
      absenceThresholdMinutes: 240,
    },
    enabled: true,
    expectedVersion: null,
    actorId: 'configuration-test',
    reason: 'Explicit configuration',
  };
  const initial = await db.transaction((tx) => service.saveShift(input, tx));
  const changed = {
    ...input,
    id: initial.shift.id,
    expectedVersion: initial.shift.version,
    definition: { ...input.definition, name: 'Renamed' },
  };
  const failure = vi
    .spyOn(audit, 'record')
    .mockRejectedValueOnce(new Error('audit unavailable'));
  await expect(
    db.transaction((tx) => service.saveShift(changed, tx)),
  ).rejects.toThrow('audit unavailable');
  failure.mockRestore();
  expect(await db.repository('attendanceShiftRevisions').count()).toBe(1);
  expect(
    await db
      .repository('attendanceShifts')
      .findOne({ filter: { id: initial.shift.id } }),
  ).toMatchObject({ version: 0, name: 'Night' });
  const next = await db.transaction((tx) => service.saveShift(changed, tx));
  expect(next.shift).toMatchObject({
    version: 1,
    currentRevision: 2,
    name: 'Renamed',
  });
  expect(
    await service.shiftRevision(initial.revision.id, db.connection()),
  ).toMatchObject({ name: 'Night', revision: 1 });
  await expect(
    db.transaction((tx) => service.saveShift(changed, tx)),
  ).rejects.toThrow('ATTENDANCE_VERSION_CONFLICT');
  await expect(
    db.transaction((tx) =>
      service.saveShift(
        { ...changed, expectedVersion: 1, code: 'different' },
        tx,
      ),
    ),
  ).rejects.toThrow('ATTENDANCE_SHIFT_CODE_IMMUTABLE');
  expect(await db.repository('attendanceShiftRevisions').count()).toBe(2);
  const department = await testApp.application.container
    .resolve(organizationServiceToken)
    .createDepartment(
      { title: 'Scheduled department', managerId: null },
      { actorId: input.actorId },
    );
  const scheduleInput = {
    departmentId: department.id,
    date: '2026-10-12',
    shiftRevisionId: initial.revision.id,
    restDay: false,
    expectedVersion: null,
    actorId: input.actorId,
    reason: 'Assign immutable original night shift',
  };
  const schedule = await db.transaction((tx) =>
    service.saveSchedule(scheduleInput, tx),
  );
  const rest = {
    ...scheduleInput,
    shiftRevisionId: null,
    restDay: true,
    expectedVersion: 0,
  };
  const scheduleFailure = vi
    .spyOn(audit, 'record')
    .mockRejectedValueOnce(new Error('schedule audit unavailable'));
  await expect(
    db.transaction((tx) => service.saveSchedule(rest, tx)),
  ).rejects.toThrow('schedule audit unavailable');
  scheduleFailure.mockRestore();
  expect(await db.repository('attendanceScheduleRevisions').count()).toBe(1);
  expect(
    await db
      .repository('attendanceSchedules')
      .findOne({ filter: { id: schedule.id } }),
  ).toMatchObject({
    version: 0,
    currentRevisionId: schedule.currentRevisionId,
  });
  await db.transaction((tx) => service.saveSchedule(rest, tx));
  expect(await db.repository('attendanceScheduleRevisions').count()).toBe(2);
  expect(
    await db
      .repository('attendanceScheduleRevisions')
      .findOne({ filter: { id: schedule.currentRevisionId } }),
  ).toMatchObject({ shiftRevisionId: initial.revision.id, restDay: false });
  await expect(
    db.transaction((tx) => service.saveSchedule(rest, tx)),
  ).rejects.toThrow('ATTENDANCE_VERSION_CONFLICT');
  await expect(
    db.transaction((tx) =>
      service.saveSchedule(
        { ...rest, expectedVersion: 1, departmentId: 'missing' },
        tx,
      ),
    ),
  ).rejects.toThrow('ATTENDANCE_DEPARTMENT_UNAVAILABLE');
  const all = {
    read: true,
    create: false,
    update: false,
    delete: false,
  } as const;
  const list = await service.listShifts(
    { page: 1, pageSize: 1 },
    db.connection(),
    all,
  );
  expect(list.total).toBe(1);
  expect(list.items[0].id).toBe(initial.shift.id);
  await expect(
    service.listShifts({ page: 1, pageSize: 1 }, db.connection(), {
      ...all,
      read: false,
    }),
  ).rejects.toThrow('forbidden by Policy');
  const snapshot = await service.schedule(
    department.id,
    '2026-10-12',
    db.connection(),
    { current: all, revision: all },
  );
  expect(snapshot?.revision.restDay).toBe(true);
  await expect(
    service.schedule(department.id, '2026-10-12', db.connection(), {
      current: { ...all, read: false },
      revision: all,
    }),
  ).rejects.toThrow('forbidden by Policy');
  await expect(
    service.schedule(department.id, '2026-10-12', db.connection(), {
      current: all,
      revision: { ...all, read: false },
    }),
  ).rejects.toThrow('forbidden by Policy');
  // Real calendar configuration and DST rules; no host-local timezone arithmetic.
  await testApp.application.container.resolve(ruleServiceToken).set({
    key: 'calendar.timeZone',
    value: 'America/New_York',
    actorId: input.actorId,
  });
  await calendar.reload();
  await expect(
    db.transaction((tx) =>
      service.saveSchedule(
        { ...scheduleInput, date: '2026-10-13', expectedVersion: null },
        tx,
      ),
    ),
  ).rejects.toThrow('ATTENDANCE_SHIFT_TIME_ZONE_CHANGED');
  const dst = await db.transaction((tx) =>
    service.saveShift(
      {
        ...input,
        code: 'dst',
        definition: { ...input.definition, timeZone: calendar.timeZone() },
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    service.saveSchedule(
      {
        ...scheduleInput,
        date: '2026-03-07',
        shiftRevisionId: dst.revision.id,
      },
      tx,
    ),
  );
  expect(
    calendar.resolveLocalDateTime('2026-03-08', '06:00').getTime() -
      calendar.resolveLocalDateTime('2026-03-07', '22:00').getTime(),
  ).toBe(7 * 3600000);
  for (const [date, start] of [
    ['2026-03-08', '02:30'],
    ['2026-11-01', '01:30'],
  ]) {
    const ambiguous = await db.transaction((tx) =>
      service.saveShift(
        {
          ...input,
          code: `dst-${date}`,
          definition: {
            ...input.definition,
            timeZone: calendar.timeZone(),
            intervals: [
              { start, startDayOffset: 0, end: '06:00', endDayOffset: 0 },
            ],
            absenceThresholdMinutes: 60,
          },
        },
        tx,
      ),
    );
    const before = await db.repository('attendanceSchedules').count();
    await expect(
      db.transaction((tx) =>
        service.saveSchedule(
          { ...scheduleInput, date, shiftRevisionId: ambiguous.revision.id },
          tx,
        ),
      ),
    ).rejects.toThrow('ATTENDANCE_LOCAL_TIME_INVALID');
    expect(await db.repository('attendanceSchedules').count()).toBe(before);
  }
});
