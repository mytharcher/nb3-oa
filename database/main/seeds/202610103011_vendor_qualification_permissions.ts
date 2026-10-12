import { defineSeed } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610103011_vendor_qualification_permissions',
  async run({ query }) {
    const definitions = [
      [
        'oa-vendor-qualification-employee',
        'authenticated',
        '*',
        ['submit', 'view', 'paymentAccount', 'updatePaymentAccount'],
      ],
      [
        'oa-vendor-qualification-finance',
        'org.dutyRole',
        'finance',
        ['view', 'paymentAccount'],
      ],
      [
        'oa-vendor-qualification-finance-manager',
        'org.dutyRole',
        'financeManager',
        ['view', 'paymentAccount'],
      ],
      [
        'oa-vendor-qualification-cfo',
        'org.dutyRole',
        'cfo',
        ['view', 'paymentAccount'],
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
        resource: { type: 'composite', id: 'oa.vendorQualification' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              vendorQualifications:
                (
                  [
                    'paymentAccount',
                    'updatePaymentAccount',
                  ] as readonly string[]
                ).includes(action) && subjectType === 'authenticated'
                  ? 'oa.vendorQualificationOwned'
                  : action === 'view'
                    ? 'oa.vendorQualificationReadable'
                    : 'allRecords',
            },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'vendorQualifications.authz.resource', ns: 'nb3-oa' })
        .grant(grant)
        .grant({
          resource: { type: 'composite', id: 'oa.vendors' },
          actions: [
            {
              action: 'view',
              policy: { type: 'composite', scopes: { vendors: 'allRecords' } },
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
