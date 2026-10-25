import { reconcileAttendance } from '../../../server/providers/attendance/schedule.js';
// @vitest-environment node
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import type { AuthorizationCheckRequest } from '@nocobase/authorization/core';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { startOrgTestApp, json, type OrgTestApp } from '../org/helpers.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
let app: OrgTestApp;
beforeAll(async () => {
  app = await startOrgTestApp();
}, 120000);
afterAll(async () => app?.close());
it('enforces ownership, explicit calculation, scoped export and field restrictions before monthly totals', async () => {
  const alice = await app.createUser('AttendanceAlice'),
    bob = await app.createUser('AttendanceBob'),
    hr = await app.createUser('AttendanceHr');
  const c = app.testApp.application.container,
    db = c.resolve(databaseManagerToken),
    calendar = c.resolve(calendarServiceToken);
  await app.organization.addDutyRoleMember('hr', hr.user.id, {
    actorId: hr.user.id,
  });
  for (const user of [alice, bob])
    await db.repository('employees').createOne({
      values: {
        id: `attendance-${user.user.id}`,
        userId: user.user.id,
        code: `attendance-${user.user.id}`,
        name: 'Synthetic attendance employee',
        status: 'regular',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  const date = calendar.addCalendarDays(calendar.localDate(new Date()), -3);
  const month = date.slice(0, 7),
    url = `/attendanceResults?month=${month}`;
  expect((await app.testApp.request(url)).status).toBe(401);
  const command = {
    date,
    reason: 'Synthetic self calculation',
    requestKey: 'calculate-day',
  };
  const calculated = await alice.fetch(
    '/attendanceResults/calculate',
    json(command),
  );
  expect(calculated.status).toBe(200);
  const aliceId = (await calculated.json()).data.id;
  expect(
    (await bob.fetch('/attendanceResults/calculate', json(command))).status,
  ).toBe(200);
  const response = await alice.fetch(url);
  expect(response.status).toBe(200);
  const data = (await response.json()).data;
  expect(data.total).toBe(1);
  expect(data.items[0]).toMatchObject({
    userId: alice.user.id,
    userName: 'AttendanceAlice',
    result: { status: 'blocked' },
  });
  expect(data.items[0]).not.toHaveProperty('snapshot');
  expect(data.summary.blockedDays).toBe(1);
  expect(
    (await (await bob.fetch(`${url}&userId=${alice.user.id}`)).json()).data
      .total,
  ).toBe(0);
  expect(
    (
      await bob.fetch(
        '/attendanceResults/calculate',
        json({ ...command, id: aliceId, requestKey: 'other-user' }),
      )
    ).status,
  ).toBe(403);
  expect(
    (await alice.fetch(`/attendanceResults/export?month=${month}`)).status,
  ).toBe(403);
  const exported = await hr.fetch(`/attendanceResults/export?month=${month}`);
  expect(exported.status).toBe(200);
  expect((await exported.json()).data.items).toHaveLength(2);
  expect(
    (
      await alice.fetch(
        '/attendanceResults/calculate',
        json({
          ...command,
          date: calendar.localDate(new Date()),
          requestKey: 'future',
        }),
      )
    ).status,
  ).toBe(400);
  const authz = c.resolve(authorizationToken),
    originalFor = authz.for.bind(authz);
  const policySpy = vi.spyOn(authz, 'for').mockImplementation((identity) => {
    const context = originalFor(identity);
    return {
      ...context,
      authorize: (async (check: AuthorizationCheckRequest) => {
        const decision = await context.authorize(check);
        const policy =
          decision.conditions?.database?.attendanceEvaluationRevisions;
        if (check.resource.id !== 'oa.attendanceResults' || !policy)
          return decision;
        return {
          ...decision,
          conditions: {
            ...decision.conditions,
            database: {
              ...decision.conditions?.database,
              attendanceEvaluationRevisions: {
                ...policy,
                read: { scope: true, fields: ['id', 'evaluationId'] },
              },
            },
          },
        };
      }) as typeof context.authorize,
    };
  });
  try {
    expect((await alice.fetch(url)).status).toBe(403);
    const beforeDenied = await db
      .repository('attendanceEvaluationRevisions')
      .count();
    expect(
      (
        await alice.fetch(
          '/attendanceResults/calculate',
          json({ ...command, requestKey: 'field-denied-recalculation' }),
        )
      ).status,
    ).toBe(403);
    expect(await db.repository('attendanceEvaluationRevisions').count()).toBe(
      beforeDenied,
    );
    expect(
      (await hr.fetch(`/attendanceResults/export?month=${month}`)).status,
    ).toBe(403);
  } finally {
    policySpy.mockRestore();
  }
  const admin = await app.admin();
  const schedules = await admin.fetch('/scheduler/schedules?pageSize=100');
  expect(schedules.status).toBe(200);
  expect((await schedules.json()).data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: 'oa.attendance.daily-reconciliation',
        timezone: calendar.timeZone(),
      }),
    ]),
  );
  const sweep = await reconcileAttendance(
    app.testApp.application,
    'synthetic-occurrence',
  );
  expect(sweep).toMatchObject({ evaluated: 14, blocked: 14 });
  const revisions = await db
    .repository('attendanceEvaluationRevisions')
    .count();
  await reconcileAttendance(app.testApp.application, 'synthetic-occurrence');
  expect(await db.repository('attendanceEvaluationRevisions').count()).toBe(
    revisions,
  );
}, 120000);
