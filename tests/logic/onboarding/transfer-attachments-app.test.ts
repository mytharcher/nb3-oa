import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import type { AuthorizationCheckRequest } from '@nocobase/authorization/core';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { onboardingServiceToken } from '../../../server/providers/onboarding/contract.js';
import { test } from './helpers.js';
import { createEmployee, ALL } from '../employees/helpers.js';
import { OA_TEST_ORIGIN } from '../oa-test-origin.js';

test('public pool transfer and protected file bytes preserve current ownership, frozen references and audit rollback', async ({
  testApp,
  request,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    service = c.resolve(onboardingServiceToken);
  const first = await createEmployee(testApp, 'Attachment first'),
    second = await createEmployee(testApp, 'Attachment second'),
    outsider = await createEmployee(testApp, 'Attachment outsider');
  await org.addDutyRoleMember('it', first.userId, { actorId: first.userId });
  await org.addDutyRoleMember('it', second.userId, { actorId: first.userId });
  const id = randomUUID(),
    taskId = `${id}:it`,
    now = new Date();
  await db.repository('onboardings').createOne({
    values: {
      id,
      creatorId: first.userId,
      employeeId: first.employeeId,
      userId: first.userId,
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
  await db.repository('onboardingTasks').createOne({
    values: {
      id: taskId,
      onboardingId: id,
      kind: 'it',
      status: 'claimed',
      assigneeId: first.userId,
      targetUserId: null,
      dutyRoleCode: 'it',
      dueDate: '2026-10-19',
      facts: null,
      forced: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  });
  const one = await first.session(),
    two = await second.session(),
    other = await outsider.session();
  const route = `/onboardings/${id}/tasks/${encodeURIComponent(taskId)}/actions`;
  const payload = {
    action: 'transfer',
    targetUserId: second.userId,
    expectedVersion: 1,
    requestId: randomUUID(),
    reason: 'Same duty pool handover',
  };
  const headers = { origin: OA_TEST_ORIGIN };
  expect((await request(`/onboardings/${id}`)).status).toBe(401);
  const candidates = await one.fetch(
    `/onboardings/${id}/tasks/${encodeURIComponent(taskId)}/transferCandidates`,
  );
  expect(candidates.status).toBe(200);
  expect(
    (await candidates.json()).data.map((p: { id: string }) => p.id),
  ).toContain(second.userId);
  expect(
    (
      await one.fetch(route, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, targetUserId: outsider.userId }),
      })
    ).status,
  ).toBe(403);
  // Narrow only ordinary task read decisions while the real transfer grant remains intact.
  const authz = c.resolve(authorizationToken),
    originalFor = authz.for.bind(authz);
  let narrowFields = true;
  const decisionSpy = vi.spyOn(authz, 'for').mockImplementation((identity) => {
    const context = originalFor(identity);
    return {
      ...context,
      authorize: (async (check: AuthorizationCheckRequest) => {
        const decision = await context.authorize(check),
          p = decision.conditions?.database?.onboardingTasks;
        if (
          check.resource.type !== 'composite' ||
          check.resource.id !== 'oa.onboarding' ||
          check.action !== 'view' ||
          !p
        )
          return decision;
        return {
          ...decision,
          conditions: {
            ...decision.conditions,
            database: {
              ...decision.conditions!.database,
              onboardingTasks: {
                ...p,
                read: narrowFields
                  ? { scope: true as const, fields: ['id'] }
                  : { scope: { id: 'out-of-view-scope' }, fields: undefined },
              },
            },
          },
        };
      }) as typeof context.authorize,
    };
  });
  for (const fields of [true, false]) {
    narrowFields = fields;
    expect(
      (
        await one.fetch(
          `/onboardings/${id}/tasks/${encodeURIComponent(taskId)}/transferCandidates`,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await one.fetch(route, {
          method: 'POST',
          headers: { ...headers, 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
      ).status,
    ).toBe(403);
  }
  decisionSpy.mockRestore();
  async function upload(session = one) {
    const form = new FormData();
    form.append(
      'file',
      new File(['Safe task evidence'], 'evidence.txt', { type: 'text/plain' }),
    );
    return session.fetch('/onboardingAttachments/uploadOne', {
      method: 'POST',
      headers: {
        ...headers,
        'x-onboarding-id': id,
        'x-onboarding-task-id': taskId,
      },
      body: form,
    });
  }
  const realFiles = c
    .resolve(serverFileRepositoryManagerToken)
    .repository('onboardingFiles', {
      disk: 'local',
      accessPath: '/uploads/onboarding',
      policy: {
        read: true,
        create: {
          scope: true,
          defaults: {
            onboardingId: id,
            taskId,
            ownerId: first.userId,
            uploadVersion: 0,
          },
        },
        update: false,
        delete: false,
      },
    });
  const beforeFiles = await db
    .repository('onboardingFiles')
    .count({ filter: { taskId } });
  await expect(
    realFiles.uploadOne({
      file: new File(['Stale evidence'], 'stale.txt', { type: 'text/plain' }),
    }),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
  expect(
    await db.repository('onboardingFiles').count({ filter: { taskId } }),
  ).toBe(beforeFiles);
  const uploaded = await upload();
  expect(uploaded.status).toBe(201);
  const file = (await uploaded.json()).data.record as {
    id: string;
    contentUrl: string;
    disk?: string;
    key?: string;
  };
  expect(file.disk).toBeUndefined();
  expect(file.key).toBeUndefined();
  const bytes = (session: typeof one, url: string) =>
    testApp.fetch(
      new Request(new URL(url, OA_TEST_ORIGIN), {
        headers: { cookie: session.cookie },
      }),
    );
  expect((await bytes(one, file.contentUrl)).status).toBe(200);
  expect((await bytes(other, file.contentUrl)).status).toBe(403);
  const transfer = await one.fetch(route, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  expect(transfer.status).toBe(200);
  expect((await transfer.json()).data.assignee.id).toBe(second.userId);
  expect((await upload()).status).toBe(403);
  expect((await bytes(one, file.contentUrl)).status).toBe(403);
  expect((await bytes(two, file.contentUrl)).status).toBe(403);
  const fresh = await upload(two);
  expect(fresh.status).toBe(201);
  const freshFile = (await fresh.json()).data.record as {
    id: string;
    contentUrl: string;
  };
  const complete = {
    id,
    taskId,
    action: 'complete' as const,
    expectedVersion: 2,
    facts: {
      accountId: first.userId,
      deviceReference: 'Unlinked text reference',
    },
    attachmentIds: [freshFile.id],
  };
  const audit = c.resolve(auditServiceToken),
    original = audit.record.bind(audit);
  const failed = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, ...rest) => {
      if (entry.action === 'onboarding.task.complete')
        throw new Error('audit refused');
      return original(entry, ...rest);
    });
  const command = {
    actorId: second.userId,
    requestKey: randomUUID(),
    reason: 'Protected attachment completion',
  };
  await expect(
    db.transaction((tx) => service.act(complete, command, tx, ALL, ALL)),
  ).rejects.toThrow('audit refused');
  failed.mockRestore();
  expect(
    (await db.repository('onboardingTasks').findOne({ filter: { id: taskId } }))
      ?.version,
  ).toBe(2);
  const completed = await db.transaction((tx) =>
    service.act(complete, command, tx, ALL, ALL),
  );
  expect(
    (await db.repository('onboardings').findOne({ filter: { id } }))?.status,
  ).toBe('completed');
  expect(
    await db.transaction((tx) => service.act(complete, command, tx, ALL, ALL)),
  ).toEqual(completed);
  expect((await bytes(one, freshFile.contentUrl)).status).toBe(200);
  expect((await upload(two)).status).toBe(403);
  await org.removeDutyRoleMember('it', second.userId, {
    actorId: first.userId,
  });
  // Completed assignee retains ordinary view until the independent view grant is revoked.
  expect((await bytes(two, freshFile.contentUrl)).status).toBe(200);
  const sets = c.resolve(authorizationToken).permissionSets,
    base = (await sets.get('oa-onboarding-employee'))!;
  await sets.update(base.key, {
    ...base,
    grants: base.grants.map((g) => ({
      ...g,
      actions: g.actions.filter((a) => a.action !== 'view'),
    })),
  });
  expect((await bytes(two, freshFile.contentUrl)).status).toBe(403);
  await expect(
    db.transaction((tx) => service.act(complete, command, tx, ALL, ALL)),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
  // Disable the current actual actor: public attachment facade must refuse it in the same transaction.
  await c.resolve(userAdministrationServiceToken).disable(first.userId);
  await expect(
    db.transaction((tx) =>
      service.authorizeAttachment(taskId, first.userId, tx),
    ),
  ).rejects.toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
});

test('public target disabling committed ahead of transfer rejects the disabled target without changing the task', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    users = c.resolve(userAdministrationServiceToken),
    service = c.resolve(onboardingServiceToken);
  const first = await createEmployee(testApp, 'Transfer race source'),
    target = await createEmployee(testApp, 'Transfer race target');
  for (const user of [first, target])
    await org.addDutyRoleMember('it', user.userId, { actorId: first.userId });
  const id = randomUUID(),
    taskId = `${id}:it`,
    now = new Date();
  await db.repository('onboardings').createOne({
    values: {
      id,
      creatorId: first.userId,
      employeeId: first.employeeId,
      userId: first.userId,
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
  await db.repository('onboardingTasks').createOne({
    values: {
      id: taskId,
      onboardingId: id,
      kind: 'it',
      status: 'claimed',
      assigneeId: first.userId,
      targetUserId: null,
      dutyRoleCode: 'it',
      dueDate: '2026-10-19',
      facts: null,
      forced: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  });
  let began!: () => void, release!: () => void;
  const entered = new Promise<void>((r) => {
      began = r;
    }),
    gate = new Promise<void>((r) => {
      release = r;
    });
  const disabling = db.transaction(async (tx) => {
    await users.withConnection(tx).disable(target.userId);
    began();
    await gate;
  });
  await entered;
  const transfer = db.transaction((tx) =>
    service.act(
      {
        id,
        taskId,
        action: 'transfer',
        targetUserId: target.userId,
        expectedVersion: 1,
      },
      {
        actorId: first.userId,
        requestKey: randomUUID(),
        reason: 'Concurrent real public identity disabling',
      },
      tx,
      ALL,
      ALL,
    ),
  );
  const outcome = transfer.then(
    () => null,
    (error) => error as Error & { code: string },
  );
  release();
  await disabling;
  expect(await outcome).toMatchObject({ code: 'ONBOARDING_FORBIDDEN' });
  expect(
    await db.repository('onboardingTasks').findOne({ filter: { id: taskId } }),
  ).toMatchObject({ assigneeId: first.userId, version: 1 });
});
