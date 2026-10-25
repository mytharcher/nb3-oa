import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610250301_process_operations_permissions',
  async run({ query }) {
    const key = 'oa-process-operations-report';
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
          key: 'processOperations.title',
        }),
        grants: JSON.stringify([
          {
            resource: { type: 'settings', id: 'oa.processOperations' },
            actions: [{ action: 'read' }],
          },
        ]),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: `org.dutyRole:admin:${key}`,
        permissionSetKey: key,
        subjectType: 'org.dutyRole',
        subjectId: 'admin',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  },
});
