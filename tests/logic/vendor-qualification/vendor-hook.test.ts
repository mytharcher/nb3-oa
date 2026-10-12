// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { vendorServiceToken } from '../../../server/providers/vendors/contract.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
test('qualification hooks use the same vendor and roll back status with audit; source never includes banking', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken);
  const vendors = app.container.resolve(vendorServiceToken);
  const audit = app.container.resolve(auditServiceToken);
  const vendor = await db.transaction((tx) =>
    vendors.create(
      {
        code: `V-${randomUUID()}`,
        name: 'Applicant vendor',
        category: 'services',
        contactName: 'Contact',
        contactPhone: '',
        contactEmail: '',
        bankName: 'Private bank',
        bankAccount: '00012345',
        bankAccountName: 'Private owner',
        actorId: 'root',
        reason: 'Create',
      },
      tx,
    ),
  );
  const source = await db.transaction((tx) =>
    vendors.qualificationSource(vendor.id, tx),
  );
  expect(source).toMatchObject({ id: vendor.id, version: 1, status: 'manual' });
  expect(source).not.toHaveProperty('bankAccount');
  const input = {
    vendorId: vendor.id,
    expectedVersion: 1,
    qualificationId: randomUUID(),
    actorId: 'root',
    reason: 'Committee passed',
    outcome: 'qualified' as const,
    qualificationExpiry: '2027-10-10',
  };
  const spy = vi
    .spyOn(audit, 'record')
    .mockRejectedValueOnce(new Error('audit rollback'));
  await expect(
    db.transaction((tx) => vendors.applyQualification(input, tx)),
  ).rejects.toThrow('audit rollback');
  spy.mockRestore();
  expect(await vendors.get(vendor.id)).toMatchObject({
    status: 'manual',
    version: 1,
  });
  await db.transaction((tx) => vendors.applyQualification(input, tx));
  expect(await vendors.get(vendor.id)).toMatchObject({
    status: 'qualified',
    qualificationId: input.qualificationId,
    qualificationExpiry: '2027-10-10',
    version: 2,
    bankAccount: '00012345',
  });
  await expect(
    db.transaction((tx) =>
      vendors.applyQualification(
        { ...input, qualificationId: randomUUID() },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'VENDOR_VERSION_CONFLICT' });
  await db.transaction((tx) =>
    vendors.applyQualification(
      {
        ...input,
        expectedVersion: 2,
        outcome: 'removed',
        qualificationExpiry: null,
      },
      tx,
    ),
  );
  expect(await vendors.get(vendor.id)).toMatchObject({
    status: 'disabled',
    active: false,
    version: 3,
    qualificationExpiry: '2027-10-10',
  });
});
