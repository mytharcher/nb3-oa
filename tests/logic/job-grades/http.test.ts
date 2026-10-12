import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import type { AuthorizationCheckRequest } from '@nocobase/authorization/core';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { installSalaryGradePermissions } from '../../../database/main/seeds/202610104012_salary_grade_permissions.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  createPlatformAppTest,
  createUser,
  write,
} from '../platform/helpers.js';
import { grantToUser } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { salaryGradeServiceToken } from '../../../server/providers/job-grades/contract.js';
const test = createPlatformAppTest();
test('formal HTTP separates metadata from private bands and resolves publishing users', async ({
  app,
  testApp,
  request,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(salaryGradeServiceToken);
  const publisher = await createUser(testApp, 'Salary publisher'),
    reader = await createUser(testApp, 'Metadata reader'),
    outsider = await createUser(testApp, 'Ordinary employee');
  const grade = await c
    .resolve(organizationServiceToken)
    .createGrade(
      { code: randomUUID(), title: 'HTTP grade', rank: 6 },
      { actorId: publisher.user.id },
    );
  const first = await db.transaction((tx) =>
    service.publish(
      {
        expectedVersion: 0,
        actorId: publisher.user.id,
        reason: 'Private salary explanation',
        bands: [
          { gradeId: grade.id, minimumCents: 12345, maximumCents: 23456 },
        ],
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    service.publish(
      {
        expectedVersion: 1,
        actorId: publisher.user.id,
        reason: 'Private revision explanation',
        bands: [
          { gradeId: grade.id, minimumCents: 34567, maximumCents: 45678 },
        ],
      },
      tx,
    ),
  );
  await grantToUser(
    testApp,
    randomUUID(),
    [
      {
        resource: { type: 'composite', id: 'oa.salaryGrades' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { salaryGradeRevisions: 'allRecords' },
            },
          },
        ],
      },
    ],
    reader.user.id,
  );
  await grantToUser(
    testApp,
    randomUUID(),
    [
      {
        resource: { type: 'composite', id: 'oa.salaryGrades' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { salaryGradeRevisions: 'allRecords' },
            },
          },
          {
            action: 'viewSalary',
            policy: {
              type: 'composite',
              scopes: {
                salaryGradeCurrent: 'allRecords',
                salaryGradeRevisions: 'allRecords',
              },
            },
          },
        ],
      },
    ],
    publisher.user.id,
  );
  for (const path of [
    '/salaryGradeTables',
    '/salaryGradeTables/current',
    `/salaryGradeTables/${first.id}`,
  ]) {
    expect((await request(path)).status).toBe(401);
    expect((await outsider.fetch(path)).status).toBe(403);
  }
  const list = await reader.fetch('/salaryGradeTables?pageSize=1');
  expect(list.status).toBe(200);
  const page = await list.json();
  expect(page.meta).toEqual({
    page: 1,
    pageSize: 1,
    total: 2,
    timeZone: c.resolve(calendarServiceToken).timeZone(),
  });
  expect(page.data).toHaveLength(1);
  const search = await reader.fetch(
    '/salaryGradeTables?search=1&sort=version&direction=asc',
  );
  expect(search.status).toBe(200);
  expect(
    (await search.json()).data.map((row: { id: string }) => row.id),
  ).toEqual([first.id]);
  const unmatched = await reader.fetch(
    '/salaryGradeTables?search=not-a-version',
  );
  expect(unmatched.status).toBe(200);
  expect(await unmatched.json()).toMatchObject({
    data: [],
    meta: { total: 0 },
  });
  expect(Object.keys(page.data[0]).sort()).toEqual(
    ['id', 'version', 'createdBy', 'createdAt'].sort(),
  );
  expect(page.data[0].createdBy).toEqual({
    id: publisher.user.id,
    name: 'Salary publisher',
  });
  expect((await reader.fetch('/salaryGradeTables/current')).status).toBe(403);
  expect((await reader.fetch(`/salaryGradeTables/${first.id}`)).status).toBe(
    403,
  );
  const current = await publisher.fetch('/salaryGradeTables/current');
  expect(current.status).toBe(200);
  expect((await current.json()).data).toMatchObject({
    version: 2,
    revision: { bands: [{ gradeId: grade.id, rank: 6, minimumCents: 34567 }] },
  });
  const history = await publisher.fetch(`/salaryGradeTables/${first.id}`);
  expect(history.status).toBe(200);
  expect((await history.json()).data.bands[0].minimumCents).toBe(12345);
  expect(
    (await publisher.fetch(`/salaryGradeTables/${randomUUID()}`)).status,
  ).toBe(404);
  const swagger = await publisher.fetch('/swagger');
  expect(swagger.status).toBe(200);
  const document = await swagger.json();
  expect(document.paths['/api/salaryGradeTables'].get.operationId).toBe(
    'listSalaryGradeHistory',
  );
});

