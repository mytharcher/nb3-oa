// @vitest-environment node
import { expect } from 'vitest';
import { test } from './helpers.js';
import { createEmployee, grantToUser } from '../employees/helpers.js';

import { write } from '../platform/helpers.js';
import {
  apiDocsToken,
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
test('HTTP authenticates, requires explicit grants, rejects forged actor and documents vehicle routes', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    owner = await createEmployee(testApp, 'Vehicle HTTP owner'),
    other = await createEmployee(testApp, 'Vehicle HTTP other');
  const os = await owner.session(),
    otherSession = await other.session();
  expect((await testApp.request('/vehicleRequests')).status).toBe(401);
  expect((await os.fetch('/vehicles')).status).toBe(403);
  await grantToUser(
    testApp,
    'vehicles-test-owner',
    [
      {
        resource: { type: 'composite', id: 'oa.vehicleRequests' },
        actions: ['view', 'submit', 'operate'].map((action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: { vehicleRequests: 'oa.vehicleRequestsOwned' },
          },
        })),
      },
    ],
    owner.userId,
  );
  const input = {
    purpose: 'Customer visit',
    destination: 'Customer',
    startAt: '2026-10-16T01:00:00Z',
    endAt: '2026-10-16T02:00:00Z',
    passengers: 2,
    needsDriver: false,
  };
  expect(
    (
      await os.fetch(
        '/vehicleRequests',
        write('POST', { ...input, actorId: other.userId }),
      )
    ).status,
  ).toBe(400);
  const created = await os.fetch('/vehicleRequests', write('POST', input));
  expect(created.status).toBe(200);
  const data = (await created.json()) as { data: { record: { id: string } } };
  const id = data.data.record.id;
  expect((await os.fetch('/vehicleRequests/' + id)).status).toBe(200);
  await grantToUser(
    testApp,
    'vehicles-test-other',
    [
      {
        resource: { type: 'composite', id: 'oa.vehicleRequests' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { vehicleRequests: 'oa.vehicleRequestsOwned' },
            },
          },
        ],
      },
    ],
    other.userId,
  );
  expect((await otherSession.fetch('/vehicleRequests/' + id)).status).toBe(404);
  expect((await os.fetch('/vehicleRequests/' + id + '/usageCost')).status).toBe(
    403,
  );
  expect((await os.fetch('/vehicles')).status).toBe(403);
  await grantToUser(
    testApp,
    'vehicles-test-garage',
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
    ],
    owner.userId,
  );
  expect(
    (
      await os.fetch(
        '/vehicles',
        write('POST', {
          plateNumber: 'B-1',
          name: 'Car',
          vehicleType: 'car',
          capacity: 4,
          status: 'active',
          reason: 'Register',
        }),
      )
    ).status,
  ).toBe(403);
  expect(findUndeclaredApiRoutes(testApp.application)).toEqual([]);
  const doc = await c.resolve(apiDocsToken).getDocument();
  expect(findApiDocumentSchemaProblems(doc)).toEqual([]);
});

