// Candidate default seal permissions; preserves installed administrator customization.
import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export async function installSealPermissions(
  query: QueryAdapter,
): Promise<void> {
  for (const subject of ['employee', 'admin', 'keeper'] as const) {
    const key = `oa-seals-${subject}`;
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      continue;
    const scoped = (
      resource: string,
      collection: string,
      actions: string[],
      scope: string,
    ): PermissionGrant => ({
      resource: { type: 'composite', id: resource },
      actions: actions.map((action) => ({
        action,
        policy: { type: 'composite', scopes: { [collection]: scope } },
      })),
    });
    const grants: PermissionGrant[] =
      subject === 'employee'
        ? [
            scoped(
              'oa.sealRequests',
              'sealRequests',
              ['view', 'operate'],
              'oa.sealRequestsReadable',
            ),
            scoped(
              'oa.sealRequests',
              'sealRequests',
              ['create', 'edit'],
              'oa.sealRequestsOwned',
            ),
            scoped('oa.seals', 'seals', ['view'], 'allRecords'),
            scoped(
              'oa.sealLedger',
              'sealLedger',
              ['view'],
              'oa.sealLedgerOwned',
            ),
          ]
        : subject === 'admin'
          ? [
              scoped(
                'oa.sealRequests',
                'sealRequests',
                ['view', 'operate', 'actualReturn'],
                'allRecords',
              ),
              scoped('oa.seals', 'seals', ['view', 'manage'], 'allRecords'),
              scoped('oa.sealLedger', 'sealLedger', ['view'], 'allRecords'),
            ]
          : [
              scoped(
                'oa.sealRequests',
                'sealRequests',
                ['view', 'operate'],
                'oa.sealRequestsReadable',
              ),
              scoped('oa.seals', 'seals', ['view'], 'allRecords'),
              scoped('oa.sealLedger', 'sealLedger', ['view'], 'allRecords'),
            ];
    const set = definePermissionSet(key)
        .title({ key: 'seals.authz.requests', ns: 'nb3-oa' })
        .grant(...grants)
        .build(),
      now = new Date();
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
    const subjectType =
        subject === 'employee' ? 'authenticated' : 'org.dutyRole',
      subjectId =
        subject === 'employee'
          ? '*'
          : subject === 'admin'
            ? 'admin'
            : 'sealKeeper';
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
  name: '202610104411_seal_permissions',
  run: ({ query }) => installSealPermissions(query),
});
