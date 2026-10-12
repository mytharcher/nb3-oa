// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import permissionSeed from '../../../database/main/seeds/202610103311_contract_permissions.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
test('contract required permissions repeat without replacing installed assignments or inventing approval administrator duties', async ({
  app,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    authz = c.resolve(authorizationToken);
  const sets = await authz.permissionSets.list(),
    assignments = await authz.permissionSets.listAssignments();
  expect(sets.some((set) => set.key === 'oa-contract-employee')).toBe(true);
  await db.transaction(async (tx) => {
    const context = {
      query: tx.query,
      repository: tx.repository.bind(tx),
      connection: tx,
      container: c,
      config: { get: () => undefined },
    };
    await permissionSeed.run(context);
    await permissionSeed.run(context);
  });
  expect(await authz.permissionSets.list()).toEqual(sets);
  expect(await authz.permissionSets.listAssignments()).toEqual(assignments);
  expect(
    assignments.some(
      (a) =>
        a.subject.type === 'org.dutyRole' && a.subject.id === 'approval.admin',
    ),
  ).toBe(false);
});
