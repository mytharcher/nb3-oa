import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
/** Forward capability grant; replay preserves administrator edits and assignments. */
export async function installSalaryGradePermissions(query: QueryAdapter) {
  const key = 'oa-salary-grade-hr';
  if (
    await query
      .selectFrom('authorizationPermissionSets')
      .select('id')
      .where('key', '=', key)
      .executeTakeFirst()
  )
    return;
  const set = definePermissionSet(key)
    .title({ key: 'jobGrades.authz.resource', ns: 'nb3-oa' })
    .grant({
      resource: { type: 'composite', id: 'oa.salaryGrades' },
      actions: ['view', 'viewSalary', 'manage'].map((action) => ({
        action,
        policy: {
          type: 'composite' as const,
          scopes: {
            salaryGradeRevisions: 'allRecords',
            ...(action === 'view' ? {} : { salaryGradeCurrent: 'allRecords' }),
          },
        },
      })),
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
      id: `org.dutyRole:hr:${key}`,
      permissionSetKey: key,
      subjectType: 'org.dutyRole',
      subjectId: 'hr',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}
export default defineSeed({
  name: '202610104012_salary_grade_permissions',
  run: ({ query }) => installSalaryGradePermissions(query),
});
