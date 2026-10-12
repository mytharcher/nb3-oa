// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createAssetRequestsAppTest } from './helpers.js';
import { installAssetRequestPermissions } from '../../../database/main/seeds/202610103411_asset_requests_permissions.js';
const test = createAssetRequestsAppTest();
test('forward asset request defaults preserve installed administrator edits and assignments on repetition', async ({
  testApp,
}) => {
  const db = testApp.application.container.resolve(databaseManagerToken),
    sets = db.repository('authorizationPermissionSets');
  const keys = [
    'oa-asset-requests-employee',
    'oa-asset-requests-admin',
    'oa-asset-requests-finance',
    'oa-asset-requests-gm',
  ];
  const before = await sets.findMany({
    filter: (f) => f.or(keys.map((key) => f.string('key').eq(key))),
  });
  expect(before).toHaveLength(4);
  await db.transaction((tx) => installAssetRequestPermissions(tx.query));
  expect(
    await sets.findMany({
      filter: (f) => f.or(keys.map((key) => f.string('key').eq(key))),
    }),
  ).toEqual(before);
  await sets.updateMany({
    filter: { key: 'oa-asset-requests-admin' },
    values: { grants: '[]' },
  });
  await db.transaction((tx) => installAssetRequestPermissions(tx.query));
  expect(
    (await sets.findOne({ filter: { key: 'oa-asset-requests-admin' } }))!
      .grants,
  ).toBe('[]');
  expect(
    await db
      .repository('authorizationPermissionSetAssignments')
      .count({ filter: { permissionSetKey: 'oa-asset-requests-admin' } }),
  ).toBe(1);
});
