import { defineSeed } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
/** Editable permission sets only. Assign named users through access administration. */
export default defineSeed({
  name: '202610290003_it_repair_permissions',
  async run({ query }) {
    for (const role of ['employee', 'leader', 'configuration']) {
      const key = `oa-it-repairs-${role}`;
      if (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('id')
          .where('key', '=', key)
          .executeTakeFirst()
      )
        continue;
      const grants: PermissionGrant[] =
        role === 'configuration'
          ? [
              {
                resource: { type: 'settings', id: 'oa.itRepairGroups' },
                actions: [{ action: 'read' }, { action: 'update' }],
              },
            ]
          : [
              {
                resource: { type: 'composite', id: 'oa.itRepairs' },
                actions: (role === 'employee'
                  ? ['view', 'create', 'edit', 'submit']
                  : ['view']
                ).map((action) => ({
                  action,
                  policy: {
                    type: 'composite',
                    scopes: {
                      itRepairs:
                        role === 'leader'
                          ? 'oa.itRepairsVisible'
                          : 'oa.itRepairsOwned',
                    },
                  },
                })),
              },
              ...(role === 'employee'
                ? [
                    {
                      resource: { type: 'composite' as const, id: 'oa.assets' },
                      actions: [{ action: 'viewHeld' }],
                    },
                  ]
                : []),
            ];
      const now = new Date();
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: key,
          key,
          title: encodeAuthorizationTitle({
            ns: 'nb3-oa',
            key:
              role === 'configuration' ? 'itRepairs.groups' : 'itRepairs.title',
          }),
          grants: JSON.stringify(grants),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
  },
});
