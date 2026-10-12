// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { installDeparturePageAccess } from '../../../database/main/seeds/202610102913_departure_page_access.js';
import { createEmployeesAppTest } from '../employees/helpers.ts';
const test = createEmployeesAppTest();
test('forward departure page access is page-only and repeated initialization preserves administrator edits', async ({
  testApp,
}) => {
  const db = testApp.application.container.resolve(databaseManagerToken);
  const sets = db.repository('authorizationPermissionSets');
  const before = await sets.findOne({ filter: { key: 'oa-departure-page' } });
  expect(before).toBeDefined();
  const grants =
    typeof before!.grants === 'string'
      ? JSON.parse(before!.grants)
      : before!.grants;
  expect(grants).toEqual([
    {
      resource: { type: 'page', id: 'oa-departure-requests' },
      actions: [{ action: 'access' }],
    },
  ]);
  await db.transaction((tx) => installDeparturePageAccess(tx.query));
  expect(await sets.findOne({ filter: { key: 'oa-departure-page' } })).toEqual(
    before,
  );
  await sets.updateMany({
    filter: { key: 'oa-departure-page' },
    values: { grants: '[]' },
  });
  await db.transaction((tx) => installDeparturePageAccess(tx.query));
  const edited = await sets.findOne({ filter: { key: 'oa-departure-page' } });
  expect(edited!.grants).toBe('[]');
  expect(
    await db
      .repository('authorizationPermissionSetAssignments')
      .count({ filter: { permissionSetKey: 'oa-departure-page' } }),
  ).toBe(1);
});
