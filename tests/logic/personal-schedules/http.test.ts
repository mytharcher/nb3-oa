import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
// @vitest-environment node
import { expect, vi } from 'vitest';
import type { AuthorizationCheckRequest } from '@nocobase/authorization/core';
import { databaseManagerToken } from '@nocobase/db';
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';
import {
  createEmployeesAppTest,
  createPerson,
  grantToUser,
  ALL,
} from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import {
  personalScheduleServiceToken,
  createPersonalScheduleService,
} from '../../../server/providers/personal-schedules/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
const test = createEmployeesAppTest();
async function fixture(testApp: Parameters<typeof createPerson>[0]) {
  const owner = await createPerson(testApp, 'Schedule owner'),
    other = await createPerson(testApp, 'Schedule other'),
    denied = await createPerson(testApp, 'Schedule denied');
  for (const user of [owner, other])
    await grantToUser(
      testApp,
      `schedule-${user.userId}`,
      [
        {
          resource: { type: 'composite', id: 'oa.personalSchedules' },
          actions: ['view', 'create', 'edit', 'delete'].map((action) => ({
            action,
            policy: {
              type: 'composite' as const,
              scopes: { personalSchedules: 'oa.personalSchedulesOwned' },
            },
          })),
        },
      ],
      user.userId,
    );
  return {
    owner,
    other,
    denied,
    body: {
      title: 'Personal appointment',
      description: 'Private notes',
      startAt: '2030-01-01T09:00:00+08:00',
      endAt: '2030-01-01T10:00:00+08:00',
    },
  };
}
test('main PostgreSQL personal schedule CRUD enforces current action, owner, input and optimistic version', async ({
  testApp,
}) => {
  const { owner, other, denied, body } = await fixture(testApp),
    session = await owner.session(),
    foreign = await other.session(),
    noGrant = await denied.session();
  const docs = testApp.application.container.resolve(apiDocsToken);
  expect(findApiDocumentSchemaProblems(await docs.getDocument())).toEqual([]);
  expect(findUndeclaredApiRoutes(testApp.application)).toEqual([]);
  expect((await testApp.request('/personalSchedules')).status).toBe(401);
  expect((await noGrant.fetch('/personalSchedules')).status).toBe(403);
  expect(
    (
      await session.fetch(
        '/personalSchedules',
        write('POST', { ...body, ownerUserId: other.userId }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await session.fetch(
        '/personalSchedules',
        write('POST', { ...body, endAt: body.startAt }),
      )
    ).status,
  ).toBe(400);
  const created = await session.fetch(
    '/personalSchedules',
    write('POST', body),
  );
  expect(created.status).toBe(200);
  const row = (await created.json()).data;
  expect(row.owner).toEqual({ id: owner.userId, name: 'Schedule owner' });
  expect(row.startAt).toBe('2030-01-01T01:00:00.000Z');
  expect((await foreign.fetch(`/personalSchedules/${row.id}`)).status).toBe(
    404,
  );
  expect(
    (
      await foreign.fetch(
        `/personalSchedules/${row.id}`,
        write('PATCH', { ...body, expectedVersion: 1 }),
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await foreign.fetch(
        `/personalSchedules/${row.id}`,
        write('DELETE', { expectedVersion: 1 }),
      )
    ).status,
  ).toBe(404);
  expect(
    (await (await foreign.fetch('/personalSchedules')).json()).data,
  ).toEqual([]);
  const edited = await session.fetch(
    `/personalSchedules/${row.id}`,
    write('PATCH', { ...body, title: 'Changed', expectedVersion: 1 }),
  );
  expect(edited.status).toBe(200);
  expect((await edited.json()).data.version).toBe(2);
  expect(
    (
      await session.fetch(
        `/personalSchedules/${row.id}`,
        write('PATCH', { ...body, expectedVersion: 1 }),
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await session.fetch(
        `/personalSchedules/${row.id}`,
        write('DELETE', { expectedVersion: 2 }),
      )
    ).status,
  ).toBe(204);
  expect((await session.fetch(`/personalSchedules/${row.id}`)).status).toBe(
    404,
  );
  const audit = testApp.application.container.resolve(auditServiceToken);
  const records = await audit.list({
    targetType: 'personalSchedules',
    targetId: row.id,
    page: 1,
    pageSize: 10,
  });
  expect(records.items.map((x) => x.action).sort()).toEqual([
    'personalSchedule.create',
    'personalSchedule.delete',
    'personalSchedule.edit',
  ]);
  expect(JSON.stringify(records.items)).not.toContain('Private notes');
  const next = (
    await (
      await session.fetch('/personalSchedules', write('POST', body))
    ).json()
  ).data;
  const races = await Promise.all(
    [1, 2].map((n) =>
      session.fetch(
        `/personalSchedules/${next.id}`,
        write('PATCH', {
          ...body,
          title: `Concurrent ${n}`,
          expectedVersion: 1,
        }),
      ),
    ),
  );
  expect(races.map((r) => r.status).sort()).toEqual([200, 409]);
  const authz = testApp.application.container.resolve(authorizationToken);
  for (const assignment of await authz.permissionSets.listAssignments(
    `schedule-${owner.userId}`,
  ))
    await authz.permissionSets.revoke(assignment.id);
  expect((await session.fetch('/personalSchedules')).status).toBe(403);
});
test('public owner facade refuses foreign access even under broad policies and rolls mutation/audit back together', async ({
  testApp,
}) => {
  const { owner, other, body } = await fixture(testApp),
    c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(personalScheduleServiceToken);
  await expect(
    service.create(body, '', db.connection(), ALL),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  await expect(
    service.create(
      { ...body, startAt: '2030-01-01' },
      owner.userId,
      db.connection(),
      ALL,
    ),
  ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  const row = await service.create(body, owner.userId, db.connection(), ALL);
  await expect(
    service.get(row.id, owner.userId, db.connection(), {
      ...ALL,
      read: { scope: true, fields: ['id', 'ownerUserId'] },
    }),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  await expect(
    service.get(row.id, other.userId, db.connection(), ALL),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(
    db.transaction(async (tx) => {
      await service.edit(
        row.id,
        1,
        { ...body, title: 'Rollback' },
        owner.userId,
        tx,
        ALL,
      );
      throw new Error('abort outer transaction');
    }),
  ).rejects.toThrow('abort outer');
  expect(
    (await service.get(row.id, owner.userId, db.connection(), ALL)).version,
  ).toBe(1);
  const logs = await c.resolve(auditServiceToken).list({
    targetType: 'personalSchedules',
    targetId: row.id,
    page: 1,
    pageSize: 10,
  });
  expect(logs.total).toBe(1);
  await expect(
    service.edit(row.id, 1, body, owner.userId, db.connection(), {
      ...ALL,
      update: false,
    }),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
});

test('audit failure rolls inner write back even if caller catches and commits outer transaction', async ({
  testApp,
}) => {
  const { owner, body } = await fixture(testApp),
    c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken);
  const failing = createPersonalScheduleService({
    ...audit,
    record: async () => {
      throw new Error('audit unavailable');
    },
  });
  await db.transaction(async (tx) => {
    await expect(failing.create(body, owner.userId, tx, ALL)).rejects.toThrow(
      'audit unavailable',
    );
  });
  expect(
    await db
      .repository('personalSchedules')
      .count({ filter: { ownerUserId: owner.userId } }),
  ).toBe(0);
  expect(
    (
      await audit.list({
        targetType: 'personalSchedules',
        actorId: owner.userId,
        page: 1,
        pageSize: 10,
      })
    ).total,
  ).toBe(0);
});

test('actual PostgreSQL writes enforce narrower create and update scopes without changing data or audit', async ({
  testApp,
}) => {
  const { owner, body } = await fixture(testApp),
    c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(personalScheduleServiceToken),
    audit = c.resolve(auditServiceToken);
  const creationPolicy = {
    ...ALL,
    create: {
      scope: { title: 'Allowed title' },
      fields: [
        'id',
        'ownerUserId',
        'title',
        'description',
        'startAt',
        'endAt',
        'version',
      ],
    },
  };
  await expect(
    service.create(
      { ...body, title: 'Forbidden title' },
      owner.userId,
      db.connection(),
      creationPolicy,
    ),
  ).rejects.toThrow();
  expect(
    await db
      .repository('personalSchedules')
      .count({ filter: { ownerUserId: owner.userId } }),
  ).toBe(0);
  expect(
    (
      await audit.list({
        targetType: 'personalSchedules',
        actorId: owner.userId,
        page: 1,
        pageSize: 10,
      })
    ).total,
  ).toBe(0);
  const row = await service.create(body, owner.userId, db.connection(), ALL);
  const updatePolicy = {
    ...ALL,
    update: {
      scope: { id: 'another-record' },
      fields: ['title', 'description', 'startAt', 'endAt', 'version'],
    },
  };
  await expect(
    service.edit(
      row.id,
      1,
      { ...body, title: 'Forbidden update' },
      owner.userId,
      db.connection(),
      updatePolicy,
    ),
  ).rejects.toThrow();
  expect(
    await service.get(row.id, owner.userId, db.connection(), ALL),
  ).toMatchObject({ title: body.title, version: 1 });
  expect(
    (
      await audit.list({
        targetType: 'personalSchedules',
        actorId: owner.userId,
        page: 1,
        pageSize: 10,
      })
    ).total,
  ).toBe(1);
});

test('actual PostgreSQL update cannot bypass a scope narrower than read', async ({
  testApp,
}) => {
  const { owner, body } = await fixture(testApp),
    c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(personalScheduleServiceToken);
  const row = await service.create(body, owner.userId, db.connection(), ALL);
  await expect(
    service.edit(
      row.id,
      1,
      { ...body, title: 'Forbidden update' },
      owner.userId,
      db.connection(),
      {
        ...ALL,
        update: {
          scope: { id: 'another-record' },
          fields: ['title', 'description', 'startAt', 'endAt', 'version'],
        },
      },
    ),
  ).rejects.toThrow();
  expect(
    await service.get(row.id, owner.userId, db.connection(), ALL),
  ).toMatchObject({ title: body.title, version: 1 });
  expect(
    (
      await c.resolve(auditServiceToken).list({
        targetType: 'personalSchedules',
        actorId: owner.userId,
        page: 1,
        pageSize: 10,
      })
    ).total,
  ).toBe(1);
});

test('production HTTP turns actual narrower repository scopes into 403 while unknown database failures stay 500', async ({
  testApp,
}) => {
  const { owner, body } = await fixture(testApp),
    c = testApp.application.container,
    session = await owner.session(),
    authz = c.resolve(authorizationToken),
    original = authz.for.bind(authz);
  const row = (
    await (
      await session.fetch('/personalSchedules', write('POST', body))
    ).json()
  ).data;
  const spy = vi.spyOn(authz, 'for').mockImplementation((identity) => {
    const context = original(identity);
    return {
      ...context,
      authorize: (async (check: AuthorizationCheckRequest) => {
        const decision = await context.authorize(check),
          p = decision.conditions?.database?.personalSchedules;
        if (
          check.resource.id !== 'oa.personalSchedules' ||
          !p ||
          !['create', 'edit'].includes(check.action)
        )
          return decision;
        return {
          ...decision,
          conditions: {
            ...decision.conditions,
            database: {
              ...decision.conditions!.database,
              personalSchedules: {
                ...p,
                ...(check.action === 'create'
                  ? {
                      create: {
                        scope: { title: 'Allowed title' },
                        fields: [
                          'id',
                          'ownerUserId',
                          'title',
                          'description',
                          'startAt',
                          'endAt',
                          'version',
                        ],
                      },
                    }
                  : {
                      update: {
                        scope: { id: 'another-record' },
                        fields: [
                          'title',
                          'description',
                          'startAt',
                          'endAt',
                          'version',
                        ],
                      },
                    }),
              },
            },
          },
        };
      }) as typeof context.authorize,
    };
  });
  try {
    expect(
      (
        await session.fetch(
          '/personalSchedules',
          write('POST', { ...body, title: 'Forbidden title' }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await session.fetch(
          `/personalSchedules/${row.id}`,
          write('PATCH', {
            ...body,
            title: 'Forbidden update',
            expectedVersion: 1,
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (await (await session.fetch(`/personalSchedules/${row.id}`)).json()).data,
    ).toMatchObject({ title: body.title, version: 1 });
    expect(
      (
        await c.resolve(auditServiceToken).list({
          targetType: 'personalSchedules',
          actorId: owner.userId,
          page: 1,
          pageSize: 10,
        })
      ).total,
    ).toBe(1);
  } finally {
    spy.mockRestore();
  }
  const service = c.resolve(personalScheduleServiceToken),
    failed = vi
      .spyOn(service, 'list')
      .mockRejectedValueOnce(new Error('database unavailable'));
  try {
    expect((await session.fetch('/personalSchedules')).status).toBe(500);
  } finally {
    failed.mockRestore();
  }
});