test('candidate default permission initialization preserves existing sets and restricts garage writes to actual administrative duties', async ({
  testApp,
}) => {
  const { installVehiclePermissions } =
    await import('../../../database/main/seeds/202610103611_vehicle_permissions.js');
  const { databaseManagerToken } = await import('@nocobase/db');
  const { organizationServiceToken } =
    await import('../../../server/providers/org/index.js');
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  await db.transaction((tx) => installVehiclePermissions(tx.query));
  const owner = await createEmployee(testApp, 'Default vehicle employee'),
    admin = await createEmployee(testApp, 'Default vehicle administrator'),
    os = await owner.session(),
    as = await admin.session();
  expect((await os.fetch('/vehicleRequests')).status).toBe(200);
  expect((await os.fetch('/vehicles')).status).toBe(403);
  await org.addDutyRoleMember('admin', admin.userId, { actorId: admin.userId });
  expect((await as.fetch('/vehicles')).status).toBe(200);
  const { dictionaryServiceToken } =
    await import('../../../server/providers/platform/index.js');
  const vehicleType = (
    await c.resolve(dictionaryServiceToken).list('vehicleType')
  )[0]!.code;
  expect(
    (
      await as.fetch(
        '/vehicles',
        write('POST', {
          plateNumber: 'HTTP-DEFAULT',
          name: 'Actual fleet car',
          vehicleType,
          capacity: 4,
          status: 'active',
          reason: 'Vehicle register',
        }),
      )
    ).status,
  ).toBe(200);

  const before = await db
    .repository('authorizationPermissionSets')
    .findOne({ filter: { key: 'oa-vehicles-administration' } });
  await db.transaction((tx) => installVehiclePermissions(tx.query));
  expect(
    await db
      .repository('authorizationPermissionSets')
      .count({ filter: { key: 'oa-vehicles-administration' } }),
  ).toBe(1);
  expect(
    (
      await db
        .repository('authorizationPermissionSets')
        .findOne({ filter: { key: 'oa-vehicles-administration' } })
    )?.grants,
  ).toEqual(before?.grants);
  await org.removeDutyRoleMember('admin', admin.userId, {
    actorId: admin.userId,
  });
  expect((await as.fetch('/vehicles')).status).toBe(403);
});

test('HTTP return uses the installed public to revision payload and creates a fresh head task on resubmission', async ({
  testApp,
}) => {
  const { organizationServiceToken } =
    await import('../../../server/providers/org/index.js');
  const { vehicleRequestServiceToken } =
    await import('../../../server/providers/vehicles/index.js');
  const c = testApp.application.container,
    org = c.resolve(organizationServiceToken),
    service = c.resolve(vehicleRequestServiceToken);
  const owner = await createEmployee(testApp, 'Return vehicle applicant'),
    head = await createEmployee(testApp, 'Return vehicle head'),
    os = await owner.session(),
    hs = await head.session();
  const department = await org.createDepartment(
    { title: 'Return vehicle team', managerId: head.userId },
    { actorId: head.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: head.userId },
  );
  const response = await os.fetch(
    '/vehicleRequests',
    write('POST', {
      purpose: 'Site visit',
      destination: 'Site',
      startAt: '2026-10-16T01:00:00Z',
      endAt: '2026-10-16T02:00:00Z',
      passengers: 2,
      needsDriver: false,
    }),
  );
  expect(response.status).toBe(200);
  const created = (await response.json()) as {
    data: { record: { id: string; lifecycleVersion: number } };
  };
  const id = created.data.record.id;
  expect(
    (
      await os.fetch(
        `/vehicleRequests/${id}/transitions`,
        write('POST', {
          transition: 'submit',
          version: created.data.record.lifecycleVersion,
          requestId: 'submit-return',
        }),
      )
    ).status,
  ).toBe(200);
  const detail = await service.detail(id, head.userId),
    task = detail.taskActions.find((a) =>
      a.actions.some((o) => o.name === 'return'),
    )!.task,
    run = detail.runs.find((r) => r.tasks.some((t) => t.id === task.id))!;
  const command = {
    target: { taskId: task.id },
    action: 'return',
    contentHash: run.run.contentHash,
    requestId: 'http-return',
    comment: 'Please clarify the purpose',
  };
  expect(
    (
      await hs.fetch(
        `/vehicleRequests/${id}/actions`,
        write('POST', { ...command, input: { returnTarget: 'revision' } }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await hs.fetch(
        `/vehicleRequests/${id}/actions`,
        write('POST', { ...command, input: { to: 'revision' } }),
      )
    ).status,
  ).toBe(200);
  const revised = await service.detail(id, owner.userId);
  expect(revised.record.status).toBe('revision');
  expect(
    (
      await os.fetch(
        `/vehicleRequests/${id}/transitions`,
        write('POST', {
          transition: 'submit',
          version: revised.record.lifecycleVersion,
          requestId: 'submit-revised',
        }),
      )
    ).status,
  ).toBe(200);
  const reopened = await service.detail(id, head.userId);
  expect(reopened.runs.at(-1)!.run.id).not.toBe(run.run.id);
});
