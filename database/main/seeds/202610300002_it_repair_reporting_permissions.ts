import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610300002_it_repair_reporting_permissions',
  async run(context) {
    const { query } = context;
    if (
      !(await context
        .repository('approvalRules')
        .exists({ filter: { key: 'itRepair.securityTransfer' } }))
    )
      await context.repository('approvalRules').createOne({
        values: {
          key: 'itRepair.securityTransfer',
          value: 0,
          effectiveFrom: new Date(0),
          createdAt: new Date(),
          updatedBy: null,
          note: null,
        },
      });
    for (const [role, actions, scope] of [
      ['reportEmployee', ['reports', 'export'], 'oa.itRepairsOwned'],
      ['reportLeader', ['reports', 'export'], 'oa.itRepairsVisible'],
      ['securityTransfer', ['transferSecurity'], 'oa.itRepairsVisible'],
    ] as const) {
      const key = `oa-it-repairs-${role}`;
      if (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('id')
          .where('key', '=', key)
          .executeTakeFirst()
      )
        continue;
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: key,
          key,
          title: encodeAuthorizationTitle({
            ns: 'nb3-oa',
            key: `itRepairs.roles.${role}`,
          }),
          grants: JSON.stringify([
            {
              resource: { type: 'composite', id: 'oa.itRepairs' },
              actions: actions.map((action) => ({
                action,
                policy: { type: 'composite', scopes: { itRepairs: scope } },
              })),
            },
          ]),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
    }
  },
});