test('formal HTTP publication rejects readers and forged actors, replays original key and rolls back audit failure', async ({
  app,
  testApp,
  request,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken);
  const publisher = await createUser(testApp, 'HTTP publisher'),
    reader = await createUser(testApp, 'Private reader');
  const grade = await c
    .resolve(organizationServiceToken)
    .createGrade(
      { code: randomUUID(), title: 'Publishing grade', rank: 7 },
      { actorId: publisher.user.id },
    );
  for (const [person, action] of [
    [publisher, 'manage'],
    [reader, 'viewSalary'],
  ] as const)
    await grantToUser(
      testApp,
      randomUUID(),
      [
        {
          resource: { type: 'composite', id: 'oa.salaryGrades' },
          actions: [
            {
              action,
              policy: {
                type: 'composite',
                scopes: {
                  salaryGradeCurrent: 'allRecords',
                  salaryGradeRevisions: 'allRecords',
                },
              },
            },
          ],
        },
      ],
      person.user.id,
    );
  const baseline = await db.transaction((tx) =>
    c.resolve(salaryGradeServiceToken).current(tx),
  );
  const countBefore = await db.repository('salaryGradeRevisions').count();
  const input = {
    requestKey: 'http-publish',
    expectedVersion: baseline.version,
    reason: 'Private salary rationale',
    bands: [{ gradeId: grade.id, minimumCents: 10001, maximumCents: 20002 }],
  };
  expect(
    (await request('/salaryGradeTables', write('POST', input))).status,
  ).toBe(401);
  expect(
    (await reader.fetch('/salaryGradeTables', write('POST', input))).status,
  ).toBe(403);
  expect(
    (
      await publisher.fetch(
        '/salaryGradeTables',
        write('POST', { ...input, actorId: reader.user.id }),
      )
    ).status,
  ).toBe(400);
  const first = await publisher.fetch(
    '/salaryGradeTables',
    write('POST', input),
  );
  expect(first.status).toBe(201);
  const receipt = (await first.json()).data;
  expect(receipt.createdBy).toEqual({
    id: publisher.user.id,
    name: 'HTTP publisher',
  });
  const repeated = await publisher.fetch(
    '/salaryGradeTables',
    write('POST', input),
  );
  expect(repeated.status).toBe(201);
  expect((await repeated.json()).data.id).toBe(receipt.id);
  expect(await db.repository('salaryGradeRevisions').count()).toBe(
    countBefore + 1,
  );
  expect(
    (
      await publisher.fetch(
        '/salaryGradeTables',
        write('POST', { ...input, reason: 'Changed body' }),
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await publisher.fetch(
        '/salaryGradeTables',
        write('POST', { ...input, requestKey: 'new-key-stale-version' }),
      )
    ).status,
  ).toBe(409);
  const spy = vi
    .spyOn(audit, 'record')
    .mockRejectedValueOnce(new Error('Audit write failed'));
  try {
    expect(
      (
        await publisher.fetch(
          '/salaryGradeTables',
          write('POST', {
            ...input,
            requestKey: 'audit-rollback',
            expectedVersion: baseline.version + 1,
          }),
        )
      ).status,
    ).toBe(500);
  } finally {
    spy.mockRestore();
  }
  expect(await db.repository('salaryGradeRevisions').count()).toBe(
    countBefore + 1,
  );
  const current = await db.transaction((tx) =>
    c.resolve(salaryGradeServiceToken).current(tx),
  );
  expect(current.version).toBe(baseline.version + 1);
  expect(current.revision?.id).toBe(receipt.id);
});

test('default HR grant follows current duty membership and seed replay preserves administrator edits', async ({
  app,
  testApp,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    sets = c.resolve(authorizationToken).permissionSets;
  const hr = await createUser(testApp, 'Default HR salary admin');
  expect((await hr.fetch('/salaryGradeTables/current')).status).toBe(403);
  await org.addDutyRoleMember('hr', hr.user.id, { actorId: hr.user.id });
  expect((await hr.fetch('/salaryGradeTables/current')).status).toBe(200);
  const grade = await org.createGrade(
    { code: randomUUID(), title: 'Default HR publication grade', rank: 4 },
    { actorId: hr.user.id },
  );
  const baseline = await db.transaction((tx) =>
    c.resolve(salaryGradeServiceToken).current(tx),
  );
  const publication = {
    requestKey: 'default-hr-publication',
    expectedVersion: baseline.version,
    reason: 'Private HR note',
    bands: [{ gradeId: grade.id, minimumCents: 10001, maximumCents: 10002 }],
  };
  expect(
    (await hr.fetch('/salaryGradeTables', write('POST', publication))).status,
  ).toBe(201);
  const original = (await sets.get('oa-salary-grade-hr'))!;
  const assignments = await sets.listAssignments(original.key);
  try {
    await sets.update(original.key, { ...original, grants: [] });
    await db.transaction((tx) => installSalaryGradePermissions(tx.query));
    await db.transaction((tx) => installSalaryGradePermissions(tx.query));
    expect((await sets.get(original.key))!.grants).toEqual([]);
    expect(await sets.listAssignments(original.key)).toEqual(assignments);
    expect((await hr.fetch('/salaryGradeTables/current')).status).toBe(403);
  } finally {
    await sets.update(original.key, original);
  }
  expect((await hr.fetch('/salaryGradeTables/current')).status).toBe(200);
  await org.removeDutyRoleMember('hr', hr.user.id, { actorId: hr.user.id });
  expect((await hr.fetch('/salaryGradeTables/current')).status).toBe(403);
  expect(
    (await hr.fetch('/salaryGradeTables', write('POST', publication))).status,
  ).toBe(403);
});

test('actual HTTP enforces narrowed authorization decisions before exposing bands or committing publication', async ({
  app,
  testApp,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    authz = c.resolve(authorizationToken);
  const person = await createUser(testApp, 'Narrowed salary publisher');
  const grade = await c
    .resolve(organizationServiceToken)
    .createGrade(
      { code: randomUUID(), title: 'Narrow policy grade', rank: 3 },
      { actorId: person.user.id },
    );
  await grantToUser(
    testApp,
    randomUUID(),
    [
      {
        resource: { type: 'composite', id: 'oa.salaryGrades' },
        actions: ['view', 'viewSalary', 'manage'].map((action) => ({
          action,
          policy: {
            type: 'composite' as const,
            scopes: {
              salaryGradeRevisions: 'allRecords',
              ...(action === 'view'
                ? {}
                : { salaryGradeCurrent: 'allRecords' }),
            },
          },
        })),
      },
    ],
    person.user.id,
  );
  const initial = await db.transaction((tx) =>
    c.resolve(salaryGradeServiceToken).current(tx),
  );
  await db.transaction((tx) =>
    c.resolve(salaryGradeServiceToken).publish(
      {
        expectedVersion: initial.version,
        actorId: person.user.id,
        reason: 'Private baseline',
        bands: [
          { gradeId: grade.id, minimumCents: 10001, maximumCents: 20002 },
        ],
      },
      tx,
    ),
  );
  const baseline = await db.transaction((tx) =>
    c.resolve(salaryGradeServiceToken).current(tx),
  );
  const beforeCount = await db.repository('salaryGradeRevisions').count();
  let mode: 'bands' | 'pointer' | 'history' = 'bands';
  const original = authz.for.bind(authz);
  // Inject a narrowed resolved decision into the real HTTP route. This proves route/RepositoryPolicy enforcement;
  // persisted restriction-rule configuration is a separate acceptance scope.
  const spy = vi.spyOn(authz, 'for').mockImplementation((identity) => {
    const context = original(identity);
    return {
      ...context,
      authorize: (async (check: AuthorizationCheckRequest) => {
        const decision = await context.authorize(check);
        if (
          check.resource.type !== 'composite' ||
          check.resource.id !== 'oa.salaryGrades' ||
          !decision.conditions?.database
        )
          return decision;
        const database = decision.conditions.database;
        if (mode === 'pointer' && database.salaryGradeCurrent)
          return {
            ...decision,
            conditions: {
              ...decision.conditions,
              database: {
                ...database,
                salaryGradeCurrent: {
                  ...database.salaryGradeCurrent,
                  read: false,
                },
              },
            },
          };
        if (!database.salaryGradeRevisions) return decision;
        return {
          ...decision,
          conditions: {
            ...decision.conditions,
            database: {
              ...database,
              salaryGradeRevisions: {
                ...database.salaryGradeRevisions,
                read:
                  mode === 'history'
                    ? {
                        scope: { createdById: 'excluded-publisher' },
                        fields: ['id', 'version', 'createdById', 'createdAt'],
                      }
                    : {
                        scope: true,
                        fields: [
                          'id',
                          'version',
                          'createdById',
                          'createdAt',
                          'reason',
                        ],
                      },
              },
            },
          },
        };
      }) as typeof context.authorize,
    };
  });
  try {
    const input = {
      requestKey: 'hidden-bands-publication',
      expectedVersion: baseline.version,
      reason: 'Private explanation',
      bands: [{ gradeId: grade.id, minimumCents: 10001, maximumCents: 20002 }],
    };
    const denied = await person.fetch(
      '/salaryGradeTables',
      write('POST', input),
    );
    expect(denied.status).toBe(403);
    expect(await db.repository('salaryGradeRevisions').count()).toBe(
      beforeCount,
    );
    expect(
      (
        await db.transaction((tx) =>
          c.resolve(salaryGradeServiceToken).current(tx),
        )
      ).version,
    ).toBe(baseline.version);
    expect((await person.fetch('/salaryGradeTables/current')).status).toBe(403);
    mode = 'pointer';
    expect((await person.fetch('/salaryGradeTables/current')).status).toBe(403);
    expect(
      (await person.fetch('/salaryGradeTables', write('POST', input))).status,
    ).toBe(403);
    mode = 'history';
    const history = await person.fetch('/salaryGradeTables');
    expect(history.status).toBe(200);
    expect(await history.json()).toMatchObject({
      data: [],
      meta: { total: 0 },
    });
  } finally {
    spy.mockRestore();
  }
});
