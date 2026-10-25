// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  createEmployeesAppTest,
  createPerson,
  ALL,
} from '../employees/helpers.js';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
const test = createEmployeesAppTest();
test('team calendar uses original ownership and effective leave periods without disclosing reasons', async ({
  testApp,
}) => {
  const owner = await createPerson(testApp, 'Calendar leave owner'),
    other = await createPerson(testApp, 'Calendar leave other');
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    id = randomUUID();
  await db.repository('leaveRequests').createOne({
    values: {
      id,
      applicantId: owner.userId,
      createdById: owner.userId,
      number: null,
      leaveType: 'annual',
      startDate: '2030-01-02',
      endDate: '2030-01-03',
      startHalf: 'am',
      endHalf: 'pm',
      days: '2',
      reason: 'SECRET_LEAVE_REASON',
      attachments: [],
      handoverUserId: null,
      enableDelegation: false,
      ruleSnapshot: {},
      hrRecipients: [],
      managerApproverId: null,
      requiresHr: false,
      status: 'approved',
      statusChangedAt: new Date(),
      lifecycleVersion: 0,
      createdAt: new Date(),
    },
  });
  await db.repository('leaveAttendance').createOne({
    values: {
      id: randomUUID(),
      applicationId: id,
      userId: owner.userId,
      startDate: '2030-01-02',
      endDate: '2030-01-02',
      startHalf: 'am',
      endHalf: 'am',
      days: '0.5',
      active: true,
      createdAt: new Date(),
    },
  });
  expect(
    (await testApp.request('/personalSchedules/team?date=2030-01-02')).status,
  ).toBe(401);
  const session = await owner.session(),
    foreign = await other.session();
  const response = await session.fetch(
    '/personalSchedules/team?date=2030-01-02',
  );
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.data).toHaveLength(1);
  expect(result.data[0]).toMatchObject({
    id,
    userId: owner.userId,
    kind: 'leave',
  });
  expect(JSON.stringify(result)).not.toContain('SECRET_LEAVE_REASON');
  expect(
    (
      await (
        await foreign.fetch('/personalSchedules/team?date=2030-01-02')
      ).json()
    ).data,
  ).toEqual([]);
  expect(
    (
      await (
        await session.fetch('/personalSchedules/team?date=2030-01-03')
      ).json()
    ).data,
  ).toEqual([]);
  const service = c.resolve(leaveServiceToken);
  await expect(
    service.calendarEntries(
      { ...ALL, read: { scope: true, fields: ['id', 'applicantId'] } },
      db.connection(),
      '2030-01-02',
    ),
  ).rejects.toThrow();
  await db
    .repository('leaveAttendance')
    .updateOne({ filter: { applicationId: id }, values: { active: false } });
  expect(
    (
      await (
        await session.fetch('/personalSchedules/team?date=2030-01-02')
      ).json()
    ).data,
  ).toEqual([]);
}, 120000);
