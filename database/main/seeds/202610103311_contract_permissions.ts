import { defineSeed } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610103311_contract_permissions',
  async run({ query }) {
    const definitions = [
      [
        'oa-contract-employee',
        'authenticated',
        '*',
        ['view', 'submit', 'ledger'],
      ],
      [
        'oa-contract-legal',
        'org.dutyRole',
        'legal',
        ['view', 'ledger', 'historicalEntry'],
      ],
      ['oa-contract-finance', 'org.dutyRole', 'finance', ['view', 'ledger']],
      [
        'oa-contract-finance-manager',
        'org.dutyRole',
        'financeManager',
        ['view', 'ledger'],
      ],
      ['oa-contract-cfo', 'org.dutyRole', 'cfo', ['view', 'ledger']],
      ['oa-contract-gm', 'org.dutyRole', 'gm', ['view', 'ledger']],
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
        resource: { type: 'composite', id: 'oa.contract' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes:
              action === 'ledger'
                ? {
                    contracts:
                      subjectType === 'authenticated'
                        ? 'oa.contractLedgerOwned'
                        : 'allRecords',
                    contractVersions:
                      subjectType === 'authenticated'
                        ? 'oa.contractVersionOwned'
                        : 'allRecords',
                  }
                : {
                    contractRequests:
                      action === 'view'
                        ? 'oa.contractReadable'
                        : action === 'submit' || action === 'historicalEntry'
                          ? 'oa.contractOwned'
                          : 'allRecords',
                  },
          },
        })),
      };
      const set = definePermissionSet(key)
        .title({ key: 'contracts.authz.resource', ns: 'nb3-oa' })
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
