import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610250701_invoice_recognition_permissions',
  async run({ query }) {
    const key = 'oa-invoice-recognition';
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
          key: 'invoiceRecognition.title',
        }),
        grants: JSON.stringify([
          {
            resource: { type: 'settings', id: 'oa.invoiceRecognition' },
            actions: [
              { action: 'read' },
              { action: 'recognize' },
              { action: 'verify' },
            ],
          },
        ]),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: `authenticated:*:${key}`,
        permissionSetKey: key,
        subjectType: 'authenticated',
        subjectId: '*',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  },
});
