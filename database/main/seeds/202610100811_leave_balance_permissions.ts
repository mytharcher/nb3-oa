import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  defineSeed,
  type SeedDefinition,
  type QueryAdapter,
} from '@nocobase/db';
const set = definePermissionSet('oa-leave-balances-hr')
  .title({ key: 'leaveBalances.authz.permissionSet', ns: 'nb3-oa' })
  .grant({
    resource: { type: 'settings', id: 'oa.leaveBalances' },
    actions: [{ action: 'read' }, { action: 'update' }],
  })
  .build();
export async function installLeaveBalancePermissions(
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
  for (const role of ['hr', 'hrbp', 'hrDirector'])
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
  name: '202610100811_leave_balance_permissions',
  async run({ query }) {
    await installLeaveBalancePermissions(query);
  },
});
export default seed;
