import { defineSeed } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610104611_onboarding_permissions',
  async run({ query }) {
    const definitions = [
      [
        'oa-onboarding-employee',
        'authenticated',
        '*',
        ['view', 'claim', 'release', 'complete'],
      ],
      [
        'oa-onboarding-hr',
        'org.dutyRole',
        'hr',
        ['view', 'create', 'cancel', 'forceComplete', 'viewSalary'],
      ],
      [
        'oa-onboarding-finance',
        'org.dutyRole',
        'finance',
        ['view', 'viewBank'],
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
        resource: { type: 'composite', id: 'oa.onboarding' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes:
              action === 'view'
                ? {
                    onboardings: 'oa.onboardingReadable',
                    onboardingTasks: 'oa.onboardingReadable',
                  }
                : ['claim', 'release', 'complete', 'forceComplete'].includes(
                      action,
                    )
                  ? { onboardingTasks: 'oa.onboardingReadable' }
                  : { onboardings: 'oa.onboardingReadable' },
          },
        })),
      };
      let builder = definePermissionSet(key)
        .title({ key: 'onboarding.authz.resource', ns: 'nb3-oa' })
        .grant(grant);
      if (subjectId === 'hr')
        builder = builder.grant({
          resource: { type: 'composite', id: 'oa.requisitions' },
          actions: [
            {
              action: 'view',
              policy: {
                type: 'composite',
                scopes: { requisitions: 'allRecords' },
              },
            },
          ],
        });
      const set = builder.build(),
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
          id: `${subjectType}:${subjectId}:${key}`,
          permissionSetKey: key,
          subjectType,
          subjectId,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
  },
});
