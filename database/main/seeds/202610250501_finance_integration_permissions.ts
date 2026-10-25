import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610250501_finance_integration_permissions',
  async run({ query }) {
    const key = 'oa-finance-integration';
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      return;
    const now = new Date();
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: key,
        key,
        title: encodeAuthorizationTitle({
          ns: 'nb3-oa',
          key: 'financeIntegration.title',
        }),
        grants: JSON.stringify([
          {
            resource: { type: 'settings', id: 'oa.financeIntegration' },
            actions: [{ action: 'read' }, { action: 'send' }],
          },
        ]),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: `org.dutyRole:finance:${key}`,
        permissionSetKey: key,
        subjectType: 'org.dutyRole',
        subjectId: 'finance',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  },
});
