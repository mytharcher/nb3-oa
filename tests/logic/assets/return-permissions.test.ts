// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { installAssetReturnPermissions } from '../../../database/main/seeds/202610103112_asset_returns_permissions.js';
import { createEmployeesAppTest } from '../employees/helpers.ts';
const test = createEmployeesAppTest();
test('forward legacy return grant is independent and repetition preserves administrator edits', async ({
  testApp,
}) => {
  const db = testApp.application.container.resolve(databaseManagerToken);
  const sets = db.repository('authorizationPermissionSets');
  const existingAdmin = await sets.findOne({
    filter: { key: 'oa-assets-admin' },
  });
  const before = await sets.findOne({
    filter: { key: 'oa-assets-return-admin' },
  });
  expect(before).toBeDefined();
  const grants =
    typeof before!.grants === 'string'
      ? JSON.parse(before!.grants)
      : before!.grants;
  expect(grants).toEqual([
    {
      resource: { type: 'composite', id: 'oa.assets' },
      actions: [
        {
          action: 'returnHeld',
          policy: { type: 'composite', scopes: { assets: 'allRecords' } },
        },
      ],
    },
  ]);
  await db.transaction((tx) => installAssetReturnPermissions(tx.query));
  expect(
    await sets.findOne({ filter: { key: 'oa-assets-return-admin' } }),
  ).toEqual(before);
  expect(await sets.findOne({ filter: { key: 'oa-assets-admin' } })).toEqual(
    existingAdmin,
  );
  await sets.updateMany({
    filter: { key: 'oa-assets-return-admin' },
    values: { grants: '[]' },
  });
  await db.transaction((tx) => installAssetReturnPermissions(tx.query));
  expect(
    (await sets.findOne({ filter: { key: 'oa-assets-return-admin' } }))!.grants,
  ).toBe('[]');
  expect(
    await db
      .repository('authorizationPermissionSetAssignments')
      .count({ filter: { permissionSetKey: 'oa-assets-return-admin' } }),
  ).toBe(1);
});
