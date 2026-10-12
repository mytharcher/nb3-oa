import { defineSeed } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
export default defineSeed({
  name: '202610101812_supply_permissions',
  async run({ query }) {
    for (const [key, actions, subjectType, subjectId] of [
      ['oa-supply-employee', ['submit', 'view'], 'authenticated', '*'],
      ['oa-supply-admin', ['view', 'ledger'], 'org.dutyRole', 'admin'],
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
        resource: { type: 'composite', id: 'oa.supplies' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes:
              action === 'ledger'
                ? { supplyIssueLedger: 'allRecords' }
                : {
                    supplyRequests:
                      key === 'oa-supply-employee' && action === 'view'
                        ? 'oa.suppliesReadable'
                        : 'allRecords',
                  },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'supplies.authz.resource', ns: 'nb3-oa' })
        .grant(grant)
        .build();
      const now = new Date('2026-10-11T00:00:00Z');
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
