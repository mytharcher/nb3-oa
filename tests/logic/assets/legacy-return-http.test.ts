// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  createEmployeesAppTest,
  createEmployee,
} from '../employees/helpers.ts';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { assetServiceToken } from '../../../server/providers/assets/contract.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { write } from '../platform/helpers.ts';
const test = createEmployeesAppTest();
test('default asset administrator confirms legacy physical return over HTTP while employee and finance cannot', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const employee = await createEmployee(testApp, 'Legacy holder'),
    admin = await createEmployee(testApp, 'Return administrator'),
    finance = await createEmployee(testApp, 'Return finance');
  await org.addDutyRoleMember('admin', admin.userId, { actorId: admin.userId });
  await org.addDutyRoleMember('finance', finance.userId, {
    actorId: admin.userId,
  });
  const employeeSession = await employee.session(),
    adminSession = await admin.session(),
    financeSession = await finance.session();
  const creation = await adminSession.fetch(
    '/assets',
    write('POST', {
      code: 'LEGACY-HTTP',
      name: 'Physical laptop',
      category: (
        await c.resolve(dictionaryServiceToken).list('assetCategory')
      )[0]!.code,
      serialNumber: 'REAL-SERIAL',
      originalValueCents: 12000,
      reason: 'Received',
    }),
  );
  expect(creation.status).toBe(201);
  const asset = (await creation.json()).data;
  await db
    .repository('assets')
    .updateMany({
      filter: { id: asset.id },
      values: {
        status: 'borrowed',
        holderEmployeeId: employee.employeeId,
        borrowDueDate: '2026-10-01',
      },
    });
  const body = {
    assetId: asset.id,
    holderEmployeeId: employee.employeeId,
    serialNumber: 'REAL-SERIAL',
    version: asset.version,
    reason: 'Physically received and checked',
    requestKey: 'real-receipt',
  };
  for (const session of [employeeSession, financeSession])
    expect(
      (await session.fetch('/assets/returnHeld', write('POST', body))).status,
    ).toBe(403);
  expect(
    (
      await adminSession.fetch(
        '/assets/returnHeld',
        write('POST', { ...body, serialNumber: 'WRONG' }),
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await adminSession.fetch(
        '/assets/returnHeld',
        write('POST', { ...body, status: 'available' }),
      )
    ).status,
  ).toBe(400);
  const result = await adminSession.fetch(
    '/assets/returnHeld',
    write('POST', body),
  );
  expect(result.status).toBe(200);
  const receipt = await result.json();
  expect(receipt.data.receiptId).toBeTypeOf('string');
  expect(
    await (
      await adminSession.fetch('/assets/returnHeld', write('POST', body))
    ).json(),
  ).toEqual(receipt);
  await expect(
    db.transaction((tx) =>
      c.resolve(assetServiceToken).assertAllReturned(employee.employeeId, tx),
    ),
  ).resolves.toBeUndefined();
  await org.removeDutyRoleMember('admin', admin.userId, {
    actorId: admin.userId,
  });
  expect(
    (await adminSession.fetch('/assets/returnHeld', write('POST', body)))
      .status,
  ).toBe(403);
});
