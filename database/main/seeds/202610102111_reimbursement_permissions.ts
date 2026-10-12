import { defineSeed } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
export default defineSeed({
  name: '202610102111_reimbursement_permissions',
  async run({ query }) {
    for (const [key, actions, subjectType, subjectId, bankScope] of [
      [
        'oa-reimbursement-employee',
        ['submit', 'view', 'paymentAccount'],
        'authenticated',
        '*',
        'oa.reimbursementOwned',
      ],
      [
        'oa-reimbursement-hr',
        ['submit', 'delegate', 'view', 'paymentAccount'],
        'org.dutyRole',
        'hr',
        'oa.reimbursementOwned',
      ],
      [
        'oa-reimbursement-finance-bank',
        ['view', 'paymentAccount'],
        'org.dutyRole',
        'finance',
        'oa.reimbursementReadable',
      ],
      [
        'oa-reimbursement-cashier-bank',
        ['view', 'paymentAccount'],
        'org.dutyRole',
        'cashier',
        'oa.reimbursementReadable',
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
        resource: { type: 'composite', id: 'oa.reimbursement' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              reimbursementRequests:
                action === 'view'
                  ? 'oa.reimbursementReadable'
                  : action === 'paymentAccount'
                    ? bankScope
                    : 'allRecords',
            },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'reimbursementRequests.authz.resource', ns: 'nb3-oa' })
        .grant(grant)
        .grant({
          resource: { type: 'page', id: 'oa-reimbursement-requests' },
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
