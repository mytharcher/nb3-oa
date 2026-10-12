// @vitest-environment node
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createPlatformAppTest } from '../platform/helpers.js';
import { installContractPageAccess } from '../../../database/main/seeds/202610103313_contract_page_access.js';
const test = createPlatformAppTest();
test('page-only seed repeats without restoring administrator edits or rewriting assignments', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const db = c.resolve(databaseManagerToken);
  const sets = c.resolve(authorizationToken).permissionSets;
  const key = 'oa-contract-pages';
  const initial = (await sets.get(key))!;
  expect(initial.grants).toEqual([
    {
      resource: { type: 'page', id: 'oa-contract-requests' },
      actions: [{ action: 'access' }],
    },
    {
      resource: { type: 'page', id: 'oa-contract-ledger' },
      actions: [{ action: 'access' }],
    },
  ]);
  const assignments = await sets.listAssignments(key);
  expect(assignments).toHaveLength(1);
  await db.transaction((tx) => installContractPageAccess(tx.query));
  expect(await sets.get(key)).toEqual(initial);
  try {
    await sets.update(key, { ...initial, grants: [] });
    await db.transaction((tx) => installContractPageAccess(tx.query));
    await db.transaction((tx) => installContractPageAccess(tx.query));
    expect((await sets.get(key))!.grants).toEqual([]);
    expect(await sets.listAssignments(key)).toEqual(assignments);
  } finally {
    await sets.update(key, initial);
  }
});
