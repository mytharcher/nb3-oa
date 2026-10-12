// No server imports: the installation seed loader does not resolve runtime source extensions.
import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export async function installMeetingRoomPermissions(
  query: QueryAdapter,
): Promise<void> {
  for (const administrative of [false, true]) {
    const key = administrative
      ? 'oa-meeting-rooms-admin'
      : 'oa-meeting-rooms-employee';
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      continue;
    const actions = administrative
      ? ['view', 'cancel', 'confirm', 'reject']
      : ['view', 'create', 'edit', 'cancel', 'checkIn'];
    const grants: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'oa.meetingRooms' },
        actions: (administrative ? ['view', 'manage'] : ['view']).map(
          (action) => ({
            action,
            policy: {
              type: 'composite',
              scopes: { meetingRooms: 'allRecords' },
            },
          }),
        ),
      },
      {
        resource: { type: 'composite', id: 'oa.meetingBookings' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: {
              meetingBookings: administrative
                ? 'allRecords'
                : action === 'view' || action === 'checkIn'
                  ? 'oa.meetingBookingsReadable'
                  : 'oa.meetingBookingsOwned',
            },
          },
        })),
      },
      { resource: { type: 'user', id: '*' }, actions: [{ action: 'read' }] },
    ];
    const set = definePermissionSet(key)
        .title({ key: 'meetingRooms.authz.title', ns: 'nb3-oa' })
        .grant(...grants)
        .build(),
      now = new Date();
    await query
      .insertInto('authorizationPermissionSets')
      .values({
        id: key,
        key,
        title: encodeAuthorizationTitle(set.title ?? key),
        grants: JSON.stringify(set.grants),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const subjectType = administrative ? 'org.dutyRole' : 'authenticated',
      subjectId = administrative ? 'admin' : '*';
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
  name: '202610103711_meeting_rooms_permissions',
  run: ({ query }) => installMeetingRoomPermissions(query),
});
