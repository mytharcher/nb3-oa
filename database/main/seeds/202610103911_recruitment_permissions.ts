import { defineSeed } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610103911_recruitment_permissions',
  async run({ query }) {
    const definitions = [
      [
        'oa-recruitment-employee',
        'authenticated',
        '*',
        ['submit', 'view', 'operate', 'viewSalary'],
        'oa.recruitment.headedDepartments',
      ],
      [
        'oa-recruitment-hrbp',
        'org.dutyRole',
        'hrbp',
        ['view', 'operate', 'viewSalary'],
        'oa.recruitmentReadable',
      ],
      [
        'oa-recruitment-hrdirector',
        'org.dutyRole',
        'hrDirector',
        ['view', 'operate', 'viewSalary'],
        'oa.recruitmentReadable',
      ],
      [
        'oa-recruitment-gm',
        'org.dutyRole',
        'gm',
        ['view', 'operate', 'viewSalary'],
        'oa.recruitmentReadable',
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
        resource: { type: 'composite', id: 'oa.recruitment' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              recruitmentRequests:
                action === 'submit'
                  ? scope
                  : action === 'viewSalary'
                    ? 'oa.recruitmentSalaryReadable'
                    : 'oa.recruitmentReadable',
            },
          },
        })),
      };
      let builder = definePermissionSet(key)
        .title({ key: 'recruitment.authz.resource', ns: 'nb3-oa' })
        .grant(grant);
      if (subjectId === 'hrbp' || subjectId === 'hrDirector')
        builder = builder.grant({
          resource: { type: 'composite', id: 'oa.requisitions' },
          actions: ['view', 'close'].map((action) => ({
            action,
            policy: {
              type: 'composite',
              scopes: { requisitions: 'allRecords' },
            },
          })),
        });
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
