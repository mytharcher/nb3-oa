// @vitest-environment node
import { randomUUID } from 'node:crypto';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import type { PerformInput } from '@nocobase/app-plugin-approval/server';
import type { JsonObject } from '@nocobase/lifecycle';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { createPlatformAppTest } from '../platform/helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../../../server/providers/platform/index.js';
import { createVehicleRequestService } from '../../../server/providers/vehicles/requests.js';
const test = createPlatformAppTest();
test('actual SDK head, administrative claim, immutable dispatch and applicant usage; private amounts stay outside SDK history', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const owner = await createEmployee(testApp, 'Vehicle applicant'),
    head = await createEmployee(testApp, 'Vehicle head'),
    admin = await createEmployee(testApp, 'Vehicle admin'),
    driver = await createEmployee(testApp, 'Vehicle driver');
  const department = await org.createDepartment(
    { title: 'Vehicle test ' + randomUUID(), managerId: head.userId },
    { actorId: admin.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: admin.userId },
  );
  await db.repository('dutyRoleMembers').createOne({
    values: {
      id: randomUUID(),
      dutyRoleCode: 'admin',
      userId: admin.userId,
      active: true,
    },
  });
  let reminderAttempts = 0;
  const reminderIds: string[] = [];
  const service = createVehicleRequestService({
    db,
    users: c.resolve(userAdministrationServiceToken),
    employees: c.resolve(employeeServiceToken),
    directory: c.resolve(approvalDirectoryServiceToken),
    calendar: c.resolve(calendarServiceToken),
    dictionaries: c.resolve(dictionaryServiceToken),
    rules: c.resolve(ruleServiceToken),
    sequences: c.resolve(sequenceServiceToken),
    audit: c.resolve(auditServiceToken),
    notifications: {
      task: async () => {},
      result: async () => {},
      alarm: async (input) => {
        reminderAttempts++;
        reminderIds.push(input.eventId);
        if (reminderAttempts === 1)
          throw new Error('temporary delivery failure');
      },
    },
  });
  await service.initialize();
  const vehicleType = (
    await c.resolve(dictionaryServiceToken).list('vehicleType')
  )[0]!.code;
  const vehicle = await db.transaction((tx) =>
    service.vehicles.create(
      {
        plateNumber: randomUUID(),
        name: 'Van',
        vehicleType,
        capacity: 4,
        status: 'active',
        actorId: admin.userId,
        reason: 'Vehicle roster',
      },
      tx,
    ),
  );
  const driverRow = await db.transaction((tx) =>
    service.vehicles.setDriver(
      {
        employeeId: driver.employeeId,
        active: true,
        actorId: admin.userId,
        reason: 'Driver roster',
      },
      tx,
    ),
  );
  const draft = await service.create(
      {
        purpose: 'Business visit',
        destination: 'Customer',
        startAt: '2026-10-16T01:00:00Z',
        endAt: '2026-10-16T02:00:00Z',
        passengers: 3,
        needsDriver: true,
      },
      owner.userId,
    ),
    id = String(draft.record.id);
  await service.transition(
    id,
    'submit',
    owner.userId,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  let completedCommand: Omit<PerformInput, 'actor'> | undefined;
  let dispatchPayload: JsonObject = {};
  const action = async (
    actor: string,
    name: string,
    payload = {},
    key = randomUUID(),
  ) => {
    const detail = await service.detail(id, actor),
      offer = detail.taskActions.find((a) =>
        a.actions.some((o) => o.name === name),
      );
    if (!offer) throw new Error('No offer ' + name);
    const run = detail.runs.find((r) =>
      r.tasks.some((t) => t.id === offer.task.id),
    )!;
    const command = {
      target: { taskId: offer.task.id },
      action: name,
      contentHash: run.run.contentHash,
      requestId: key,
    };
    if (name === 'complete') {
      completedCommand = command;
      dispatchPayload = payload;
    }
    return service.action(id, command, actor, payload);
  };
  await action(head.userId, 'approve');
  expect((await service.detail(id, owner.userId)).record.status).toBe(
    'dispatch',
  );
  await action(admin.userId, 'claim');
  const candidates = await service.dispatchCandidates(id, admin.userId);
  expect(candidates.vehicles.map((v) => v.id)).toContain(vehicle.id);
  await action(admin.userId, 'complete', {
    vehicleId: vehicle.id,
    driverId: driverRow.id,
  });
  await service.action(id, completedCommand!, admin.userId, dispatchPayload);
  await expect(
    service.action(id, completedCommand!, admin.userId, {
      ...dispatchPayload,
      vehicleId: 'changed',
    }),
  ).rejects.toMatchObject({ code: 'VEHICLE_REQUEST_REUSED' });
  const calendar = c.resolve(calendarServiceToken),
    bucket = calendar.addWorkdays(
      calendar.localDate(new Date('2026-10-16T02:00:00Z')),
      2,
    );
  const beforeDue = calendar.resolveLocalDateTime(
    calendar.addWorkdays(
      calendar.localDate(new Date('2026-10-16T02:00:00Z')),
      1,
    ),
    '23:59',
  );
  await service.maintenance(beforeDue);
  expect(reminderAttempts).toBe(0);
  const remindAt = calendar.resolveLocalDateTime(bucket, '23:59');
  await expect(service.maintenance(remindAt)).rejects.toThrow(
    'temporary delivery failure',
  );
  await service.maintenance(remindAt);
  await service.maintenance(remindAt);
  expect(reminderAttempts).toBe(2);
  expect(reminderIds[0]).toBe(reminderIds[1]);
  const usage = await service.detail(id, owner.userId);
  expect(usage.record.status).toBe('usage');
  await expect(
    service.transition(
      id,
      'withdraw',
      owner.userId,
      usage.record.lifecycleVersion,
      randomUUID(),
    ),
  ).rejects.toThrow();
  await expect(
    service.transition(
      id,
      'terminate',
      admin.userId,
      usage.record.lifecycleVersion,
      randomUUID(),
      { reason: 'erase' },
    ),
  ).rejects.toThrow();
  await action(owner.userId, 'registerUsage', {
    mileage: 50,
    fuelCents: 98765,
    exception: '',
  });
  const completed = await service.detail(id, owner.userId);
  expect(completed.record.status).toBe('completed');
  await service.maintenance(
    new Date(remindAt.getTime() + 4 * 24 * 60 * 60 * 1000),
  );
  expect(reminderAttempts).toBe(2);
  expect(JSON.stringify(completed)).not.toContain('98765');
  expect(
    await db.repository('vehicleUses').count({ filter: { sourceId: id } }),
  ).toBe(1);
  expect(
    await db
      .repository('vehicleUsageReceipts')
      .count({ filter: { sourceId: id } }),
  ).toBe(1);
});

