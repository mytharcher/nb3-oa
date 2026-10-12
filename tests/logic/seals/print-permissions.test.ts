// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import type { PermissionGrant } from '@nocobase/authorization/core';
import { installSealPrintPermissions } from '../../../database/main/seeds/202610104412_seal_print_permissions.js';
import { test } from './helpers.js';

test('main forward seal print seed upgrades exact defaults transactionally and preserves customized and revoked grants', async ({
  testApp,
}) => {
  const db = testApp.application.container.resolve(databaseManagerToken);
  async function read(key: string): Promise<PermissionGrant[]> {
    const row = await db
      .query()
      .selectFrom('authorizationPermissionSets')
      .select('grants')
      .where('key', '=', key)
      .executeTakeFirstOrThrow();
    return (
      typeof row.grants === 'string' ? JSON.parse(row.grants) : row.grants
    ) as PermissionGrant[];
  }
  async function write(key: string, grants: PermissionGrant[]) {
    await db
      .query()
      .updateTable('authorizationPermissionSets')
      .set({ grants: JSON.stringify(grants) })
      .where('key', '=', key)
      .execute();
  }
  const shippedPrint = await read('oa-document-print');
  const printAction = shippedPrint
    .flatMap((g) => g.actions)
    .find((a) => a.action === 'printSealRegistration')!;
  expect(printAction.policy).toMatchObject({
    scopes: {
      sealLedger: 'allRecords',
      sealReceipts: 'allRecords',
      sealRequests: 'allRecords',
    },
  });
  const shippedOwner = await read('oa-seals-employee');
  expect(
    shippedOwner.find((g) => g.resource.id === 'oa.sealLedger')!.actions[0]!
      .policy,
  ).toMatchObject({
    scopes: {
      sealLedger: 'oa.sealLedgerOwned',
      sealReceipts: 'oa.sealReceiptsOwned',
    },
  });
  const oldPrint = structuredClone(shippedPrint),
    oldOwner = structuredClone(shippedOwner),
    customAdmin = await read('oa-seals-admin'),
    revokedKeeper = await read('oa-seals-keeper');
  oldPrint
    .flatMap((g) => g.actions)
    .find((a) => a.action === 'printSealRegistration')!.policy = {
    type: 'composite',
    scopes: {
      printTemplates: 'allRecords',
      printTemplateRevisions: 'allRecords',
    },
  };
  oldOwner.find((g) => g.resource.id === 'oa.sealLedger')!.actions[0]!.policy =
    { type: 'composite', scopes: { sealLedger: 'oa.sealLedgerOwned' } };
  customAdmin.find(
    (g) => g.resource.id === 'oa.sealLedger',
  )!.actions[0]!.policy = { type: 'composite', scopes: { sealLedger: '' } };
  const revoked = revokedKeeper.filter(
    (g) => g.resource.id !== 'oa.sealLedger',
  );
  await write('oa-document-print', oldPrint);
  await write('oa-seals-employee', oldOwner);
  await write('oa-seals-admin', customAdmin);
  await write('oa-seals-keeper', revoked);
  const assignmentsBefore = await db
    .query()
    .selectFrom('authorizationPermissionSetAssignments')
    .selectAll()
    .execute();
  await expect(
    db.transaction(async (tx) => {
      await installSealPrintPermissions(tx.query);
      throw new Error('Rollback permission upgrade');
    }),
  ).rejects.toThrow('Rollback permission upgrade');
  expect(await read('oa-document-print')).toEqual(oldPrint);
  expect(await read('oa-seals-employee')).toEqual(oldOwner);
  await db.transaction((tx) => installSealPrintPermissions(tx.query));
  expect(await read('oa-document-print')).toEqual(shippedPrint);
  expect(await read('oa-seals-employee')).toEqual(shippedOwner);
  expect(await read('oa-seals-admin')).toEqual(customAdmin);
  expect(await read('oa-seals-keeper')).toEqual(revoked);
  await db.transaction((tx) => installSealPrintPermissions(tx.query));
  expect(await read('oa-document-print')).toEqual(shippedPrint);
  expect(
    await db
      .query()
      .selectFrom('authorizationPermissionSetAssignments')
      .selectAll()
      .execute(),
  ).toEqual(assignmentsBefore);
  // Earlier exact shipped default is supported, but an empty/revoked or customized source action stays unchanged.
  oldPrint
    .flatMap((g) => g.actions)
    .find((a) => a.action === 'printSealRegistration')!.policy = {
    type: 'composite',
    scopes: { printTemplates: 'allRecords' },
  };
  await write('oa-document-print', oldPrint);
  await db.transaction((tx) => installSealPrintPermissions(tx.query));
  expect(await read('oa-document-print')).toEqual(shippedPrint);
  const customized = structuredClone(oldPrint);
  customized
    .flatMap((g) => g.actions)
    .find((a) => a.action === 'printSealRegistration')!.policy = {
    type: 'composite',
    scopes: { printTemplates: '' },
  };
  await write('oa-document-print', customized);
  await db.transaction((tx) => installSealPrintPermissions(tx.query));
  expect(await read('oa-document-print')).toEqual(customized);
  const removed = customized.map((g) => ({
    ...g,
    actions: g.actions.filter((a) => a.action !== 'printSealRegistration'),
  }));
  await write('oa-document-print', removed);
  await db.transaction((tx) => installSealPrintPermissions(tx.query));
  expect(await read('oa-document-print')).toEqual(removed);
});
