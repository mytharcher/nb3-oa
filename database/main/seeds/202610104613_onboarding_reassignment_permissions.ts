import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
/** Preserve administrator customizations and never recreate a removed assignment. */
export async function installOnboardingReassignmentPermissions(
  query: QueryAdapter,
): Promise<void> {
  const key = 'oa-onboarding-reassign-hr',
    baseKey = 'oa-onboarding-hr';
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
    .where('key', '=', baseKey)
    .executeTakeFirst();
  const assigned = await query
    .selectFrom('authorizationPermissionSetAssignments')
    .select('id')
    .where('permissionSetKey', '=', baseKey)
    .where('subjectType', '=', 'org.dutyRole')
    .where('subjectId', '=', 'hr')
    .executeTakeFirst();
  if (!base || !assigned) return;
  const expected: PermissionGrant[] = [
    {
      resource: { type: 'composite', id: 'oa.onboarding' },
      actions: ['view', 'create', 'cancel', 'forceComplete', 'viewSalary'].map(
        (action) => ({
          action,
          policy: {
            type: 'composite',
            scopes:
              action === 'view'
                ? {
                    onboardings: 'oa.onboardingReadable',
                    onboardingTasks: 'oa.onboardingReadable',
                  }
                : action === 'forceComplete'
                  ? { onboardingTasks: 'oa.onboardingReadable' }
                  : { onboardings: 'oa.onboardingReadable' },
          },
        }),
      ),
    },
    {
      resource: { type: 'composite', id: 'oa.requisitions' },
      actions: [
        {
          action: 'view',
          policy: { type: 'composite', scopes: { requisitions: 'allRecords' } },
        },
      ],
    },
  ];
  if (
    base.title !==
      encodeAuthorizationTitle({
        key: 'onboarding.authz.resource',
        ns: 'nb3-oa',
      }) ||
    JSON.stringify(JSON.parse(String(base.grants))) !== JSON.stringify(expected)
  )
    return;
  const set = definePermissionSet(key)
      .title({ key: 'onboarding.authz.reassignMentor', ns: 'nb3-oa' })
      .grant({
        resource: { type: 'composite', id: 'oa.onboarding' },
        actions: [
          {
            action: 'reassignMentor',
            policy: {
              type: 'composite',
              scopes: { onboardingTasks: 'oa.onboardingReadable' },
            },
          },
        ],
      })
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
  name: '202610104613_onboarding_reassignment_permissions',
  transaction: true,
  run: ({ query }) => installOnboardingReassignmentPermissions(query),
});