test('public administrative reassignment moves head and dispatch tasks with audit, while applicant usage remains blocked for departure', async ({
  testApp,
}) => {
  const { vehicleRequestServiceToken } =
    await import('../../../server/providers/vehicles/index.js');
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    service = c.resolve(vehicleRequestServiceToken);
  const owner = await createEmployee(testApp, 'Reassign vehicle owner'),
    head = await createEmployee(testApp, 'Reassign vehicle head'),
    replacement = await createEmployee(testApp, 'Reassign vehicle successor'),
    admin = await createEmployee(testApp, 'Reassign vehicle administrator');
  await org.addDutyRoleMember('admin', admin.userId, { actorId: admin.userId });
  const administratorId = (await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS))
    .user.id;
  const department = await org.createDepartment(
    { title: 'Vehicle reassignment ' + randomUUID(), managerId: head.userId },
    { actorId: admin.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: admin.userId },
  );
  const vehicleType = (
    await c.resolve(dictionaryServiceToken).list('vehicleType')
  )[0]!.code;
  const vehicle = await db.transaction((tx) =>
    service.vehicles.create(
      {
        plateNumber: randomUUID(),
        name: 'Reassignment car',
        vehicleType,
        capacity: 4,
        status: 'active',
        actorId: admin.userId,
        reason: 'Vehicle roster',
      },
      tx,
    ),
  );
  const draft = await service.create(
      {
        purpose: 'Reassigned visit',
        destination: 'Customer',
        startAt: '2026-10-23T01:00:00Z',
        endAt: '2026-10-23T02:00:00Z',
        passengers: 2,
        needsDriver: false,
      },
      owner.userId,
    ),
    id = String(draft.record.id);
  await service.transition(
    id,
    'submit',
    owner.userId,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  let detail = await service.detail(id, administratorId),
    task = detail.runs.at(-1)!.tasks.find((t) => t.assigneeId === head.userId)!;
  const command = {
    target: { taskId: task.id },
    action: 'reassign',
    input: { to: replacement.userId, override: false },
    comment: 'Real departure handover',
    requestId: randomUUID(),
  };
  const auditSpy = vi
    .spyOn(c.resolve(auditServiceToken), 'record')
    .mockRejectedValueOnce(new Error('reassignment audit failed'));
  await expect(service.action(id, command, administratorId)).rejects.toThrow(
    'reassignment audit failed',
  );
  auditSpy.mockRestore();
  expect(
    (await service.detail(id, head.userId)).taskActions.some(
      (o) =>
        o.task.id === task.id && o.actions.some((a) => a.name === 'approve'),
    ),
  ).toBe(true);
  await service.action(id, command, administratorId);
  await service.action(id, command, administratorId);
  expect(
    await db
      .repository('auditLogs')
      .count({ filter: { targetId: id, action: 'vehicle.reassign' } }),
  ).toBe(1);
  detail = await service.detail(id, replacement.userId);
  task = detail.taskActions.find((o) =>
    o.actions.some((a) => a.name === 'approve'),
  )!.task;
  await service.action(
    id,
    {
      target: { taskId: task.id },
      action: 'approve',
      contentHash: detail.runs.at(-1)!.run.contentHash,
      requestId: randomUUID(),
    },
    replacement.userId,
  );
  detail = await service.detail(id, admin.userId);
  task = detail.taskActions.find((o) =>
    o.actions.some((a) => a.name === 'claim'),
  )!.task;
  await service.action(
    id,
    {
      target: { taskId: task.id },
      action: 'claim',
      contentHash: detail.runs.at(-1)!.run.contentHash,
      requestId: randomUUID(),
    },
    admin.userId,
  );
  await org.addDutyRoleMember('admin', replacement.userId, {
    actorId: admin.userId,
  });
  detail = await service.detail(id, administratorId);
  task = detail.runs
    .at(-1)!
    .tasks.find(
      (t) =>
        t.assigneeId === admin.userId &&
        !['completed', 'transferred', 'cancelled'].includes(t.status),
    )!;
  await service.action(
    id,
    { ...command, target: { taskId: task.id }, requestId: randomUUID() },
    administratorId,
  );
  expect(
    await db
      .repository('auditLogs')
      .count({ filter: { targetId: id, action: 'vehicle.reassign' } }),
  ).toBe(2);
  detail = await service.detail(id, replacement.userId);
  const claimOffer = detail.taskActions.find((o) =>
    o.actions.some((a) => a.name === 'claim'),
  );
  if (claimOffer)
    await service.action(
      id,
      {
        target: { taskId: claimOffer.task.id },
        action: 'claim',
        contentHash: detail.runs.at(-1)!.run.contentHash,
        requestId: randomUUID(),
      },
      replacement.userId,
    );
  detail = await service.detail(id, replacement.userId);
  task = detail.taskActions.find((o) =>
    o.actions.some((a) => a.name === 'complete'),
  )!.task;
  await service.action(
    id,
    {
      target: { taskId: task.id },
      action: 'complete',
      contentHash: detail.runs.at(-1)!.run.contentHash,
      requestId: randomUUID(),
    },
    replacement.userId,
    { vehicleId: vehicle.id, driverId: null },
  );
  detail = await service.detail(id, owner.userId);
  task = detail.runs.at(-1)!.tasks.find((t) => t.assigneeId === owner.userId)!;
  await expect(
    service.action(
      id,
      { ...command, target: { taskId: task.id }, requestId: randomUUID() },
      administratorId,
    ),
  ).rejects.toThrow();
  expect((await service.detail(id, owner.userId)).record.status).toBe('usage');
  expect(
    await db.repository('vehicleUses').count({ filter: { sourceId: id } }),
  ).toBe(1);
});
