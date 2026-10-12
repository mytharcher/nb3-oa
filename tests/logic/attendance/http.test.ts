// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import type { AuthorizationCheckRequest } from '@nocobase/authorization/core';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { test } from './helpers.js';
import { createUser, write } from '../platform/helpers.js';
import { grantToUser } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { installAttendanceManagementPermissions } from '../../../database/main/seeds/202610104802_attendance_management_permissions.js';

test('candidate HTTP: HR duties, immutable revisions, current grants, fields, department scope and rollback', async ({
  testApp,
  request,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    sets = c.resolve(authorizationToken).permissionSets;
  await db.transaction((tx) =>
    installAttendanceManagementPermissions(tx.query),
  );
  const hr = await createUser(testApp, 'HR attendance'),
    outsider = await createUser(testApp, 'No attendance access');
  await org.addDutyRoleMember('hr', hr.user.id, { actorId: hr.user.id });
  const input = {
    code: 'night',
    definition: {
      name: 'Night',
      timeZone: c.resolve(calendarServiceToken).timeZone(),
      intervals: [
        { start: '22:00', startDayOffset: 0, end: '06:00', endDayOffset: 1 },
      ],
      lateToleranceMinutes: 5,
      earlyToleranceMinutes: 5,
      absenceThresholdMinutes: 240,
    },
    enabled: true,
    expectedVersion: null,
    reason: 'Explicit configuration',
  };
  expect((await request('/attendanceManagement/shifts')).status).toBe(401);
  expect((await outsider.fetch('/attendanceManagement/shifts')).status).toBe(
    403,
  );
  expect(
    (await outsider.fetch('/attendanceManagement/shifts', write('POST', {})))
      .status,
  ).toBe(403);
  expect(
    (
      await hr.fetch(
        '/attendanceManagement/shifts',
        write('POST', { ...input, unexpected: true }),
      )
    ).status,
  ).toBe(400);
  const firstResponse = await hr.fetch(
    '/attendanceManagement/shifts',
    write('POST', input),
  );
  expect(firstResponse.status).toBe(200);
  const first = (await firstResponse.json()).data;
  expect(first.version).toBe(0);
  const revision = await db
    .repository('attendanceShiftRevisions')
    .findOne({ filter: { shiftId: first.id, revision: 1 } });
  const changed = {
    ...input,
    id: first.id,
    expectedVersion: 0,
    definition: { ...input.definition, name: 'Renamed' },
  };
  expect(
    (await hr.fetch('/attendanceManagement/shifts', write('POST', changed)))
      .status,
  ).toBe(200);
  expect(
    (await hr.fetch('/attendanceManagement/shifts', write('POST', changed)))
      .status,
  ).toBe(409);
  const filtered = await hr.fetch(
    '/attendanceManagement/shifts?search=renamed&enabled=true&sort=name&direction=desc&pageSize=1',
  );
  expect(filtered.status).toBe(200);
  expect(await filtered.json()).toMatchObject({
    data: [{ name: 'Renamed' }],
    meta: { total: 1, pageSize: 1 },
  });
  expect(
    await (
      await hr.fetch('/attendanceManagement/shifts?search=unknown')
    ).json(),
  ).toMatchObject({ data: [], meta: { total: 0 } });
  const history = await hr.fetch(
    `/attendanceManagement/shiftRevision?id=${revision!.id}`,
  );
  expect(history.status).toBe(200);
  expect((await history.json()).data).toMatchObject({
    name: 'Night',
    createdBy: { id: hr.user.id, name: 'HR attendance' },
  });
  const exactHistory = await hr.fetch(
    `/attendanceManagement/shiftRevision?shiftId=${first.id}&revision=1`,
  );
  expect(exactHistory.status).toBe(200);
  expect((await exactHistory.json()).data).toMatchObject({
    id: revision!.id,
    name: 'Night',
    revision: 1,
  });
  expect(
    (await hr.fetch(`/attendanceManagement/shiftRevision?shiftId=${first.id}`))
      .status,
  ).toBe(400);
  expect(
    (
      await hr.fetch(
        `/attendanceManagement/shiftRevision?shiftId=${first.id}&revision=99`,
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await (
        await hr.fetch(
          `/attendanceManagement/shiftRevision?shiftId=${first.id}&revision=99`,
        )
      ).json()
    ).data,
  ).toBeNull();
  const currentShift = await hr.fetch(
    `/attendanceManagement/shifts/${revision!.shiftId}`,
  );
  expect(currentShift.status).toBe(200);
  expect((await currentShift.json()).data).toMatchObject({
    shift: { name: 'Renamed' },
    revision: { name: 'Renamed' },
  });
  expect((await hr.fetch('/attendanceManagement/shifts/missing')).status).toBe(
    404,
  );
  const authz = c.resolve(authorizationToken),
    originalFor = authz.for.bind(authz);
  let fieldMode: 'read' | 'write' = 'read';
  const policySpy = vi.spyOn(authz, 'for').mockImplementation((identity) => {
    const context = originalFor(identity);
    return {
      ...context,
      authorize: (async (check: AuthorizationCheckRequest) => {
        const decision = await context.authorize(check);
        if (
          check.resource.type !== 'composite' ||
          check.resource.id !== 'oa.attendanceManagement' ||
          !decision.conditions?.database
        )
          return decision;
        const database = decision.conditions.database;
        return {
          ...decision,
          conditions: {
            ...decision.conditions,
            database: {
              ...database,
              ...(fieldMode === 'read' && database.attendanceShiftRevisions
                ? {
                    attendanceShiftRevisions: {
                      ...database.attendanceShiftRevisions,
                      read: {
                        scope: true,
                        fields: [
                          'id',
                          'shiftId',
                          'revision',
                          'name',
                          'actorId',
                          'createdAt',
                        ],
                      },
                    },
                  }
                : {}),
              ...(fieldMode === 'write' && database.attendanceShifts
                ? {
                    attendanceShifts: {
                      ...database.attendanceShifts,
                      update: { scope: true, fields: ['version'] },
                    },
                  }
                : {}),
            },
          },
        };
      }) as typeof context.authorize,
    };
  });
  expect(
    (await hr.fetch(`/attendanceManagement/shiftRevision?id=${revision!.id}`))
      .status,
  ).toBe(403);
  fieldMode = 'write';
  expect(
    (
      await hr.fetch(
        '/attendanceManagement/shifts',
        write('POST', { ...changed, expectedVersion: 1 }),
      )
    ).status,
  ).toBe(403);
  expect(await db.repository('attendanceShiftRevisions').count()).toBe(2);
  policySpy.mockRestore();
  const department = await org.createDepartment(
    { title: 'Configured department', managerId: null },
    { actorId: hr.user.id },
  );
  const schedule = {
    departmentId: department.id,
    date: '2026-10-12',
    shiftRevisionId: revision!.id,
    restDay: false,
    expectedVersion: null,
    reason: 'Assign explicit version',
  };
  expect(
    (await hr.fetch('/attendanceManagement/schedule', write('POST', schedule)))
      .status,
  ).toBe(200);
  const query = `/attendanceManagement/schedule?departmentId=${department.id}&date=2026-10-12`;
  expect((await hr.fetch(query)).status).toBe(200);
  const before = await db
    .repository('attendanceSchedules')
    .findOne({ filter: { departmentId: department.id } });
  const spy = vi
    .spyOn(c.resolve(auditServiceToken), 'record')
    .mockRejectedValueOnce(new Error('Audit failed'));
  expect(
    (
      await hr.fetch(
        '/attendanceManagement/schedule',
        write('POST', {
          ...schedule,
          expectedVersion: 0,
          restDay: true,
          shiftRevisionId: null,
        }),
      )
    ).status,
  ).toBe(500);
  spy.mockRestore();
  expect(
    await db
      .repository('attendanceSchedules')
      .findOne({ filter: { id: before!.id } }),
  ).toMatchObject({ version: 0, currentRevisionId: before!.currentRevisionId });
  expect(await db.repository('attendanceScheduleRevisions').count()).toBe(1);
  expect(
    (
      await hr.fetch(
        '/attendanceManagement/schedule',
        write('POST', {
          ...schedule,
          expectedVersion: 0,
          restDay: true,
          shiftRevisionId: null,
        }),
      )
    ).status,
  ).toBe(200);
  const oldSchedule = await hr.fetch(`${query}&revision=1`);
  expect(oldSchedule.status).toBe(200);
  expect((await oldSchedule.json()).data).toMatchObject({
    version: 1,
    revision: { restDay: false, shiftRevisionId: revision!.id },
  });
  expect((await (await hr.fetch(query)).json()).data.revision.restDay).toBe(
    true,
  );
  const swagger = await hr.fetch('/swagger');
  expect(swagger.status).toBe(200);
  const document = await swagger.json();
  expect(
    document.paths['/api/attendanceManagement/shifts'].post.operationId,
  ).toBe('saveAttendanceShift');
  expect(
    document.paths['/api/attendanceManagement/schedule'].post.operationId,
  ).toBe('saveAttendanceDepartmentSchedule');
  const original = (await sets.get('oa-attendance-management-hr'))!;
  await sets.update(original.key, { ...original, grants: [] });
  expect((await hr.fetch(query)).status).toBe(403);
  expect(
    (await hr.fetch('/attendanceManagement/shifts', write('POST', changed)))
      .status,
  ).toBe(403);
  await db.transaction((tx) =>
    installAttendanceManagementPermissions(tx.query),
  );
  expect((await sets.get(original.key))!.grants).toEqual([]);
  await sets.update(original.key, original);
  const scoped = await createUser(testApp, 'Scoped HR');
  await org.addDutyRoleMember('hr', scoped.user.id, { actorId: hr.user.id });
  // Remove inherited all-record defaults; this role receives only the explicit department scope below.
  await sets.update(original.key, { ...original, grants: [] });
  await grantToUser(
    testApp,
    randomUUID(),
    [
      {
        resource: { type: 'composite', id: 'oa.attendanceManagement' },
        actions: ['view', 'manage'].map((action) => ({
          action,
          policy: {
            type: 'composite' as const,
            scopes: {
              attendanceShifts: 'allRecords',
              attendanceShiftRevisions: 'allRecords',
              attendanceSchedules: 'oa.attendanceManagement.myDepartments',
              attendanceScheduleRevisions: 'allRecords',
            },
          },
        })),
      },
    ],
    scoped.user.id,
  );
  expect((await scoped.fetch(query)).status).toBe(200);
  expect((await (await scoped.fetch(query)).json()).data).toBeNull();
  expect(
    (
      await scoped.fetch(
        '/attendanceManagement/schedule',
        write('POST', { ...schedule, date: '2026-10-13' }),
      )
    ).status,
  ).toBe(403);
  expect(await db.repository('attendanceSchedules').count()).toBe(1);
  expect(await db.repository('attendanceScheduleRevisions').count()).toBe(2);
  await org.removeDutyRoleMember('hr', scoped.user.id, { actorId: hr.user.id });
  expect((await scoped.fetch('/attendanceManagement/shifts')).status).toBe(403);
});
