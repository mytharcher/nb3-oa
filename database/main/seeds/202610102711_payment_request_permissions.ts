import { defineSeed } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610102711_payment_request_permissions',
  async run({ query }) {
    const definitions = [
      [
        'oa-payment-employee',
        'authenticated',
        '*',
        ['submit', 'view', 'paymentAccount'],
      ],
      [
        'oa-payment-hr',
        'org.dutyRole',
        'hr',
        ['submit', 'delegate', 'view', 'paymentAccount'],
      ],
      [
        'oa-payment-cashier',
        'org.dutyRole',
        'cashier',
        ['view', 'voucherEvidence', 'paymentAccount'],
      ],
      [
        'oa-payment-finance',
        'org.dutyRole',
        'finance',
        ['view', 'paymentAccount'],
      ],
      ['oa-payment-cfo', 'org.dutyRole', 'cfo', ['view', 'paymentAccount']],
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
        resource: { type: 'composite', id: 'oa.payment' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              paymentRequests:
                action === 'paymentAccount' &&
                (subjectType === 'authenticated' || subjectId === 'hr')
                  ? 'oa.paymentOwn'
                  : action === 'view'
                    ? 'oa.paymentReadable'
                    : 'allRecords',
            },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'paymentRequests.authz.resource', ns: 'nb3-oa' })
        .grant(grant)
        .grant({
          resource: { type: 'page', id: 'oa-payment-requests' },
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
