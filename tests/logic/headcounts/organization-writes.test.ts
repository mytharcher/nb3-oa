// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { expect } from 'vitest';
import {
  lockUserForAdministration,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
import { test } from './helpers.js';
import {
  ALL,
  createEmployee,
  createPerson,
  employees,
} from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { OA_TEST_ORIGIN } from '../oa-test-origin.js';
async function fixture(testApp: Parameters<typeof createEmployee>[0]) {
  const c = testApp.application.container;
  const db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    capacity = c.resolve(headcountServiceToken);
  const person = await createEmployee(testApp, 'Roster ' + randomUUID());
  const write = { actorId: person.userId };
  const department = await org.createDepartment(
    { code: randomUUID(), title: 'Roster department' },
    write,
  );
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Roster position' },
    write,
  );
  await employees(testApp).updateEmployee(
    person.employeeId,
    { positionId: position.id },
    ALL,
    person.userId,
  );
  await org.addMember(
    { departmentId: department.id, userId: person.userId, primary: true },
    write,
  );
  const command = () => ({
    actorId: person.userId,
    requestKey: randomUUID(),
    reason: 'Roster test',
  });
  const a = await db.transaction((tx) =>
    capacity.create(
      {
        ...command(),
        departmentId: department.id,
        positionId: position.id,
        year: Number(
          c.resolve(calendarServiceToken).localDate(new Date()).slice(0, 4),
        ),
        limit: 3,
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    capacity.reconcile(
      {
        ...command(),
        accountId: a.id,
        expectedVersion: a.version,
        employeeIds: [person.employeeId],
      },
      tx,
    ),
  );
  return {
    c,
    db,
    org,
    capacity,
    person,
    department,
    position,
    account: a,
    command,
    write,
    archive: employees(testApp),
  };
}

const mutation = (method: string, body?: unknown) => ({
  method,
  headers: { origin: OA_TEST_ORIGIN, 'content-type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

test('independent membership HTTP protects add/update/remove/primary writes and documents failures', async ({
  testApp,
  request,
}) => {
  const f = await fixture(testApp),
    admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const target = await f.org.createDepartment(
    { title: 'Uninitialized destination' },
    f.write,
  );
  const add = `/departments/${target.id}/members`;
  expect(
    (await request(add, mutation('POST', { userId: f.person.userId }))).status,
  ).toBe(401);
  expect(
    (
      await (
        await f.person.session()
      ).fetch(add, mutation('POST', { userId: f.person.userId }))
    ).status,
  ).toBe(403);
  // The HTTP schema never accepts an internal connection, action or business-source bypass.
  expect(
    (
      await admin.fetch(
        add,
        mutation('POST', {
          userId: f.person.userId,
          primary: true,
          action: 'add',
          connection: {},
          businessSource: 'transfer',
        }),
      )
    ).status,
  ).toBe(400);
  // Secondary membership is legal; repeat and promotion of the existing row use the same entry.
  for (let i = 0; i < 2; i++)
    expect(
      (
        await admin.fetch(
          add,
          mutation('POST', { userId: f.person.userId, primary: false }),
        )
      ).status,
    ).toBe(201);
  const before = await f.db.repository('auditLogs').count();
  for (const [path, init] of [
    [add, mutation('POST', { userId: f.person.userId, primary: true })],
    [
      `/departments/${f.department.id}/members`,
      mutation('POST', { userId: f.person.userId, primary: false }),
    ],
    [
      `/departments/${f.department.id}/members/${f.person.userId}`,
      mutation('DELETE'),
    ],
    [`${add}/${f.person.userId}/makePrimary`, mutation('POST')],
  ] as const) {
    expect((await request(path, init)).status).toBe(401);
    expect((await (await f.person.session()).fetch(path, init)).status).toBe(
      403,
    );
    const response = await admin.fetch(path, init);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { reason: 'HEADCOUNT_ROSTER_DRIFT' },
    });
    expect((await f.org.primaryDepartmentOf(f.person.userId))?.id).toBe(
      f.department.id,
    );
  }
  expect(await f.db.repository('auditLogs').count()).toBe(before);
  expect(
    await f.capacity.balance(f.account.id, f.db.connection()),
  ).toMatchObject({ used: 1, available: 2 });
  expect(
    (await admin.fetch(`${add}/${f.person.userId}`, mutation('DELETE'))).status,
  ).toBe(204);
  const document = await f.c.resolve(apiDocsToken).getDocument();
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  for (const operation of [
    document.paths?.['/api/departments/{departmentId}/members']?.post,
    document.paths?.['/api/departments/{departmentId}/members/{userId}']
      ?.delete,
    document.paths?.[
      '/api/departments/{departmentId}/members/{userId}/makePrimary'
    ]?.post,
  ])
    expect(operation?.responses?.['400']).toBeDefined();
});

test('independent add rolls back newly created primary row and reactivation, retaining historical row', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const target = await f.org.createDepartment(
    { title: 'New row target' },
    f.write,
  );
  const input = {
    action: 'add' as const,
    departmentId: target.id,
    userId: f.person.userId,
    primary: true,
  };
  const before = await f.db.repository('auditLogs').count();
  await expect(f.org.manageMember(input, f.write)).rejects.toMatchObject({
    code: 'HEADCOUNT_ROSTER_DRIFT',
  });
  expect(
    await f.db
      .repository('departmentMembers')
      .count({ filter: { departmentId: target.id, userId: f.person.userId } }),
  ).toBe(0);
  await f.org.manageMember({ ...input, primary: false }, f.write);
  await f.org.manageMember({ ...input, action: 'remove' }, f.write);
  const row = await f.db
    .repository('departmentMembers')
    .findOne({ filter: { departmentId: target.id, userId: f.person.userId } });
  await expect(f.org.manageMember(input, f.write)).rejects.toMatchObject({
    code: 'HEADCOUNT_ROSTER_DRIFT',
  });
  expect(
    await f.db
      .repository('departmentMembers')
      .findOne({ filter: { id: row!.id } }),
  ).toMatchObject({ active: false, primary: false });
  expect(await f.db.repository('auditLogs').count()).toBe(before + 2);
});

test('independent membership callback joins caller transaction and releases capacity guard after rollback', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    target = await f.org.createDepartment(
      { title: 'Caller rollback' },
      f.write,
    );
  const input = {
    action: 'add' as const,
    departmentId: target.id,
    userId: f.person.userId,
    primary: false,
  };
  const before = await f.db.repository('auditLogs').count();
  await expect(
    f.db.transaction(async (tx) => {
      await f.org.manageMember(input, { ...f.write, connection: tx });
      throw new Error('Caller failed');
    }),
  ).rejects.toThrow('Caller failed');
  expect(
    await f.db
      .repository('departmentMembers')
      .count({ filter: { departmentId: target.id, userId: f.person.userId } }),
  ).toBe(0);
  expect(await f.db.repository('auditLogs').count()).toBe(before);
  await f.org.manageMember(input, f.write);
  expect(await f.db.repository('auditLogs').count()).toBe(before + 1);
});

test('prior business transaction drift fails closed before an independent no-op write', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    target = await f.org.createDepartment(
      { title: 'Prior business drift' },
      f.write,
    );
  const before = await f.db.repository('auditLogs').count();
  await expect(
    f.db.transaction(async (tx) => {
      await lockUserForAdministration(tx, f.person.userId);
      return f.capacity.within(tx, async (c) => {
        await f.org.addMember(
          { departmentId: target.id, userId: f.person.userId, primary: true },
          { ...f.write, connection: c },
        );
        await f.org.manageMember(
          {
            action: 'makePrimary',
            departmentId: target.id,
            userId: f.person.userId,
          },
          { ...f.write, connection: c },
        );
      });
    }),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_ROSTER_DRIFT' });
  expect((await f.org.primaryDepartmentOf(f.person.userId))?.id).toBe(
    f.department.id,
  );
  expect(await f.db.repository('auditLogs').count()).toBe(before);
});

test('public account-lock disable races with independent membership creation, and disabled removal stays compatible', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    users = f.c.resolve(userAdministrationServiceToken);
  const target = await f.org.createDepartment(
    { title: 'Account lock destination' },
    f.write,
  );
  let locked!: () => void;
  const accountLocked = new Promise<void>((resolve) => {
    locked = resolve;
  });
  let continueDisable!: () => void;
  const permission = new Promise<void>((resolve) => {
    continueDisable = resolve;
  });
  const disabling = f.db.transaction(async (tx) => {
    await lockUserForAdministration(tx, f.person.userId);
    locked();
    await permission;
    await users.withConnection(tx).disable(f.person.userId);
  });
  await accountLocked;
  const adding = f.org.manageMember(
    {
      action: 'add',
      departmentId: target.id,
      userId: f.person.userId,
      primary: false,
    },
    f.write,
  );
  continueDisable();
  await disabling;
  await expect(adding).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  expect(
    await f.db
      .repository('departmentMembers')
      .count({ filter: { departmentId: target.id, userId: f.person.userId } }),
  ).toBe(0);
  expect(
    await f.capacity.balance(f.account.id, f.db.connection()),
  ).toMatchObject({ used: 1 });
  // Existing disabled identities can still lose a secondary historical membership.
  await users.withConnection(f.db.connection()).enable(f.person.userId);
  await f.org.manageMember(
    {
      action: 'add',
      departmentId: target.id,
      userId: f.person.userId,
      primary: false,
    },
    f.write,
  );
  await f.db.transaction(async (tx) => {
    await lockUserForAdministration(tx, f.person.userId);
    await users.withConnection(tx).disable(f.person.userId);
  });
  await f.org.manageMember(
    { action: 'remove', departmentId: target.id, userId: f.person.userId },
    f.write,
  );
  expect(
    await f.db.repository('departmentMembers').findOne({
      filter: { departmentId: target.id, userId: f.person.userId },
    }),
  ).toMatchObject({ active: false, primary: false });
  const unused = await createPerson(testApp, 'No primary capacity');
  await f.org.manageMember(
    { action: 'add', departmentId: target.id, userId: unused.userId },
    f.write,
  );
  await users.withConnection(f.db.connection()).disable(unused.userId);
  await f.org.manageMember(
    { action: 'makePrimary', departmentId: target.id, userId: unused.userId },
    f.write,
  );
  await f.org.manageMember(
    { action: 'remove', departmentId: target.id, userId: unused.userId },
    f.write,
  );
  await expect(
    f.org.manageMember(
      { action: 'remove', departmentId: target.id, userId: randomUUID() },
      f.write,
    ),
  ).rejects.toMatchObject({ code: 'MEMBER_NOT_FOUND' });
});
