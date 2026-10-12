import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
/** Forward defaults; preserve all existing installation edits and assignments. */
export async function installAssetRequestPermissions(
  query: QueryAdapter,
): Promise<void> {
  const definitions = [
    [
      'oa-asset-requests-employee',
      'authenticated',
      '*',
      ['create', 'edit', 'view', 'operate'],
    ],
    [
      'oa-asset-requests-admin',
      'org.dutyRole',
      'admin',
      ['view', 'operate', 'returnIssued', 'viewValue'],
    ],
    [
      'oa-asset-requests-finance',
      'org.dutyRole',
      'finance',
      ['view', 'operate', 'viewValue'],
    ],
    [
      'oa-asset-requests-gm',
      'org.dutyRole',
      'gm',
      ['view', 'operate', 'viewValue'],
    ],
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
      resource: { type: 'composite', id: 'oa.assetRequests' },
      actions: actions.map((action) => ({
        action,
        policy: {
          type: 'composite',
          scopes: {
            assetRequests:
              action === 'create' || action === 'edit'
                ? 'oa.assetRequestsOwned'
                : action === 'returnIssued'
                  ? 'allRecords'
                  : 'oa.assetRequestsReadable',
          },
        },
      })),
    };
    const set = definePermissionSet(key)
      .title({ key: 'assetRequests.authz.resource', ns: 'nb3-oa' })
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
  name: '202610103411_asset_requests_permissions',
  run: ({ query }) => installAssetRequestPermissions(query),
});
