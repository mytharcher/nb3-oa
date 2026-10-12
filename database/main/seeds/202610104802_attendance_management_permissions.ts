import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
/** Forward capability grant; replay preserves administrator edits and assignments. */
export async function installAttendanceManagementPermissions(
  query: QueryAdapter,
) {
  const key = 'oa-attendance-management-hr';
  if (
    await query
      .selectFrom('authorizationPermissionSets')
      .select('id')
      .where('key', '=', key)
      .executeTakeFirst()
  )
    return;
  const set = definePermissionSet(key)
    .title({ key: 'attendanceManagement.authz.resource', ns: 'nb3-oa' })
    .grant({
      resource: { type: 'composite', id: 'oa.attendanceManagement' },
      actions: ['view', 'manage'].map((action) => ({
        action,
        policy: {
          type: 'composite' as const,
          scopes: {
            attendanceShifts: 'allRecords',
            attendanceShiftRevisions: 'allRecords',
            attendanceSchedules: 'allRecords',
            attendanceScheduleRevisions: 'allRecords',
          },
        },
      })),
    })
    .grant({
      resource: { type: 'page', id: 'attendance-management' },
      actions: [{ action: 'access' }],
    })
    .build();
  const now = new Date();
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
  await query
    .insertInto('authorizationPermissionSetAssignments')
    .values({
      id: `org.dutyRole:hr:${key}`,
      permissionSetKey: key,
      subjectType: 'org.dutyRole',
      subjectId: 'hr',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}
export default defineSeed({
  name: '202610104802_attendance_management_permissions',
  run: ({ query }) => installAttendanceManagementPermissions(query),
});
