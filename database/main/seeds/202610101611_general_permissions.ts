import { defineSeed } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
export default defineSeed({
  name: '202610101611_general_permissions',
  async run({ query }) {
    for (const [key, actions, subjectType, subjectId] of [
      ['oa-general-employee', ['submit', 'view'], 'authenticated', '*'],
      ['oa-general-hr', ['submit', 'delegate', 'view'], 'org.dutyRole', 'hr'],
    ] as const) {
      if (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('id')
          .where('key', '=', key)
          .executeTakeFirst()
      )
        continue;
      const grant: PermissionGrant = {
        resource: { type: 'composite', id: 'oa.general' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              generalRequests:
                key === 'oa-general-employee' && action === 'view'
                  ? 'oa.generalReadable'
                  : 'allRecords',
            },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'general.authz.resource', ns: 'nb3-oa' })
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
