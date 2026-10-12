// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { test } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { vehicleRequestServiceToken } from '../../../server/providers/vehicles/index.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import {
  apiDocsToken,
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
const input = {
  purpose: 'Browser trip',
  destination: 'Office',
  startAt: '2027-01-04T01:00:00Z',
  endAt: '2027-01-04T02:00:00Z',
  passengers: 1,
  needsDriver: false,
};
test('default employee browser facade uses scoped records, stable create fingerprint, no garage grant, and current field policy', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    owner = await createEmployee(testApp, 'Vehicle browser owner'),
    other = await createEmployee(testApp, 'Vehicle browser other'),
    os = await owner.session(),
    xs = await other.session();
  const opts = await os.fetch('/vehicleBrowser/options');
  expect(opts.status).toBe(200);
  expect((await opts.json()).data).toMatchObject({
    canCreate: true,
    canManage: false,
    canManageDrivers: false,
    actor: { id: owner.userId },
  });
  expect((await os.fetch('/vehicleBrowser/garage')).status).toBe(403);
  expect((await os.fetch('/vehicleBrowser/driverCandidates')).status).toBe(403);
  const key = randomUUID(),
    created = await os.fetch(
      '/vehicleRequests',
      write('POST', { ...input, requestId: key }),
    );
  expect(created.status).toBe(200);
  const first = (await created.json()).data;
  const id = first.record.id as string;
  const replay = await os.fetch(
    '/vehicleRequests',
    write('POST', { ...input, requestId: key }),
  );
  expect(replay.status).toBe(200);
  expect((await replay.json()).data).toMatchObject({
    record: { id },
    replayed: true,
  });
  expect(
    await db
      .repository('vehicleRequests')
      .count({ filter: { applicantId: owner.userId } }),
  ).toBe(1);
  expect(
    (
      await os.fetch(
        '/vehicleRequests',
        write('POST', { ...input, purpose: 'Changed', requestId: key }),
      )
    ).status,
  ).toBe(409);
  const list = await os.fetch(
    '/vehicleBrowser/requests?mode=mine&page=1&pageSize=1&sort=createdAt&direction=desc',
  );
  expect(list.status).toBe(200);
  const listed = (await list.json()).data;
  expect(listed.total).toBe(1);
  expect(listed.items[0]).toMatchObject({
    id,
    applicant: { id: owner.userId, name: 'Vehicle browser owner' },
  });
  expect(listed.items[0]).not.toHaveProperty('ruleSnapshot');
  expect(listed.items[0]).not.toHaveProperty('approvedFingerprint');
  expect((await xs.fetch('/vehicleBrowser/requests/' + id)).status).toBe(404);
  expect(
    (await xs.fetch('/vehicleBrowser/requests/' + id + '/facts')).status,
  ).toBe(404);
  const detail = await os.fetch('/vehicleBrowser/requests/' + id);
  expect(detail.status).toBe(200);
  expect((await detail.json()).data).toMatchObject({
    canViewCost: false,
    taskActions: [],
    transitions: expect.arrayContaining(['edit', 'submit', 'withdraw']),
  });
  const authz = c.resolve(authorizationToken),
    original = authz.for.bind(authz),
    spy = vi.spyOn(authz, 'for').mockImplementation((actor) => {
      const a = original(actor),
        authorize = a.authorize.bind(a);
      return {
        ...a,
        authorize: async (request) => {
          const d = await authorize(request);
          if (
            request.resource.type === 'composite' &&
            request.resource.id === 'oa.vehicleRequests' &&
            request.action === 'submit' &&
            d.effect !== 'deny'
          ) {
            const database = d.conditions?.database as Record<string, unknown>;
            return {
              ...d,
              conditions: {
                ...d.conditions,
                database: {
                  ...database,
                  vehicleRequests: {
                    read: { fields: ['id'] },
                    create: false,
                    update: false,
                    delete: false,
                  },
                },
              },
            };
          }
          return d;
        },
      };
    });
  const narrow = await os.fetch('/vehicleBrowser/options');
  expect(narrow.status).toBe(200);
  expect((await narrow.json()).data.canCreate).toBe(false);
  spy.mockRestore();
  const docs = await c.resolve(apiDocsToken).getDocument();
  expect(findUndeclaredApiRoutes(testApp.application)).toEqual([]);
  expect(findApiDocumentSchemaProblems(docs)).toEqual([]);
});
test('actual garage administrative role resolves safe driver employees and checks optimistic roster versions', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    admin = await createEmployee(testApp, 'Vehicle browser admin'),
    driver = await createEmployee(testApp, 'Vehicle browser driver'),
    inactive = await createEmployee(testApp, 'Disabled candidate');
  await db.repository('dutyRoleMembers').createOne({
    values: {
      id: randomUUID(),
      dutyRoleCode: 'admin',
      userId: admin.userId,
      active: true,
    },
  });
  await c.resolve(userAdministrationServiceToken).disable(inactive.userId);
  const session = await admin.session(),
    o = await session.fetch('/vehicleBrowser/options');
  expect(o.status).toBe(200);
  expect((await o.json()).data).toMatchObject({
    canManage: true,
    canManageDrivers: true,
  });
  const candidates = await session.fetch(
    '/vehicleBrowser/driverCandidates?search=Vehicle%20browser%20driver',
  );
  expect(candidates.status).toBe(200);
  const items = (await candidates.json()).data.items;
  expect(items).toContainEqual({
    id: driver.employeeId,
    user: { id: driver.userId, name: 'Vehicle browser driver' },
  });
  expect(JSON.stringify(items)).not.toContain('email');
  expect(JSON.stringify(items)).not.toContain(inactive.userId);
  const set = await session.fetch(
    '/vehicleDrivers',
    write('POST', {
      employeeId: driver.employeeId,
      active: true,
      version: 0,
      reason: 'Real roster',
    }),
  );
  expect(set.status).toBe(200);
  const record = (await set.json()).data;
  expect(record.version).toBe(1);
  const update = await session.fetch(
    '/vehicleDrivers',
    write('POST', {
      employeeId: driver.employeeId,
      active: false,
      version: 1,
      reason: 'Disable roster',
    }),
  );
  expect(update.status).toBe(200);
  expect((await update.json()).data.version).toBe(2);
  expect(
    (
      await session.fetch(
        '/vehicleDrivers',
        write('POST', {
          employeeId: driver.employeeId,
          active: true,
          version: 1,
          reason: 'Stale',
        }),
      )
    ).status,
  ).toBe(409);
  const driverView = await session.fetch(
    '/vehicleBrowser/drivers/' + record.id,
  );
  expect(driverView.status).toBe(200);
  expect((await driverView.json()).data.record.employee).toEqual({
    id: driver.employeeId,
    user: { id: driver.userId, name: 'Vehicle browser driver' },
  });
  const type = (await c.resolve(dictionaryServiceToken).list('vehicleType'))[0]!
      .code,
    service = c.resolve(vehicleRequestServiceToken);
  await db.transaction((tx) =>
    service.vehicles.create(
      {
        plateNumber: 'BR-A',
        name: '阿车辆',
        vehicleType: type,
        capacity: 4,
        status: 'active',
        actorId: admin.userId,
        reason: 'Actual roster',
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    service.vehicles.create(
      {
        plateNumber: 'BR-B',
        name: '北京车辆',
        vehicleType: type,
        capacity: 7,
        status: 'active',
        actorId: admin.userId,
        reason: 'Actual roster',
      },
      tx,
    ),
  );
  const garage = await session.fetch(
    '/vehicleBrowser/garage?sort=name&direction=asc&locale=zh-CN&pageSize=1',
  );
  expect(garage.status).toBe(200);
  const data = (await garage.json()).data;
  expect(data.total).toBe(2);
  expect(data.items[0].name).toBe('阿车辆');
  await db.repository('dutyRoleMembers').updateMany({
    filter: { dutyRoleCode: 'admin', userId: admin.userId },
    values: { active: false },
  });
  expect((await session.fetch('/vehicleBrowser/driverCandidates')).status).toBe(
    403,
  );
  expect(
    (
      await session.fetch(
        '/vehicleDrivers',
        write('POST', {
          employeeId: driver.employeeId,
          active: true,
          version: 2,
          reason: 'After revoke',
        }),
      )
    ).status,
  ).toBe(403);
});
test('transition keys freeze payload and actor, and real account disabling refuses old creation and transition replays', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    service = c.resolve(vehicleRequestServiceToken),
    owner = await createEmployee(testApp, 'Vehicle replay owner'),
    session = await owner.session(),
    creationKey = randomUUID();
  const created = await session.fetch(
    '/vehicleRequests',
    write('POST', { ...input, requestId: creationKey }),
  );
  expect(created.status).toBe(200);
  const record = (await created.json()).data.record;
  const key = randomUUID(),
    command = {
      transition: 'edit',
      version: record.lifecycleVersion,
      requestId: key,
      input: { ...input, purpose: 'Actual edit' },
    };
  expect(
    (
      await session.fetch(
        '/vehicleRequests/' + record.id + '/transitions',
        write('POST', command),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await session.fetch(
        '/vehicleRequests/' + record.id + '/transitions',
        write('POST', {
          ...command,
          input: { ...input, purpose: 'Changed replay' },
        }),
      )
    ).status,
  ).toBe(409);
  await c.resolve(userAdministrationServiceToken).disable(owner.userId);
  await expect(
    service.create(input, owner.userId, undefined, creationKey),
  ).rejects.toMatchObject({ code: 'VEHICLE_EMPLOYEE_INACTIVE' });
  await expect(
    service.transition(
      record.id,
      'edit',
      owner.userId,
      record.lifecycleVersion,
      key,
      command.input,
    ),
  ).rejects.toMatchObject({ code: 'VEHICLE_EMPLOYEE_INACTIVE' });
});
test('actual browser SDK dispatch and owner usage expose safe facts, while private fuel needs both current policies', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    owner = await createEmployee(testApp, 'Browser actual applicant'),
    head = await createEmployee(testApp, 'Browser actual head'),
    admin = await createEmployee(testApp, 'Browser actual admin'),
    finance = await createEmployee(testApp, 'Browser actual finance');
  const { organizationServiceToken } =
      await import('../../../server/providers/org/index.js'),
    org = c.resolve(organizationServiceToken),
    department = await org.createDepartment(
      { title: 'Browser vehicle department', managerId: head.userId },
      { actorId: admin.userId },
    );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: admin.userId },
  );
  for (const [userId, role] of [
    [admin.userId, 'admin'],
    [finance.userId, 'finance'],
  ])
    await db
      .repository('dutyRoleMembers')
      .createOne({
        values: { id: randomUUID(), userId, dutyRoleCode: role, active: true },
      });
  const os = await owner.session(),
    hs = await head.session(),
    as = await admin.session(),
    fs = await finance.session(),
    type = (await c.resolve(dictionaryServiceToken).list('vehicleType'))[0]!
      .code;
  const garage = await as.fetch(
    '/vehicles',
    write('POST', {
      plateNumber: 'FLOW-1',
      name: 'Actual browser vehicle',
      vehicleType: type,
      capacity: 4,
      status: 'active',
      reason: 'Real garage fixture',
    }),
  );
  expect(garage.status).toBe(200);
  const vehicle = (await garage.json()).data;
  const created = await os.fetch(
    '/vehicleRequests',
    write('POST', { ...input, requestId: randomUUID() }),
  );
  expect(created.status).toBe(200);
  let record = (await created.json()).data.record;
  const id = record.id;
  expect(
    (
      await os.fetch(
        `/vehicleRequests/${id}/transitions`,
        write('POST', {
          transition: 'submit',
          version: record.lifecycleVersion,
          requestId: randomUUID(),
        }),
      )
    ).status,
  ).toBe(200);
  async function perform(
    session: typeof os,
    name: string,
    privateInput?: Record<string, unknown>,
  ) {
    const response = await session.fetch(`/vehicleBrowser/requests/${id}`);
    expect(response.status).toBe(200);
    const d = (await response.json()).data,
      offer = d.taskActions.find((o: { actions: { name: string }[] }) =>
        o.actions.some((a) => a.name === name),
      );
    expect(offer).toBeDefined();
    const run = d.runs.find((r: { tasks: { id: string }[] }) =>
      r.tasks.some((t) => t.id === offer.task.id),
    );
    const command = {
      target: { taskId: offer.task.id },
      action: name,
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
      ...(privateInput ? { privateInput } : { comment: 'Real operation' }),
    };
    const result = await session.fetch(
      `/vehicleRequests/${id}/actions`,
      write('POST', command),
    );
    expect(result.status).toBe(200);
  }
  await perform(hs, 'approve');
  await perform(as, 'claim');
  const candidates = await as.fetch(
    `/vehicleBrowser/requests/${id}/dispatchCandidates`,
  );
  expect(candidates.status).toBe(200);
  expect(
    (await candidates.json()).data.vehicles.some(
      (v: { id: string }) => v.id === vehicle.id,
    ),
  ).toBe(true);
  await perform(as, 'complete', { vehicleId: vehicle.id, driverId: null });
  const usage = await os.fetch(`/vehicleBrowser/requests/${id}`);
  expect(usage.status).toBe(200);
  const use = (await usage.json()).data;
  expect(use.record.status).toBe('usage');
  expect(use.transitions).not.toContain('withdraw');
  expect(use.transitions).not.toContain('terminate');
  record = use.record;
  expect(
    (
      await os.fetch(
        `/vehicleRequests/${id}/transitions`,
        write('POST', {
          transition: 'withdraw',
          version: record.lifecycleVersion,
          requestId: randomUUID(),
        }),
      )
    ).status,
  ).toBe(400);
  await perform(os, 'registerUsage', {
    mileage: 20,
    fuelCents: 12345,
    exception: 'Actual receipt',
  });
  const safe = await os.fetch(`/vehicleBrowser/requests/${id}/facts`);
  expect(safe.status).toBe(200);
  const facts = (await safe.json()).data;
  expect(facts).toMatchObject({
    dispatch: {
      vehicle: { id: vehicle.id, name: 'Actual browser vehicle' },
      dispatchedBy: { id: admin.userId, name: 'Browser actual admin' },
    },
    usage: {
      mileage: 20,
      registeredBy: { id: owner.userId, name: 'Browser actual applicant' },
    },
  });
  expect(JSON.stringify(facts)).not.toContain('fuel');
  expect((await os.fetch(`/vehicleRequests/${id}/usageCost`)).status).toBe(403);
  const privateView = await fs.fetch(`/vehicleBrowser/requests/${id}`);
  expect(privateView.status).toBe(200);
  expect((await privateView.json()).data.canViewCost).toBe(true);
  const cost = await fs.fetch(`/vehicleRequests/${id}/usageCost`);
  expect(cost.status).toBe(200);
  expect((await cost.json()).data.fuelCents).toBe(12345);
  const adminView = await as.fetch(`/vehicleBrowser/requests/${id}`);
  expect(adminView.status).toBe(200);
  expect((await adminView.json()).data.canViewCost).toBe(true);
  await db
    .repository('dutyRoleMembers')
    .updateMany({
      filter: { userId: admin.userId, dutyRoleCode: 'admin' },
      values: { active: false },
    });
  const after = await as.fetch(`/vehicleBrowser/requests/${id}`);
  expect(after.status).toBe(200);
  expect((await after.json()).data.canViewCost).toBe(false);
  expect((await as.fetch(`/vehicleRequests/${id}/usageCost`)).status).toBe(403);
  await db
    .repository('dutyRoleMembers')
    .updateMany({
      filter: { userId: finance.userId, dutyRoleCode: 'finance' },
      values: { active: false },
    });
  expect((await fs.fetch(`/vehicleBrowser/requests/${id}`)).status).toBe(404);
  expect((await fs.fetch(`/vehicleRequests/${id}/usageCost`)).status).toBe(404);
});
