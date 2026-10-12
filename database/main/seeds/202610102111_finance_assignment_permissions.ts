import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  defineSeed,
  type SeedDefinition,
  type QueryAdapter,
} from '@nocobase/db';
const set = definePermissionSet('oa-finance-assignments-managers')
  .title({ key: 'financeAssignments.authz.permissionSet', ns: 'nb3-oa' })
  .grant({
    resource: { type: 'settings', id: 'oa.financeAssignments' },
    actions: [{ action: 'read' }, { action: 'update' }],
  })
  .grant({
    resource: { type: 'settings', id: 'oa.org.departments' },
    actions: [{ action: 'read' }],
  })
  .build();
export async function installFinanceAssignmentPermissions(
  query: QueryAdapter,
): Promise<void> {
  if (
    await query
      .selectFrom('authorizationPermissionSets')
      .select('id')
      .where('key', '=', set.key)
      .executeTakeFirst()
  )
    return;
  const now = new Date('2026-10-10T00:00:00Z');
  await query
    .insertInto('authorizationPermissionSets')
    .values({
      id: set.key,
      key: set.key,
      title: encodeAuthorizationTitle(set.title ?? set.key),
      grants: JSON.stringify(set.grants),
      createdAt: now,
      updatedAt: now,
    })
    .execute();
  for (const role of ['financeManager', 'cfo'])
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: `org.dutyRole:${role}:${set.key}`,
        permissionSetKey: set.key,
        subjectType: 'org.dutyRole',
        subjectId: role,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
}
const seed: SeedDefinition = defineSeed({
  name: '202610102111_finance_assignment_permissions',
  async run({ query }) {
    await installFinanceAssignmentPermissions(query);
  },
});
export default seed;
