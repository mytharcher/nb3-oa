import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  defineSeed,
  type SeedDefinition,
  type QueryAdapter,
} from '@nocobase/db';
const set = definePermissionSet('oa-budgets-finance')
  .title({ key: 'budgets.authz.permissionSet', ns: 'nb3-oa' })
  .grant({
    resource: { type: 'settings', id: 'oa.budgets' },
    actions: [{ action: 'read' }, { action: 'update' }],
  })
  .build();
export async function installBudgetPermissions(
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
  for (const role of ['finance', 'financeManager', 'cfo'])
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
  name: '202610101712_budget_permissions',
  async run({ query }) {
    await installBudgetPermissions(query);
  },
});
export default seed;
