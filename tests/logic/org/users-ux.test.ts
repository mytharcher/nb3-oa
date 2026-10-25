// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { startOrgTestApp, type OrgTestApp, json, send } from './helpers.js';
let test: OrgTestApp;
beforeAll(async () => {
  test = await startOrgTestApp();
}, 120000);
afterAll(async () => {
  await test?.close();
});
it('aggregates configured roles and primary ancestry, pages users, and preserves frozen configurations', async () => {
  const session = await test.admin();
  const users = test.testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const user = await users.create({
    name: 'Directory fixture',
    email: 'directory@example.test',
    password: 'fixture-password-123',
  });
  const org = test.organization,
    context = { actorId: session.user.id };
  const root = await org.createDepartment({ title: 'Root' }, context);
  const leaf = await org.createDepartment(
    { title: 'Leaf', parentId: root.id },
    context,
  );
  await org.manageMember(
    { action: 'add', departmentId: leaf.id, userId: user.id, primary: true },
    context,
  );
  await org.addDutyRoleMember('hr', user.id, context);
  const roles = await session.fetch(`/org/users/${user.id}/duty-roles`);
  expect(roles.status).toBe(200);
  expect(
    (await roles.json()).data.roles.find(
      (role: { code: string }) => role.code === 'hr',
    ).assigned,
  ).toBe(true);
  const organization = await session.fetch(
    `/org/users/${user.id}/organization`,
  );
  expect(
    (await organization.json()).data.primaryDepartment.path.map(
      (entry: { title: string }) => entry.title,
    ),
  ).toEqual(['Root', 'Leaf']);
  const page = await session.fetch('/org/users?role=hr&pageSize=20');
  const body = await page.json();
  expect(page.status).toBe(200);
  expect(
    body.data.items.some((item: { id: string }) => item.id === user.id),
  ).toBe(true);
  expect(body.data.items[0]).not.toHaveProperty('roleScopes');
  await org.setDutyRoleActive('hr', false, context);
  const inactive = await session.fetch(
    '/dutyRoles/hr/members',
    json({ userId: user.id }),
  );
  expect(inactive.status).toBe(400);
  expect(JSON.stringify(await inactive.json())).toContain('DUTY_ROLE_INACTIVE');
  await users.disable(user.id);
  const frozen = await session.fetch(
    '/dutyRoles/hr/members',
    json({ userId: user.id }),
  );
  expect(frozen.status).toBe(400);
  expect(JSON.stringify(await frozen.json())).toContain('USER_NOT_FOUND');
  expect((await session.fetch(`/org/users/${user.id}/duty-roles`)).status).toBe(
    200,
  );
  expect(
    (await session.fetch(`/dutyRoles/hr/members/${user.id}`, send('DELETE')))
      .status,
  ).toBe(204);
  await org.setDutyRoleActive('hr', true, context);
  const nobody = await test.createUser('NoDirectoryGrants');
  for (const path of [
    '/org/users?role=hr',
    `/org/users/${user.id}/organization`,
    `/org/users/${user.id}/duty-roles`,
  ])
    expect((await nobody.fetch(path)).status).toBe(403);
  for (const invalid of ['', ' ', null, 12, 'x'.repeat(65)])
    await expect(
      org.addDutyRoleMember('hr', invalid as string, context),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
}, 120000);
it('rejects role filtering above 500 before invoking the user directory', async () => {
  const tx = test.testApp.database.connection();
  for (let i = 0; i < 501; i++)
    await tx.repository('dutyRoleMembers').createOne({
      values: {
        id: `filter-${i}`,
        dutyRoleCode: 'cashier',
        userId: `filter-user-${String(i).padStart(4, '0')}`,
        active: true,
      },
    });
  await expect(
    test.organization.dutyRoleMemberIdsForFilter('cashier'),
  ).rejects.toMatchObject({ code: 'ROLE_FILTER_TOO_LARGE' });
  const session = await test.admin();
  expect((await session.fetch('/org/users?role=cashier')).status).toBe(400);
}, 120000);
it.each(['freeze-first', 'add-first', 'role-first', 'member-first'])(
  'serializes membership writes with account/role changes: %s',
  async (order) => {
    const users = test.testApp.application.container.resolve(
      userAdministrationServiceToken,
    );
    const account = await users.create({
      name: order,
      email: `${order}@concurrency.test`,
      password: 'fixture-password-123',
    });
    const org = test.organization,
      db = test.testApp.database.connection();
    const context = { actorId: null };
    const isRole = order === 'role-first' || order === 'member-first';
    const addFirst = order === 'add-first' || order === 'member-first';
    const code = isRole ? 'finance' : 'hr';
    await org.setDutyRoleActive(code, true, context);
    let release!: () => void, acquired!: () => void, started!: () => void;
    const held = new Promise<void>((resolve) => {
      acquired = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const entered = new Promise<void>((resolve) => {
      started = resolve;
    });
    const change = async (connection: typeof db) =>
      isRole
        ? org.setDutyRoleActive(code, false, { ...context, connection })
        : users.withConnection(connection).disable(account.id);
    const add = async (connection: typeof db) =>
      org.addDutyRoleMember(code, account.id, { ...context, connection });
    const first = db.transaction(async (tx) => {
      await (addFirst ? add(tx) : change(tx));
      acquired();
      await gate;
    });
    await held;
    let settled = false;
    const second = db
      .transaction(async (tx) => {
        started();
        return addFirst ? change(tx) : add(tx);
      })
      .then(
        () => {
          settled = true;
          return undefined;
        },
        (error: unknown) => {
          settled = true;
          return error;
        },
      );
    await entered;
    expect(settled).toBe(false);
    release();
    await first;
    const failure = await second;
    if (addFirst) {
      expect(failure).toBeUndefined();
      expect(await org.dutyRoleMembershipsOf(account.id)).toContain(code);
    } else {
      expect(failure).toMatchObject({
        code: isRole ? 'DUTY_ROLE_INACTIVE' : 'USER_NOT_FOUND',
      });
      expect(await org.dutyRoleMembershipsOf(account.id)).not.toContain(code);
    }
    await org.setDutyRoleActive(code, true, context);
  },
  120000,
);
it('allows organization reads and personal exceptions without inspect, while enforcing each read prerequisite', async () => {
  const actor = await test.createUser('ReadOnlyUserDetails');
  const userId = actor.user.id;
  await test.grantSettings(userId, 'oa.org.dutyRoles', ['read']);
  await test.grantSettings(userId, 'oa.org.departments', ['read']);
  await test.authz.permissionSets.create({
    key: 'user-details-reader',
    grants: [
      {
        resource: { type: 'settings', id: 'authorization.permission-sets' },
        actions: [{ action: 'read' }],
      },
    ],
  });
  await test.authz.permissionSets.assign({
    permissionSet: 'user-details-reader',
    subject: { type: 'user', id: userId },
  });
  for (const path of [
    `/org/users/${userId}/organization`,
    `/org/users/${userId}/duty-roles`,
    `/access/subjects/user/${userId}`,
  ])
    expect((await actor.fetch(path)).status).toBe(200);
  expect(
    (await actor.fetch('/dutyRoles/hr/members', json({ userId }))).status,
  ).toBe(403);
  const baseline = (await test.authz.permissionSets.list()).filter((set) =>
    set.grants.some((grant) => grant.resource.type === 'user'),
  );
  try {
    for (const set of baseline)
      await test.authz.permissionSets.update(set.key, {
        ...set,
        grants: set.grants.filter((grant) => grant.resource.type !== 'user'),
      });
    for (const path of [
      `/org/users/${userId}/organization`,
      `/org/users/${userId}/duty-roles`,
      `/access/subjects/user/${userId}`,
    ])
      expect((await actor.fetch(path)).status).toBe(403);
  } finally {
    for (const set of baseline)
      await test.authz.permissionSets.update(set.key, set);
  }
}, 120000);
