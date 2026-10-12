import { defineSeed } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610102811_probation_request_permissions',
  async run({ query }) {
    const definitions = [
      ['oa-probation-employee', 'authenticated', '*', ['submit', 'view']],
      [
        'oa-probation-hr',
        'org.dutyRole',
        'hr',
        ['submit', 'delegate', 'view', 'compensation'],
      ],
      ['oa-probation-gm', 'org.dutyRole', 'gm', ['view', 'compensation']],
      ['oa-probation-cfo', 'org.dutyRole', 'cfo', ['view', 'compensation']],
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
        resource: { type: 'composite', id: 'oa.probation' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              probationRequests:
                action === 'view' || action === 'compensation'
                  ? 'oa.probationReadable'
                  : 'allRecords',
              ...(action === 'compensation'
                ? { probationCompensationProposals: 'allRecords' }
                : {}),
            },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'probationRequests.authz.resource', ns: 'nb3-oa' })
        .grant({
          resource: { type: 'page', id: 'oa-probation-requests' },
          actions: [{ action: 'access' }],
        })
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
  },
});
