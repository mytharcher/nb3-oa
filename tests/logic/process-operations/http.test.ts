// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
import { outingServiceToken } from '../../../server/providers/outings/index.js';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
import { requestSearchRegistryToken } from '../../../server/providers/request-search/contract.js';
import { grantToUser } from '../employees/helpers.js';
const test = createPlatformAppTest();
test('real leave and outing totals, independent report gate and owner scopes intersect', async ({
  app,
  testApp,
  request,
}) => {
  const db = app.container.resolve(databaseManagerToken),
    leave = app.container.resolve(leaveServiceToken),
    outing = app.container.resolve(outingServiceToken);
  const reader = await createUser(testApp, 'Report reader'),
    other = await createUser(testApp, 'Report outsider'),
    manager = await createUser(testApp, 'Report manager');
  const managerEmployee = randomUUID(),
    departmentId = randomUUID();
  for (const [user, id, managerId] of [
    [manager.user, managerEmployee, null],
    [reader.user, randomUUID(), managerEmployee],
    [other.user, randomUUID(), managerEmployee],
  ] as const)
    await db.repository('employees').createOne({
      values: {
        id,
        code: id,
        userId: user.id,
        name: user.name,
        managerId,
        status: 'regular',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  await db.repository('departments').createOne({
    values: {
      id: departmentId,
      title: 'Outside department',
      managerId: manager.user.id,
      active: true,
    },
  });
  await db.repository('departmentMembers').createOne({
    values: {
      id: randomUUID(),
      departmentId,
      userId: other.user.id,
      primary: true,
      active: true,
    },
  });
  const actual: { kind: string; id: string; elapsed: number }[] = [];
  for (const [service, kind, user] of [
    [leave, 'oa.leave', reader.user],
    [outing, 'oa.outing', reader.user],
    [leave, 'oa.leave', other.user],
  ] as const) {
    const draft =
      kind === 'oa.leave'
        ? await leave.create(
            {
              leaveType: 'personal',
              startDate: '2026-11-02',
              endDate: '2026-11-02',
              startHalf: 'am',
              endHalf: 'pm',
              reason: 'secret reason',
              attachments: [],
              handoverUserId: null,
              enableDelegation: false,
            },
            user.id,
          )
        : await outing.create(
            {
              startAt: new Date(Date.now() + 3600000).toISOString(),
              endAt: new Date(Date.now() + 7200000).toISOString(),
              location: 'Secret location',
              reason: 'Secret purpose',
            },
            user.id,
          );
    const id = String(draft.record.id);
    await service.transition(
      id,
      'submit',
      user.id,
      Number(draft.record.lifecycleVersion),
      randomUUID(),
    );
    if (kind === 'oa.leave' && user.id === reader.user.id) {
      const first = await leave.detail(id, manager.user.id);
      const offered = first.taskActions.find((row) =>
        row.actions.some((action) => action.name === 'return'),
      )!;
      await leave.action(
        id,
        {
          target: { taskId: offered.task.id },
          action: 'return',
          comment: 'Synthetic correction',
          input: { to: 'revision' },
          contentHash: first.runs.find(
            (view) => view.run.id === offered.task.runId,
          )!.run.contentHash,
          requestId: randomUUID(),
        },
        manager.user.id,
      );
      const revision = await leave.detail(id, user.id);
      await leave.transition(
        id,
        'submit',
        user.id,
        Number(revision.record.lifecycleVersion),
        randomUUID(),
      );
    }
    const detail = await service.detail(id, manager.user.id),
      offer = detail.taskActions.find((t) =>
        t.actions.some((a) => a.name === 'approve'),
      )!;
    await service.action(
      id,
      {
        target: { taskId: offer.task.id },
        action: 'approve',
        contentHash: detail.runs.find((r) => r.run.id === offer.task.runId)!.run
          .contentHash,
        requestId: randomUUID(),
      },
      manager.user.id,
    );
    const final = await service.detail(id, user.id),
      runs = final.runs;
    actual.push({
      kind,
      id,
      elapsed:
        Math.max(...runs.map((v) => Date.parse(v.run.endedAt!))) -
        Math.min(...runs.map((v) => Date.parse(v.run.startedAt))),
    });
  }
  const source = app.container
    .resolve(requestSearchRegistryToken)
    .sources()
    .find((row) => row.kind === 'oa.leave')!;
  expect(
    await source.reportingCandidates({
      before: new Date(Date.now() + 86400000).toISOString(),
      limit: 100,
      policy: {
        read: { scope: true, fields: ['id', 'number'] },
        create: false,
        update: false,
        delete: false,
      },
    }),
  ).toEqual([]);
  const now = new Date(),
    from = new Date(+now - 86400000).toISOString().slice(0, 10),
    to = new Date(+now + 86400000).toISOString().slice(0, 10),
    url = `/reports/process-operations?from=${from}&to=${to}`;
  expect((await request(url)).status).toBe(401);
  expect((await reader.fetch(url)).status).toBe(403);
  const key = randomUUID();
  await grantToUser(
    testApp,
    key,
    [
      {
        resource: { type: 'settings', id: 'oa.processOperations' },
        actions: [{ action: 'read' }],
      },
    ],
    reader.user.id,
  );
  const response = await reader.fetch(url);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const body = await response.json();
  for (const fact of actual.slice(0, 2))
    expect(
      body.data.processes.find((p: { kind: string }) => p.kind === fact.kind),
    ).toMatchObject({
      submitted: 1,
      completed: 1,
      returned: fact.kind === 'oa.leave' ? 1 : 0,
      returnRate: fact.kind === 'oa.leave' ? 1 : 0,
      averageElapsedMs: fact.elapsed,
    });
  expect(JSON.stringify(body)).not.toContain('Secret');
  expect(JSON.stringify(body)).not.toContain(other.user.id);
  expect(
    (await (await reader.fetch(url + `&departmentId=${departmentId}`)).json())
      .data.processes,
  ).toEqual([]);
  expect(
    (
      await (
        await reader.fetch(
          '/reports/process-operations?from=2000-01-01&to=2000-01-02',
        )
      ).json()
    ).data.processes,
  ).toEqual([]);
  expect(
    (
      await reader.fetch(
        '/reports/process-operations?from=2025-01-01&to=2026-01-01',
      )
    ).status,
  ).toBe(400);
  const authz = app.container.resolve(authorizationToken),
    set = await authz.permissionSets.get(key);
  await authz.permissionSets.update(key, { ...set!, grants: [] });
  expect((await reader.fetch(url)).status).toBe(403);
}, 120000);
