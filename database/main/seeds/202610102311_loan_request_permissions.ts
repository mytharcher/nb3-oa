import { defineSeed } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
export default defineSeed({
  name: '202610102311_loan_request_permissions',
  async run({ query }) {
    for (const [key, actions, subjectType, subjectId] of [
      [
        'oa-loan-request-employee',
        ['submit', 'view', 'payment', 'confirmRepayment'],
        'authenticated',
        '*',
      ],
      [
        'oa-loan-request-hr',
        ['submit', 'delegate', 'view', 'payment', 'confirmRepayment'],
        'org.dutyRole',
        'hr',
      ],
      [
        'oa-loan-request-cashier',
        ['view', 'payment', 'cashRepayment'],
        'org.dutyRole',
        'cashier',
      ],
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
        resource: { type: 'composite', id: 'oa.loan' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              loanRequests:
                action === 'view' ? 'oa.loanReadable' : 'allRecords',
            },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'loanRequests.authz.resource', ns: 'nb3-oa' })
        .grant(grant)
        .grant({
          resource: { type: 'page', id: 'oa-loan-requests' },
          actions: [{ action: 'access' }],
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
