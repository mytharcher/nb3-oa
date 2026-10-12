// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { installVendorQualificationPageAccess } from '../../../database/main/seeds/202610103013_vendor_qualification_page_access.js';
import { createEmployeesAppTest } from '../employees/helpers.ts';
const test = createEmployeesAppTest();
test('forward vendor qualification page access is page-only and repeated initialization preserves administrator edits', async ({
  testApp,
}) => {
  const db = testApp.application.container.resolve(databaseManagerToken);
  const sets = db.repository('authorizationPermissionSets');
  const before = await sets.findOne({
    filter: { key: 'oa-vendor-qualification-page' },
  });
  expect(before).toBeDefined();
  const grants =
    typeof before!.grants === 'string'
      ? JSON.parse(before!.grants)
      : before!.grants;
  expect(grants).toEqual([
    {
      resource: { type: 'page', id: 'oa-vendor-qualifications' },
      actions: [{ action: 'access' }],
    },
  ]);
  await db.transaction((tx) => installVendorQualificationPageAccess(tx.query));
  expect(
    await sets.findOne({ filter: { key: 'oa-vendor-qualification-page' } }),
  ).toEqual(before);
  await sets.updateMany({
    filter: { key: 'oa-vendor-qualification-page' },
    values: { grants: '[]' },
  });
  await db.transaction((tx) => installVendorQualificationPageAccess(tx.query));
  const edited = await sets.findOne({
    filter: { key: 'oa-vendor-qualification-page' },
  });
  expect(edited!.grants).toBe('[]');
  expect(
    await db
      .repository('authorizationPermissionSetAssignments')
      .count({ filter: { permissionSetKey: 'oa-vendor-qualification-page' } }),
  ).toBe(1);
});
