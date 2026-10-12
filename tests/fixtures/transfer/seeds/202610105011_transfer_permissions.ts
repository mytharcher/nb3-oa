import { defineSeed } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610105011_transfer_permissions',
  async run({ query }) {
    const definitions = [
      [
        'oa-transfer-employee',
        'authenticated',
        '*',
        ['submit', 'view', 'operate', 'reviewEdit', 'cancel'],
        'oa.transferReadable',
      ],
      [
        'oa-transfer-hr',
        'org.dutyRole',
        'hr',
        [
          'submit',
          'view',
          'operate',
          'reviewEdit',
          'cancel',
          'rebind',
          'viewSalary',
        ],
        'oa.transferReadable',
      ],
      [
        'oa-transfer-gm',
        'org.dutyRole',
        'gm',
        ['view', 'operate', 'reviewEdit', 'viewSalary'],
        'oa.transferReadable',
      ],
      [
        'oa-transfer-executive',
        'authenticated',
        '*',
        ['viewSalary'],
        'oa.transferSalaryReadable',
      ],
    ] as const;
    for (const [key, subjectType, subjectId, actions, scope] of definitions) {
      if (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('id')
          .where('key', '=', key)
          .executeTakeFirst()
      )
        continue;
      const grant: PermissionGrant = {
        resource: { type: 'composite', id: 'oa.transfer' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              transferRequests:
                action === 'submit'
                  ? scope
                  : action === 'viewSalary'
                    ? 'oa.transferSalaryReadable'
                    : 'oa.transferReadable',
            },
          },
        })),
      };
      const builder = definePermissionSet(key)
        .title({ key: 'transfer.authz.resource', ns: 'nb3-oa' })
        .grant(grant);
      const set = builder.build(),
        now = new Date();
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
