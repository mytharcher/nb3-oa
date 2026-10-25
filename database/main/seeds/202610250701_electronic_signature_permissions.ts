import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610250701_electronic_signature_permissions',
  async run({ query }) {
    const key = 'oa-electronic-signatures';
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
          key: 'electronicSignatures.title',
        }),
        grants: JSON.stringify([
          {
            resource: { type: 'settings', id: 'oa.electronicSignatures' },
            actions: [{ action: 'read' }, { action: 'send' }],
          },
        ]),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    for (const role of ['legal', 'sealKeeper'])
      await query
        .insertInto('authorizationPermissionSetAssignments')
        .values({
          id: `org.dutyRole:${role}:${key}`,
          permissionSetKey: key,
          subjectType: 'org.dutyRole',
          subjectId: role,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
  },
});
