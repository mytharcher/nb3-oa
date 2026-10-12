import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';

/** A forward page-only grant: existing business sets and administrator edits stay intact. */
export async function installContractPageAccess(query: QueryAdapter) {
  const key = 'oa-contract-pages';
  if (
    await query
      .selectFrom('authorizationPermissionSets')
      .select('id')
      .where('key', '=', key)
      .executeTakeFirst()
  )
    return;
  const set = definePermissionSet(key)
    .title({ key: 'contracts.title', ns: 'nb3-oa' })
    .grant({
      resource: { type: 'page', id: 'oa-contract-requests' },
      actions: [{ action: 'access' }],
    })
    .grant({
      resource: { type: 'page', id: 'oa-contract-ledger' },
      actions: [{ action: 'access' }],
    })
    .build();
  const now = new Date();
  await query
    .insertInto('authorizationPermissionSets')
    .values({
      id: key,
      key,
      title: encodeAuthorizationTitle(set.title ?? key),
      grants: JSON.stringify(set.grants),
      createdAt: now,
      updatedAt: now,
    })
    .execute();
  await query
    .insertInto('authorizationPermissionSetAssignments')
    .values({
      id: `authenticated:*:${key}`,
      permissionSetKey: key,
      subjectType: 'authenticated',
      subjectId: '*',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}
export default defineSeed({
  name: '202610103313_contract_page_access',
  run: ({ query }) => installContractPageAccess(query),
});
