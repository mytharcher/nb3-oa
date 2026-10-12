// Forward initialization after the announcement provider and actions are registered.
import { defineSeed, type QueryAdapter } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export async function installAnnouncementPermissions(
  query: QueryAdapter,
): Promise<void> {
  for (const admin of [false, true]) {
    const key = admin ? 'oa-announcements-admin' : 'oa-announcements-employee';
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      continue;
    const actions = admin
      ? ['view', 'create', 'edit', 'publish', 'revoke', 'remind', 'receipts']
      : ['view', 'confirm'];
    const grants: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'oa.announcements' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              announcements: admin
                ? 'oa.announcementsOwned'
                : 'oa.announcementsReadable',
              ...(action === 'receipts'
                ? { announcementReceipts: 'oa.announcementRosterOwned' }
                : {}),
            },
          },
        })),
      },
    ];
    const now = new Date();
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: key,
        key,
        title: encodeAuthorizationTitle({
          ns: 'nb3-oa',
          key: 'announcements.authz.title',
        }),
        grants: JSON.stringify(grants),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const subjectType = admin ? 'org.dutyRole' : 'authenticated',
      subjectId = admin ? 'admin' : '*';
    await query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: `${subjectType}:${subjectId}:${key}`,
        permissionSetKey: key,
        subjectType,
        subjectId,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }
}

export default defineSeed({
  name: '202610104111_announcements_permissions',
  run: ({ query }) => installAnnouncementPermissions(query),
});
