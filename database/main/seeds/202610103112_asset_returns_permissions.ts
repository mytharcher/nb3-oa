import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
/** Forward action grant; never overwrites an installation's existing asset administration grants. */
export async function installAssetReturnPermissions(
  query: QueryAdapter,
): Promise<void> {
  const key = 'oa-assets-return-admin';
  if (
    await query
      .selectFrom('authorizationPermissionSets')
      .select('id')
      .where('key', '=', key)
      .executeTakeFirst()
  )
    return;
  const set = definePermissionSet(key)
    .title({ key: 'assets.authz.returnHeld', ns: 'nb3-oa' })
    .grant({
      resource: { type: 'composite', id: 'oa.assets' },
      actions: [
        {
          action: 'returnHeld',
          policy: { type: 'composite', scopes: { assets: 'allRecords' } },
        },
      ],
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
      id: `org.dutyRole:admin:${key}`,
      permissionSetKey: key,
      subjectType: 'org.dutyRole',
      subjectId: 'admin',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}
export default defineSeed({
  name: '202610103112_asset_returns_permissions',
  run: ({ query }) => installAssetReturnPermissions(query),
});
