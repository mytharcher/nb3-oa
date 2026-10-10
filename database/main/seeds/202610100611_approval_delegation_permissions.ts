import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Stable application resource identifiers repeated here: seeds do not import the server graph.
const set = definePermissionSet('oa-approval-delegations')
  .title({ key: 'approvals.permissionSets.delegations', ns: 'nb3-oa' })
  .grant(
    {
      resource: { type: 'settings', id: 'oa.approvalDelegations' },
      actions: [{ action: 'read' }, { action: 'update' }],
    },
    { resource: { type: 'user', id: '*' }, actions: [{ action: 'read' }] },
  )
  .build();
const seed: SeedDefinition = defineSeed({
  name: '202610100611_approval_delegation_permissions',
  async run({ query }) {
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', set.key)
        .executeTakeFirst()
    )
      return;
    const now = new Date();
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
    for (const role of ['hr', 'hrbp', 'hrDirector']) {
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
  },
});
export default seed;
