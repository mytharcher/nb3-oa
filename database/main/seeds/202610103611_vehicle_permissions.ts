import { defineSeed, type QueryAdapter } from '@nocobase/db';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export async function installVehiclePermissions(
  query: QueryAdapter,
): Promise<void> {
  const definitions: [string, string, string, PermissionGrant[]][] = [
    [
      'oa-vehicles-employee',
      'authenticated',
      '*',
      [
        {
          resource: { type: 'composite', id: 'oa.vehicleRequests' },
          actions: ['submit', 'view', 'operate'].map((action) => ({
            action,
            policy: {
              type: 'composite',
              scopes: {
                vehicleRequests:
                  action === 'submit'
                    ? 'oa.vehicleRequestsOwned'
                    : 'oa.vehicleRequestsReadable',
              },
            },
          })),
        },
      ],
    ],
    [
      'oa-vehicles-administration',
      'org.dutyRole',
      'admin',
      [
        {
          resource: { type: 'composite', id: 'oa.vehicleGarage' },
          actions: ['view', 'manage'].map((action) => ({
            action,
            policy: {
              type: 'composite',
              scopes: { vehicles: 'allRecords', vehicleDrivers: 'allRecords' },
            },
          })),
        },
        {
          resource: { type: 'composite', id: 'oa.vehicleRequests' },
          actions: [
            {
              action: 'viewCost',
              policy: {
                type: 'composite',
                scopes: { vehicleUsageCosts: 'allRecords' },
              },
            },
          ],
        },
      ],
    ],
    [
      'oa-vehicles-finance',
      'org.dutyRole',
      'finance',
      [
        {
          resource: { type: 'composite', id: 'oa.vehicleRequests' },
          actions: [
            {
              action: 'view',
              policy: {
                type: 'composite',
                scopes: { vehicleRequests: 'allRecords' },
              },
            },
            {
              action: 'viewCost',
              policy: {
                type: 'composite',
                scopes: { vehicleUsageCosts: 'allRecords' },
              },
            },
          ],
        },
      ],
    ],
  ];
  for (const [key, subjectType, subjectId, grants] of definitions) {
    if (
      await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', key)
        .executeTakeFirst()
    )
      continue;
    const set = grants
        .reduce(
          (set, g) => set.grant(g),
          definePermissionSet(key).title({
            key: 'vehicles.authz.requests',
            ns: 'nb3-oa',
          }),
        )
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
  name: '202610103611_vehicle_permissions',
  run: ({ query }) => installVehiclePermissions(query),
});
