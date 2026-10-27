import { defineSeed } from '@nocobase/db';
import type { PermissionGrant } from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610260001_approval_ai_permissions',
  async run({ query }) {
    // Extend only existing editable process-manager jobs, preserving their current grants and assignments.
    const sets = await query
      .selectFrom('authorizationPermissionSets')
      .select(['id', 'key', 'grants'])
      .execute();
    for (const set of sets) {
      if (
        typeof set.key !== 'string' ||
        !set.key.startsWith('oa-process-manager-')
      )
        continue;
      const grants = (
        typeof set.grants === 'string' ? JSON.parse(set.grants) : set.grants
      ) as PermissionGrant[];
      if (
        grants.some(
          (g) =>
            g.resource.type === 'composite' &&
            g.resource.id === 'oa.approvalAi',
        )
      )
        continue;
      await query
        .updateTable('authorizationPermissionSets')
        .set({
          grants: JSON.stringify([
            ...grants,
            {
              resource: { type: 'composite', id: 'oa.approvalAi' },
              actions: [
                {
                  action: 'configure',
                  policy: {
                    type: 'composite',
                    scopes: { settings: 'allRecords' },
                  },
                },
              ],
            },
          ]),
          updatedAt: new Date(),
        })
        .where('id', '=', set.id)
        .execute();
    }
  },
});
