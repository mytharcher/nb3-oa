// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { apiDocsToken } from '@nocobase/app-server/router';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import {
  onboardingServiceToken,
  OnboardingError,
  ONBOARDING_FIELDS,
  ONBOARDING_TASK_FIELDS,
} from '../../../server/providers/onboarding/index.js';
import { ALL, createEmployee } from '../employees/helpers.js';
import { test } from './helpers.js';

test('main detail projects safe immutable events and fails closed on current parent/task row and field policies', async ({
  testApp,
  request,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken),
    service = c.resolve(onboardingServiceToken);
  const hr = await createEmployee(testApp, 'Timeline HR'),
    outsider = await createEmployee(testApp, 'Timeline unrelated'),
    hire = await createEmployee(testApp, 'Timeline hire');
  await c
    .resolve(organizationServiceToken)
    .addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
  const id = randomUUID(),
    it = `${id}:it`,
    finance = `${id}:finance`,
    now = new Date();
  await db.repository('onboardings').createOne({
    values: {
      id,
      creatorId: hr.userId,
      userId: hire.userId,
      employeeId: hire.employeeId,
      requisitionId: randomUUID(),
      departmentId: randomUUID(),
      positionId: randomUUID(),
      gradeId: randomUUID(),
      hireDate: '2026-10-20',
      status: 'handling',
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  });
  for (const [taskId, kind] of [
    [it, 'it'],
    [finance, 'finance'],
  ])
    await db.repository('onboardingTasks').createOne({
      values: {
        id: taskId,
        onboardingId: id,
        kind,
        status: 'open',
        assigneeId: null,
        targetUserId: null,
        dutyRoleCode: kind,
        forced: false,
        facts: null,
        dueDate: '2026-10-19',
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
    });
  await audit.record({
    actorId: hr.userId,
    action: 'onboarding.create',
    targetType: 'onboardings',
    targetId: id,
    reason: 'Private salary 98765.12 and bank SECRET_BANK',
    after: { baseSalary: '98765.12' },
  });
  for (const taskId of [it, finance])
    await audit.record({
      actorId: hr.userId,
      action: 'onboarding.task.complete',
      targetType: 'onboardings',
      targetId: id,
      after: {
        taskId,
        forced: false,
        assetReceiptId: 'SAFE_RECEIPT',
        bankAccount: 'SECRET_BANK',
      },
      reason: 'SECRET_BANK',
    });
  await db.repository('onboardingReminders').createOne({
    values: {
      id: randomUUID(),
      taskId: it,
      onboardingId: id,
      recipientIds: [hr.userId],
      status: 'sent',
      createdAt: now,
      sentAt: now,
    },
  });
  const route = `/onboardings/${id}`;
  expect((await request(route)).status).toBe(401);
  expect((await (await outsider.session()).fetch(route)).status).toBe(403);
  const response = await (await hr.session()).fetch(route);
  expect(response.status).toBe(200);
  const body = (await response.json()).data;
  expect(body.timeline.map((e: { action: string }) => e.action)).toEqual(
    expect.arrayContaining([
      'onboarding.create',
      'onboarding.task.complete',
      'onboarding.reminder.queued',
      'onboarding.reminder.sent',
    ]),
  );
  expect(
    body.timeline.find(
      (event: { action: string }) => event.action === 'onboarding.create',
    ).actor,
  ).toEqual({
    id: hr.userId,
    name: 'Timeline HR',
  });
  for (const token of [
    '98765.12',
    'SECRET_BANK',
    'recipientIds',
    'reason',
    '"after"',
    '"before"',
  ])
    expect(JSON.stringify(body.timeline)).not.toContain(token);
  const scoped = await service.detail(id, db.connection(), ALL, {
    ...ALL,
    read: { scope: { id: it }, fields: [...ONBOARDING_TASK_FIELDS] },
  });
  expect(scoped.timeline.filter((e) => e.taskId === finance)).toEqual([]);
  expect(JSON.stringify(scoped.timeline)).not.toContain(finance);
  await expect(
    service.detail(
      id,
      db.connection(),
      { ...ALL, read: { scope: { id: 'no' }, fields: [...ONBOARDING_FIELDS] } },
      ALL,
    ),
  ).rejects.toBeInstanceOf(OnboardingError);
  await expect(
    service.detail(id, db.connection(), ALL, {
      ...ALL,
      read: { scope: true, fields: ['id', 'onboardingId'] },
    }),
  ).rejects.toBeInstanceOf(OnboardingError);
  const document = await c.resolve(apiDocsToken).getDocument();
  expect(document.paths?.['/api/onboardings/{id}']?.get?.operationId).toBe(
    'getOnboarding',
  );
});
