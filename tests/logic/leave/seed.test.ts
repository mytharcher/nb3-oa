// @vitest-environment node
import { beforeAll, afterAll, it, expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import type { PermissionGrant } from '@nocobase/authorization/core';
import { upgradeLeavePermissionSets } from '../../../database/main/seeds/202610100712_leave_read_scope_upgrade.ts';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
let app: OrgTestApp;
beforeAll(async () => {
  app = await startOrgTestApp();
}, 120000);
afterAll(async () => app?.close());
it('fresh default grants read scope; existing original defaults upgrade idempotently while preserving extra administrator grants', async () => {
  const db = app.testApp.application.container.resolve(databaseManagerToken);
  const read = async () => {
    const row = await db
      .query()
      .selectFrom('authorizationPermissionSets')
      .select('grants')
      .where('key', '=', 'oa-leave-employee')
      .executeTakeFirstOrThrow();
    return JSON.parse(String(row.grants)) as PermissionGrant[];
  };
  const fresh = await read();
  const getView = (grants: PermissionGrant[]) =>
    grants
      .find(
        (g) => g.resource.type === 'composite' && g.resource.id === 'oa.leave',
      )!
      .actions.find((a) => a.action === 'view');
  expect(getView(fresh)?.policy).toMatchObject({
    scopes: { leaveRequests: 'oa.leaveReadable' },
  });
  const extra: PermissionGrant = {
    resource: { type: 'page', id: 'custom-page' },
    actions: [{ action: 'access' }],
  };
  const original = fresh.map((grant) =>
    grant.resource.type === 'composite'
      ? { ...grant, actions: grant.actions.filter((a) => a.action !== 'view') }
      : grant,
  );
  await db
    .query()
    .updateTable('authorizationPermissionSets')
    .set({ grants: JSON.stringify([...original, extra]) })
    .where('key', '=', 'oa-leave-employee')
    .execute();
  await db.transaction((connection) =>
    upgradeLeavePermissionSets(connection.query),
  );
  const upgraded = await read();
  expect(getView(upgraded)?.policy).toMatchObject({
    scopes: { leaveRequests: 'oa.leaveReadable' },
  });
  expect(upgraded).toContainEqual(extra);
  await db.transaction((connection) =>
    upgradeLeavePermissionSets(connection.query),
  );
  expect(await read()).toEqual(upgraded);
  const selected = upgraded.map((grant) =>
    grant.resource.type === 'composite'
      ? {
          ...grant,
          actions: grant.actions.map((a) =>
            a.action === 'view'
              ? {
                  ...a,
                  policy: {
                    type: 'composite' as const,
                    scopes: { leaveRequests: 'allRecords' },
                  },
                }
              : a,
          ),
        }
      : grant,
  );
  await db
    .query()
    .updateTable('authorizationPermissionSets')
    .set({ grants: JSON.stringify(selected) })
    .where('key', '=', 'oa-leave-employee')
    .execute();
  await db.transaction((connection) =>
    upgradeLeavePermissionSets(connection.query),
  );
  expect(await read()).toEqual(selected);
});
