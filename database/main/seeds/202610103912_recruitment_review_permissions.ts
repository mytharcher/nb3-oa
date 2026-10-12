import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';

/** Forward defaults only: existing definitions and removed assignments remain administrator-owned. */
export async function installRecruitmentReviewPermissions(
  query: QueryAdapter,
): Promise<void> {
  const roles = [
    [
      'employee',
      'authenticated',
      '*',
      ['submit', 'view', 'operate', 'viewSalary'],
    ],
    ['hrbp', 'org.dutyRole', 'hrbp', ['view', 'operate', 'viewSalary']],
    [
      'hrdirector',
      'org.dutyRole',
      'hrDirector',
      ['view', 'operate', 'viewSalary'],
    ],
    ['gm', 'org.dutyRole', 'gm', ['view', 'operate', 'viewSalary']],
  ] as const;
  for (const [role, subjectType, subjectId, actions] of roles) {
    const baseKey = `oa-recruitment-${role}`,
      key = `oa-recruitment-review-${role}`;
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      continue;
    const base = await query
      .selectFrom('authorizationPermissionSets')
      .select('grants')
      .where('key', '=', baseKey)
      .executeTakeFirst();
    const assigned = await query
      .selectFrom('authorizationPermissionSetAssignments')
      .select('id')
      .where('permissionSetKey', '=', baseKey)
      .where('subjectType', '=', subjectType)
      .where('subjectId', '=', subjectId)
      .executeTakeFirst();
    if (!base || !assigned) continue;
    const expected: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'oa.recruitment' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              recruitmentRequests:
                action === 'submit'
                  ? 'oa.recruitment.headedDepartments'
                  : action === 'viewSalary'
                    ? 'oa.recruitmentSalaryReadable'
                    : 'oa.recruitmentReadable',
            },
          },
        })),
      },
    ];
    if (role === 'hrbp' || role === 'hrdirector')
      expected.push({
        resource: { type: 'composite', id: 'oa.requisitions' },
        actions: ['view', 'close'].map((action) => ({
          action,
          policy: { type: 'composite', scopes: { requisitions: 'allRecords' } },
        })),
      });
    // Customized base grants require an explicit administrator decision, not an automatic expansion.
    if (
      JSON.stringify(JSON.parse(String(base.grants))) !==
      JSON.stringify(expected)
    )
      continue;
    const set = definePermissionSet(key)
      .title({ key: 'recruitment.actions.reviewEdit', ns: 'nb3-oa' })
      .grant({
        resource: { type: 'composite', id: 'oa.recruitment' },
        actions: [
          {
            action: 'reviewEdit',
            policy: {
              type: 'composite',
              scopes: { recruitmentRequests: 'oa.recruitmentReadable' },
            },
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
}
export default defineSeed({
  name: '202610103912_recruitment_review_permissions',
  transaction: true,
  run: ({ query }) => installRecruitmentReviewPermissions(query),
});
