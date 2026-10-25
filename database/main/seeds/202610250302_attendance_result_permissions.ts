import { defineSeed } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
export default defineSeed({
  name: '202610250302_attendance_result_permissions',
  async run({ query }) {
    for (const [key, actions, subjectType, subjectId] of [
      [
        'oa-attendance-results-employee',
        ['view', 'recalculate', 'calculateSelf'],
        'authenticated',
        '*',
      ],
      [
        'oa-attendance-results-hr',
        ['view', 'recalculate', 'calculateSelf', 'export'],
        'org.dutyRole',
        'hr',
      ],
    ] as const) {
      if (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('id')
          .where('key', '=', key)
          .executeTakeFirst()
      )
        continue;
      const grant: PermissionGrant = {
        resource: { type: 'composite', id: 'oa.attendanceResults' },
        actions: actions.map((action) =>
          action === 'calculateSelf'
            ? {
                action,
                policy: {
                  type: 'composite' as const,
                  scopes: {
                    attendanceEvaluations: 'oa.attendanceResults.self',
                  },
                },
              }
            : {
                action,
                policy: {
                  type: 'composite',
                  scopes: {
                    attendanceEvaluations:
                      subjectType === 'authenticated'
                        ? 'oa.attendanceResults.self'
                        : 'allRecords',
                    attendanceEvaluationRevisions:
                      subjectType === 'authenticated'
                        ? 'oa.attendanceResults.self'
                        : 'allRecords',
                  },
                },
              },
        ),
      };
      const set = definePermissionSet(key)
        .title({ key: 'attendanceResults.authz.resource', ns: 'nb3-oa' })
        .grant(grant)
        .grant({
          resource: { type: 'page', id: 'attendance-results' },
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
          id: `${subjectType}:${subjectId}:${key}`,
          permissionSetKey: key,
          subjectType,
          subjectId,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
  },
});
