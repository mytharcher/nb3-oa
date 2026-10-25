import { defineSeed } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610250201_personal_schedule_permissions',
  async run({ query }) {
    const key = 'oa-personal-schedules-employee';
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      return;
    const grants: PermissionGrant[] = [
      {
        resource: { type: 'composite', id: 'oa.personalSchedules' },
        actions: ['view', 'create', 'edit', 'delete'].map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: { personalSchedules: 'oa.personalSchedulesOwned' },
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
          key: 'personalSchedules.authz.title',
        }),
        grants: JSON.stringify(grants),
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
