import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
export async function installHeadcountPermissions(
  query: QueryAdapter,
): Promise<void> {
  const definitions = [
    {
      key: 'oa-headcounts-hr',
      role: 'org.dutyRole',
      subject: 'hr',
      actions: ['view', 'manage', 'viewJournal'],
      scope: 'allRecords',
    },
    {
      key: 'oa-headcounts-head',
      role: 'org.departmentHead',
      subject: '*',
      actions: ['view'],
      scope: 'oa.headcounts.headedDepartments',
    },
  ];
  for (const d of definitions) {
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', d.key)
        .executeTakeFirst()
    )
      continue;
    const grants = d.actions.map((action) => ({
      action,
      policy: {
        type: 'composite' as const,
        scopes: {
          headcountAccounts: d.scope,
          ...(action === 'viewJournal' ? { headcountJournal: d.scope } : {}),
        },
      },
    }));
    const set = definePermissionSet(d.key)
        .title({ key: 'headcounts.authz.title', ns: 'nb3-oa' })
        .grant({
          resource: { type: 'composite', id: 'oa.headcounts' },
          actions: grants,
        })
        .build(),
      now = new Date();
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: d.key,
        key: d.key,
        title: encodeAuthorizationTitle(set.title ?? d.key),
        grants: JSON.stringify(set.grants),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: `${d.role}:${d.subject}:${d.key}`,
        permissionSetKey: d.key,
        subjectType: d.role,
        subjectId: d.subject,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }
}
export default defineSeed({
  name: '202610103511_headcounts_permissions',
  run: ({ query }) => installHeadcountPermissions(query),
});
