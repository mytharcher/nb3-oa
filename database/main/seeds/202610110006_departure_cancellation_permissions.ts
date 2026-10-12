import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';

/** Add the new HR operation only to an untouched, still-assigned default job. */
export async function installDepartureCancellationPermissions(
  query: QueryAdapter,
): Promise<void> {
  const key = 'oa-departure-cancellation-hr';
  if (
    await query
      .selectFrom('authorizationPermissionSets')
      .select('id')
      .where('key', '=', key)
      .executeTakeFirst()
  )
    return;
  const base = await query
    .selectFrom('authorizationPermissionSets')
    .select(['grants', 'title'])
    .where('key', '=', 'oa-departure-hr')
    .executeTakeFirst();
  const assignment = await query
    .selectFrom('authorizationPermissionSetAssignments')
    .select('id')
    .where('permissionSetKey', '=', 'oa-departure-hr')
    .where('subjectType', '=', 'org.dutyRole')
    .where('subjectId', '=', 'hr')
    .executeTakeFirst();
  if (!base || !assignment) return;
  // Seeds stay self-contained; importing a live provider would mutate migration history.
  const expected: PermissionGrant[] = [
    {
      resource: { type: 'composite', id: 'oa.departure' },
      actions: ['submit', 'delegate', 'view', 'work', 'settle'].map(
        (action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              departureRequests: ['view', 'work', 'settle'].includes(action)
                ? 'oa.departureReadable'
                : 'allRecords',
              ...(['view', 'work'].includes(action)
                ? { departureWorkItems: 'allRecords' }
                : {}),
            },
          },
        }),
      ),
    },
  ];
  if (
    base.title !==
      encodeAuthorizationTitle({
        key: 'departureRequests.authz.resource',
        ns: 'nb3-oa',
      }) ||
    JSON.stringify(JSON.parse(String(base.grants))) !== JSON.stringify(expected)
  )
    return;
  const set = definePermissionSet(key)
    .title({ key: 'departureRequests.authz.cancel', ns: 'nb3-oa' })
    .grant({
      resource: { type: 'composite', id: 'oa.departure' },
      actions: [
        {
          action: 'cancel',
          policy: {
            type: 'composite',
            scopes: { departureRequests: 'oa.departureReadable' },
          },
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
      id: `org.dutyRole:hr:${key}`,
      permissionSetKey: key,
      subjectType: 'org.dutyRole',
      subjectId: 'hr',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}

export default defineSeed({
  name: '202610110006_departure_cancellation_permissions',
  transaction: true,
  run: ({ query }) => installDepartureCancellationPermissions(query),
});
