// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { test } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { OA_TEST_ORIGIN } from '../oa-test-origin.js';

test('HR independently reassigns mentor work to the real current head with rollback, replay and disabled-target guards', async ({
  testApp,
  request,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const hr = await createEmployee(testApp, 'Reassignment HR'),
    oldHead = await createEmployee(testApp, 'Old head'),
    head = await createEmployee(testApp, 'Current head'),
    outsider = await createEmployee(testApp, 'Unrelated employee');
  await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
  const department = await org.createDepartment(
    { title: randomUUID(), managerId: head.userId },
    { actorId: hr.userId },
  );
  const id = randomUUID(),
    taskId = `${id}:mentor`,
    now = new Date();
  await db.repository('onboardings').createOne({
    values: {
      id,
      creatorId: hr.userId,
      employeeId: outsider.employeeId,
      userId: outsider.userId,
      requisitionId: randomUUID(),
      departmentId: department.id,
      positionId: randomUUID(),
      gradeId: randomUUID(),
      hireDate: '2026-10-20',
      status: 'handling',
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  });
  await db.repository('onboardingTasks').createOne({
    values: {
      id: taskId,
      onboardingId: id,
      kind: 'mentor',
      status: 'claimed',
      assigneeId: oldHead.userId,
      targetUserId: oldHead.userId,
      dutyRoleCode: null,
      dueDate: '2026-10-20',
      facts: { plan: 'Preserved draft' },
      forced: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  });
  const route = `/onboardings/${id}/tasks/${encodeURIComponent(taskId)}/actions`,
    payload = {
      action: 'reassignMentor',
      expectedVersion: 1,
      requestId: randomUUID(),
      reason: 'Current department head replaced the old head',
    },
    session = await hr.session();
  const send = (body = payload) =>
    session.fetch(route, {
      method: 'POST',
      headers: { origin: OA_TEST_ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  expect((await request(route, { method: 'POST', json: payload })).status).toBe(
    401,
  );
  expect(
    (
      await (
        await outsider.session()
      ).fetch(route, {
        method: 'POST',
        headers: { origin: OA_TEST_ORIGIN, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
    ).status,
  ).toBe(403);
  const detail = await session.fetch(`/onboardings/${id}`);
  expect(detail.status).toBe(200);
  expect((await detail.json()).data.tasks[0].actions).toContain(
    'reassignMentor',
  );
  const audit = c.resolve(auditServiceToken),
    original = audit.record.bind(audit),
    spy = vi.spyOn(audit, 'record').mockImplementation(async (entry, tx) => {
      if (entry.action === 'onboarding.task.reassignMentor')
        throw new Error('Reassignment audit failure');
      return original(entry, tx);
    });
  expect((await send()).status).toBe(500);
  spy.mockRestore();
  expect(
    await db.repository('onboardingTasks').findOne({ filter: { id: taskId } }),
  ).toMatchObject({ assigneeId: oldHead.userId, version: 1 });
  const response = await send();
  expect(response.status).toBe(200);
  expect((await response.json()).data).toMatchObject({
    targetUserId: head.userId,
    assigneeId: head.userId,
    status: 'claimed',
    dueDate: '2026-10-20',
    facts: { plan: 'Preserved draft' },
    version: 2,
  });
  expect((await send()).status).toBe(200);
  const timelineDetail = (
    await (await session.fetch(`/onboardings/${id}`)).json()
  ).data;
  expect(timelineDetail.timeline).toHaveLength(1);
  expect(timelineDetail.timeline[0]).toMatchObject({
    action: 'onboarding.task.reassignMentor',
    from: { id: oldHead.userId, name: 'Old head' },
    to: { id: head.userId, name: 'Current head' },
  });
  expect((await send({ ...payload, requestId: randomUUID() })).status).toBe(
    409,
  );
  await c.resolve(userAdministrationServiceToken).disable(head.userId);
  expect((await send()).status).toBe(403);
  const finalDetail = await session.fetch(`/onboardings/${id}`);
  expect((await finalDetail.json()).data.tasks[0].actions).not.toContain(
    'reassignMentor',
  );
});
