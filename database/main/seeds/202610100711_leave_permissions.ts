import { defineSeed } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
export default defineSeed({
  name: '202610100711_leave_permissions',
  async run({ query }) {
    for (const [key, actions, subjectType, subjectId] of [
      ['oa-leave-employee', ['submit', 'view'], 'authenticated', '*'],
      ['oa-leave-hr', ['submit', 'delegate', 'view'], 'org.dutyRole', 'hr'],
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
        resource: { type: 'composite', id: 'oa.leave' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              leaveRequests:
                key === 'oa-leave-employee' && action === 'view'
                  ? 'oa.leaveReadable'
                  : 'allRecords',
            },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'approvals.authz.leave', ns: 'nb3-oa' })
        .grant(
          grant,
          {
            resource: { type: 'page', id: 'oa.leave' },
            actions: [{ action: 'access' }],
          },
          {
            resource: { type: 'page', id: 'oa.approvals' },
            actions: [{ action: 'access' }],
          },
          {
            resource: { type: 'user', id: '*' },
            actions: [{ action: 'read' }],
          },
        )
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
