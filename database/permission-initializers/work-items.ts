import type { QueryAdapter } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export async function installWorkItemPermissions(
  query: QueryAdapter,
): Promise<void> {
  for (const admin of [false, true]) {
    const key = admin ? 'oa-work-items-admin' : 'oa-work-items-employee';
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      continue;
    const actions = admin
      ? ['view', 'resume', 'reassign', 'cancel', 'forceComplete']
      : [
          'view',
          'create',
          'edit',
          'dispatch',
          'claim',
          'release',
          'complete',
          'confirm',
          'return',
          'block',
          'resume',
          'reassign',
          'cancel',
        ];
    const owned = [
      'create',
      'edit',
      'dispatch',
      'confirm',
      'return',
      'resume',
      'reassign',
      'cancel',
    ];
    const grants: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'oa.workItems' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              workItems: admin
                ? 'allRecords'
                : owned.includes(action)
                  ? 'oa.workItemsOwned'
                  : 'oa.workItemsReadable',
            },
          },
        })),
      },
    ];
    const now = new Date();
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: key,
        key,
        title: encodeAuthorizationTitle({
          ns: 'nb3-oa',
          key: 'workItems.authz.title',
        }),
        grants: JSON.stringify(grants),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const subjectType = admin ? 'org.dutyRole' : 'authenticated',
      subjectId = admin ? 'admin' : '*';
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
