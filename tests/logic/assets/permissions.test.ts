// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  createEmployeesAppTest,
  createEmployee,
} from '../employees/helpers.ts';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { installAssetPermissions } from '../../../database/main/seeds/202610103111_assets_permissions.js';
import { write } from '../platform/helpers.ts';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
const test = createEmployeesAppTest();
test('default asset roles are effective and permission initialization preserves administrator changes on repetition', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const employee = await createEmployee(testApp, 'Asset default employee'),
    finance = await createEmployee(testApp, 'Asset default finance'),
    admin = await createEmployee(testApp, 'Asset default administration');
  await org.addDutyRoleMember('finance', finance.userId, {
    actorId: admin.userId,
  });
  await org.addDutyRoleMember('admin', admin.userId, { actorId: admin.userId });
  const read = () =>
    db.repository('authorizationPermissionSets').findMany({
      filter: (f) =>
        f.or(
          ['oa-assets-employee', 'oa-assets-finance', 'oa-assets-admin'].map(
            (key) => f.string('key').eq(key),
          ),
        ),
    });
  const before = await read();
  expect(before).toHaveLength(3);
  await db.transaction((tx) => installAssetPermissions(tx.query));
  expect(await read()).toEqual(before);
  expect(
    await db
      .repository('authorizationPermissionSetAssignments')
      .count({ filter: { permissionSetKey: 'oa-assets-admin' } }),
  ).toBe(1);
  const input = {
    code: 'DEFAULT-ASSET',
    name: 'Default permission asset',
    category: (
      await c.resolve(dictionaryServiceToken).list('assetCategory')
    )[0]!.code,
    serialNumber: null,
    originalValueCents: 54321,
    reason: 'Initial receipt',
  };
  const adminSession = await admin.session(),
    financeSession = await finance.session(),
    employeeSession = await employee.session();
  const creation = await adminSession.fetch('/assets', write('POST', input));
  expect(creation.status).toBe(201);
  const asset = (await creation.json()).data;
  await db.repository('assets').updateMany({
    filter: { id: asset.id },
    values: { status: 'assigned', holderEmployeeId: employee.employeeId },
  });
  expect(
    (await (await employeeSession.fetch(`/assets/${asset.id}`)).json()).data,
  ).not.toHaveProperty('originalValueCents');
  expect(
    (await (await financeSession.fetch(`/assets/${asset.id}`)).json()).data
      .originalValueCents,
  ).toBe(54321);
  expect(
    (
      await financeSession.fetch(
        `/assets/${asset.id}`,
        write('PATCH', {
          name: 'No finance write',
          version: 1,
          reason: 'Denied',
        }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await employeeSession.fetch(
        '/assets',
        write('POST', { ...input, code: 'DENIED' }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await adminSession.fetch(
        `/assets/${asset.id}`,
        write('PATCH', {
          name: 'Admin correction',
          version: 1,
          reason: 'Label',
        }),
      )
    ).status,
  ).toBe(200);
  await db.repository('authorizationPermissionSets').updateMany({
    filter: { key: 'oa-assets-finance' },
    values: { grants: '[]', title: 'Administrator customized' },
  });
  const customized = await db
    .repository('authorizationPermissionSets')
    .findOne({ filter: { key: 'oa-assets-finance' } });
  await db.transaction((tx) => installAssetPermissions(tx.query));
  expect(
    await db
      .repository('authorizationPermissionSets')
      .findOne({ filter: { key: 'oa-assets-finance' } }),
  ).toEqual(customized);
  expect(
    await db
      .repository('authorizationPermissionSetAssignments')
      .count({ filter: { permissionSetKey: 'oa-assets-finance' } }),
  ).toBe(1);
});
