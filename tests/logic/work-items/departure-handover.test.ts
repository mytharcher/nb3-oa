// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { createWorkItemAppTest } from './helpers.js';
import { ALL, createEmployee, employees } from '../employees/helpers.js';
import { handoverDepartureWorkItems } from '../../../server/providers/departure-reassignment/work-items.js';
import { workItemServiceToken } from '../../../server/providers/work-items/contract.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { departureApprovalReassignmentToken } from '../../../server/providers/departure/contract.js';
const test = createWorkItemAppTest();

test('main registry preserves partial owner commits, rolls back failed audit, rechecks revoked grants and retries without duplicate facts', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    ordinary = c.resolve(workItemServiceToken),
    registry = c.resolve(departureApprovalReassignmentToken),
    audit = c.resolve(auditServiceToken),
    authz = c.resolve(authorizationToken);
  const creator = await createEmployee(testApp, 'Automatic departing creator'),
    worker = await createEmployee(testApp, 'Automatic actual worker'),
    successor = await createEmployee(testApp, 'Automatic successor'),
    regularHr = await createEmployee(testApp, 'Ordinary maintenance HR');
  const administrator = (await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS)).user;
  const actor = { userId: administrator.id };
  await employees(testApp).createEmployee(
    {
      userId: actor.userId,
      code: randomUUID(),
      name: 'Actual approval administrator',
      status: 'regular',
      hireDate: '2025-01-01',
    },
    ALL,
    actor.userId,
  );
  await org.addDutyRoleMember('hr', actor.userId, { actorId: actor.userId });
  await org.addDutyRoleMember('hr', regularHr.userId, {
    actorId: actor.userId,
  });
  async function create() {
    const draft = await db.transaction((tx) =>
      ordinary.save(
        {
          actorId: creator.userId,
          requestId: randomUUID(),
          title: 'Automatic confirmation',
          description: 'Independent ordinary lifecycle',
          targetUserId: worker.userId,
          dutyRoleCode: null,
          dueAt: '2030-01-01T00:00:00Z',
          requiresConfirmation: true,
          attachments: [],
        },
        tx,
        ALL,
      ),
    );
    const dispatched = await db.transaction((tx) =>
      ordinary.act(
        {
          id: draft.id,
          actorId: creator.userId,
          requestId: randomUUID(),
          expectedVersion: draft.version,
          action: 'dispatch',
        },
        tx,
        ALL,
      ),
    );
    return db.transaction((tx) =>
      ordinary.act(
        {
          id: draft.id,
          actorId: worker.userId,
          requestId: randomUUID(),
          expectedVersion: dispatched.version,
          action: 'complete',
          result: 'Retained real result',
        },
        tx,
        ALL,
      ),
    );
  }
  const items = [await create(), await create()];
  const order = (
    await ordinary.departureBlockers(creator.userId, db.connection())
  ).items;
  const second = items.find((item) => item.id === order[1].id)!;
  const originalAudit = audit.record.bind(audit);
  const spy = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (input, tx) => {
      if (
        input.action === 'workItem.handoverConfirmation' &&
        input.targetId === second.id
      )
        throw new Error('Injected ordinary handover audit failure');
      return originalAudit(input, tx);
    });
  const input = {
    from: creator.userId,
    to: successor.userId,
    reason: 'Automatic departure handover',
    requestKey: randomUUID(),
  };
  try {
    await expect(registry.reassign(input)).rejects.toThrow(
      'Injected ordinary handover audit failure',
    );
  } finally {
    spy.mockRestore();
  }
  expect(
    (await ordinary.departureBlockers(creator.userId, db.connection()))
      .remaining,
  ).toBe(1);
  expect(
    (await ordinary.departureBlockers(successor.userId, db.connection()))
      .remaining,
  ).toBe(1);
  expect(
    await db.repository('workItems').findOne({ filter: { id: second.id } }),
  ).toMatchObject({
    version: second.version,
    confirmationOwnerUserId: creator.userId,
  });
  expect(
    await db.repository('oaLifecycleTransitions').count({
      filter: { recordId: second.id, transition: 'handoverConfirmation' },
    }),
  ).toBe(0);
  const key = 'oa-work-items-confirmation-maintenance',
    grant = (await authz.permissionSets.get(key))!;
  await authz.permissionSets.update(key, { ...grant, grants: [] });
  await expect(
    handoverDepartureWorkItems(testApp.application, input, regularHr.userId),
  ).rejects.toMatchObject({
    code: 'REASSIGNMENT_VIEW_DENIED',
  });
  await authz.permissionSets.update(key, { ...grant });
  await org.removeDutyRoleMember('hr', actor.userId, {
    actorId: regularHr.userId,
  });
  await expect(registry.reassign(input)).rejects.toMatchObject({
    code: 'REASSIGNMENT_VIEW_DENIED',
  });
  await org.addDutyRoleMember('hr', actor.userId, {
    actorId: regularHr.userId,
  });
  expect(await registry.reassign(input)).toEqual({ remaining: 0 });
  expect(await registry.reassign(input)).toEqual({ remaining: 0 });
  for (const item of items) {
    expect(
      await db.repository('workItems').findOne({ filter: { id: item.id } }),
    ).toMatchObject({
      creatorUserId: creator.userId,
      assigneeUserId: worker.userId,
      confirmationOwnerUserId: successor.userId,
      version: item.version + 1,
      status: 'awaitingConfirmation',
      result: 'Retained real result',
    });
    expect(
      await db.repository('oaLifecycleTransitions').count({
        filter: { recordId: item.id, transition: 'handoverConfirmation' },
      }),
    ).toBe(1);
    expect(
      await db.repository('auditLogs').count({
        filter: {
          targetId: item.id,
          action: 'workItem.handoverConfirmation',
        },
      }),
    ).toBe(1);
  }
  expect(
    (await ordinary.departureBlockers(worker.userId, db.connection()))
      .remaining,
  ).toBe(2);
  expect(
    await registry.reassign({
      ...input,
      from: worker.userId,
      to: creator.userId,
      requestKey: randomUUID(),
    }),
  ).toEqual({ remaining: 2 });
  await expect(
    handoverDepartureWorkItems(
      testApp.application,
      {
        ...input,
        from: successor.userId,
        to: worker.userId,
        requestKey: randomUUID(),
      },
      actor.userId,
    ),
  ).rejects.toThrow('INVALID_TARGET');
  expect(
    (await ordinary.departureBlockers(successor.userId, db.connection()))
      .remaining,
  ).toBe(2);
});
