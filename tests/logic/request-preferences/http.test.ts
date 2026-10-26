// @vitest-environment node
import { expect, vi } from 'vitest';
vi.setConfig({ testTimeout: 120_000 });
import { createEmployeesAppTest, createPerson } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
const test = createEmployeesAppTest();
// Complete application migrations run in each isolated PostgreSQL fixture.

test('preferences are private, migrate once, and preserve concurrent recent selections', async ({
  testApp,
}) => {
  const a = await createPerson(testApp, 'Catalog A');
  const b = await createPerson(testApp, 'Catalog B');
  const first = await a.session();
  const second = await b.session();
  expect((await testApp.request('/requestPreferences')).status).toBe(401);
  expect(
    (await (await first.fetch('/requestPreferences')).json()).data,
  ).toEqual({ favorites: null, recent: [] });
  const migrated = await first.fetch(
    '/requestPreferences/migrate',
    write('POST', { favorites: ['loan'] }),
  );
  expect(migrated.status).toBe(200);
  expect((await migrated.json()).data.favorites).toEqual(['loan']);
  await first.fetch(
    '/requestPreferences/migrate',
    write('POST', { favorites: ['leave'] }),
  );
  expect(
    (await (await first.fetch('/requestPreferences')).json()).data.favorites,
  ).toEqual(['loan']);
  expect(
    (await (await second.fetch('/requestPreferences')).json()).data.favorites,
  ).toBeNull();
  expect(
    (
      await first.fetch(
        '/requestPreferences',
        write('PUT', { favorites: ['leave'], userId: b.userId }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await first.fetch(
        '/requestPreferences',
        write('PUT', { favorites: ['cancellation'] }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await first.fetch(
        '/requestPreferences',
        write('PUT', { favorites: ['leave', 'leave'] }),
      )
    ).status,
  ).toBe(400);
  const functional = ['recruitment', 'expensePlan', 'budget'];
  const saved = await first.fetch(
    '/requestPreferences',
    write('PUT', { favorites: functional }),
  );
  expect(saved.status).toBe(200);
  expect((await saved.json()).data.favorites).toEqual(functional);
  const results = await Promise.all(
    ['leave', 'loan', 'travel'].map((key) =>
      first.fetch('/requestPreferences/recent', write('POST', { key })),
    ),
  );
  expect(results.map((response) => response.status)).toEqual([200, 200, 200]);
  const recent = (await (await first.fetch('/requestPreferences')).json()).data
    .recent;
  expect(new Set(recent)).toEqual(new Set(['leave', 'loan', 'travel']));
  await first.fetch('/requestPreferences', write('PUT', { favorites: [] }));
  const freshSession = await a.session();
  expect(
    (await (await freshSession.fetch('/requestPreferences')).json()).data,
  ).toEqual({ favorites: [], recent });
});

test('workspace roles follow effective responsibilities and real management, without exposing the team roster', async ({
  testApp,
}) => {
  const { organizationServiceToken } =
    await import('../../../server/providers/org/index.js');
  const org = testApp.application.container.resolve(organizationServiceToken);
  const person = await createPerson(testApp, 'Workspace owner');
  const teammate = await createPerson(testApp, 'Workspace teammate');
  const session = await person.session();
  const context = { actorId: person.userId };
  expect((await testApp.request('/workbench/roleContext')).status).toBe(401);
  const initial = await session.fetch('/workbench/roleContext');
  expect(initial.status).toBe(200);
  expect((await initial.json()).data).toEqual({
    manager: false,
    hr: false,
    finance: false,
    administration: false,
    procurement: false,
    teamUserIds: [],
  });
  await org.addDutyRoleMember('hr', person.userId, context);
  await org.addDutyRoleMember('finance', person.userId, context);
  const department = await org.createDepartment(
    { title: 'Workspace department', managerId: person.userId },
    context,
  );
  await org.addMember(
    { departmentId: department.id, userId: teammate.userId, primary: true },
    context,
  );
  const effective = (
    await (await session.fetch('/workbench/roleContext')).json()
  ).data;
  expect(effective).toMatchObject({
    manager: true,
    hr: true,
    finance: true,
    teamUserIds: [],
  });
  await org.removeDutyRoleMember('finance', person.userId, context);
  await org.setDutyRoleActive('hr', false, context);
  const revoked = (await (await session.fetch('/workbench/roleContext')).json())
    .data;
  expect(revoked).toMatchObject({ hr: false, finance: false });
});
