import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export async function installAssetPermissions(
  query: QueryAdapter,
): Promise<void> {
  const definitions = [
    ['oa-assets-employee', 'authenticated', '*', ['viewHeld']],
    ['oa-assets-finance', 'org.dutyRole', 'finance', ['view']],
    ['oa-assets-admin', 'org.dutyRole', 'admin', ['view', 'manage']],
  ] as const;
  for (const [key, subjectType, subjectId, actions] of definitions) {
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      continue;
    const grant: PermissionGrant = {
      resource: { type: 'composite', id: 'oa.assets' },
      actions: actions.map((action) => ({
        action,
        policy: {
          type: 'composite',
          scopes: {
            assets: action === 'viewHeld' ? 'oa.assets.heldByMe' : 'allRecords',
          },
        },
      })),
    };
    const set = definePermissionSet(key)
      .title({ key: 'assets.authz.resource', ns: 'nb3-oa' })
      .grant(grant)
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
        id: `${subjectType}:${subjectId}:${key}`,
        permissionSetKey: key,
        subjectType,
        subjectId,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }
}

export default defineSeed({
  name: '202610103111_assets_permissions',
  run: ({ query }) => installAssetPermissions(query),
});
