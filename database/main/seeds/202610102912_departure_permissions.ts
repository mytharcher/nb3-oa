import { defineSeed } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610102912_departure_permissions',
  async run({ query }) {
    const definitions = [
      [
        'oa-departure-employee',
        'authenticated',
        '*',
        ['submit', 'view', 'work'],
      ],
      [
        'oa-departure-hr',
        'org.dutyRole',
        'hr',
        ['submit', 'delegate', 'view', 'work', 'settle'],
      ],
      ['oa-departure-gm', 'org.dutyRole', 'gm', ['view']],
      ['oa-departure-it', 'org.dutyRole', 'it', ['view', 'work']],
      ['oa-departure-admin', 'org.dutyRole', 'admin', ['view', 'work']],
      ['oa-departure-finance', 'org.dutyRole', 'finance', ['view', 'work']],
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
        resource: { type: 'composite', id: 'oa.departure' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              departureRequests:
                action === 'view' || action === 'work' || action === 'settle'
                  ? 'oa.departureReadable'
                  : 'allRecords',
              ...(action === 'view' || action === 'work'
                ? { departureWorkItems: 'allRecords' }
                : {}),
            },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'departureRequests.authz.resource', ns: 'nb3-oa' })
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
