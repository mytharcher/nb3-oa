// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { test } from './helpers.js';
import { createEmployee, employees, ALL } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import {
  dictionaryServiceToken,
  calendarServiceToken,
} from '../../../server/providers/platform/index.js';
import { vehicleServiceToken } from '../../../server/providers/vehicles/contract.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { vehicleRequestServiceToken } from '../../../server/providers/vehicles/index.js';
import {
  departureServiceToken,
  departureCustodyClearanceToken,
} from '../../../server/providers/departure/contract.js';

test('main vehicle custody blocks normal admin clearance and final driver disable even after HR exemption, then actual applicant usage permits departure', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const lastWorkingDay = c.resolve(calendarServiceToken).localDate(new Date());
  const administrator = (await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS)).user;
  await employees(testApp).createEmployee(
    {
      userId: administrator.id,
      code: randomUUID(),
      name: 'Actual approval maintenance administrator',
      status: 'regular',
      hireDate: '2025-01-01',
    },
    ALL,
    administrator.id,
  );
  const head = await createEmployee(testApp, 'Vehicle departure head');
  const hr = await createEmployee(testApp, 'Vehicle departure HR');
  const admin = await createEmployee(testApp, 'Vehicle departure admin');
  const applicant = await createEmployee(
    testApp,
    'Vehicle remaining applicant',
  );
  const grade = await org.createGrade(
    { code: randomUUID(), title: 'Driver junior', rank: 1 },
    { actorId: hr.userId },
  );
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Actual driver position' },
    { actorId: hr.userId },
  );
  const driver = await createEmployee(testApp, 'Vehicle departing driver', {
    managerId: head.employeeId,
    gradeId: grade.id,
    positionId: position.id,
  });
  const department = await org.createDepartment(
    { title: randomUUID(), managerId: head.userId },
    { actorId: hr.userId },
  );
  for (const person of [driver, applicant])
    await org.addMember(
      { departmentId: department.id, userId: person.userId, primary: true },
      { actorId: hr.userId },
    );
  await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
  await org.addDutyRoleMember('admin', admin.userId, { actorId: hr.userId });
  const capacity = c.resolve(headcountServiceToken);
  const account = await db.transaction((tx) =>
    capacity.create(
      {
        departmentId: department.id,
        positionId: position.id,
        year: Number(lastWorkingDay.slice(0, 4)),
        limit: 1,
        actorId: hr.userId,
        reason: 'Actual driver roster',
        requestKey: randomUUID(),
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    capacity.reconcile(
      {
        accountId: account.id,
        expectedVersion: account.version,
        employeeIds: [driver.employeeId],
        actorId: hr.userId,
        reason: 'Complete real driver roster',
        requestKey: randomUUID(),
      },
      tx,
    ),
  );
  const vehicles = c.resolve(vehicleServiceToken),
    requests = c.resolve(vehicleRequestServiceToken);
  const vehicleType = (
    await c.resolve(dictionaryServiceToken).list('vehicleType')
  )[0]!.code;
  const car = await db.transaction((tx) =>
    vehicles.create(
      {
        plateNumber: randomUUID(),
        name: 'Actual custody car',
        vehicleType,
        capacity: 4,
        status: 'active',
        actorId: admin.userId,
        reason: 'Actual car',
      },
      tx,
    ),
  );
  const driverRow = await db.transaction((tx) =>
    vehicles.setDriver(
      {
        employeeId: driver.employeeId,
        active: true,
        actorId: admin.userId,
        reason: 'Actual driver',
      },
      tx,
    ),
  );
  const draft = await requests.create(
    {
      purpose: 'Business journey',
      destination: 'Customer',
      startAt: '2026-12-02T01:00:00Z',
      endAt: '2026-12-02T02:00:00Z',
      passengers: 2,
      needsDriver: true,
    },
    applicant.userId,
  );
  const vehicleId = String(draft.record.id);
  await requests.transition(
    vehicleId,
    'submit',
    applicant.userId,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  async function vehicleAction(actorId: string, action: string, payload = {}) {
    const detail = await requests.detail(vehicleId, actorId);
    const offer = detail.taskActions.find((o) =>
      o.actions.some((a) => a.name === action),
    );
    if (!offer) throw new Error('No allowed vehicle offer ' + action);
    const run = detail.runs.find((r) => r.run.id === offer.task.runId)!;
    return requests.action(
      vehicleId,
      {
        target: { taskId: offer.task.id },
        action,
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
      },
      actorId,
      payload,
    );
  }
  await vehicleAction(head.userId, 'approve');
  await vehicleAction(admin.userId, 'claim');
  await vehicleAction(admin.userId, 'complete', {
    vehicleId: car.id,
    driverId: driverRow.id,
  });
  expect(
    await db.transaction((tx) =>
      vehicles.outstandingFor(driver.employeeId, tx),
    ),
  ).toEqual([
    { useId: expect.any(String), sourceId: vehicleId, role: 'driver' },
  ]);
  expect(
    await db.transaction((tx) =>
      vehicles.outstandingFor(applicant.employeeId, tx),
    ),
  ).toEqual([
    { useId: expect.any(String), sourceId: vehicleId, role: 'applicant' },
  ]);
  await expect(
    db.transaction((tx) =>
      c
        .resolve(departureCustodyClearanceToken)
        .assertCleared(driver.employeeId, tx),
    ),
  ).rejects.toMatchObject({ code: 'VEHICLE_CUSTODY_OUTSTANDING' });
  await expect(
    db.transaction((tx) => vehicles.assertDepartureCleared('missing', tx)),
  ).rejects.toMatchObject({ code: 'VEHICLE_CUSTODY_EMPLOYEE_REQUIRED' });
  const departure = c.resolve(departureServiceToken);
  const leaving = await departure.create(
    {
      departureType: 'resignation',
      reason: 'Actual driver leaving',
      expectedLastWorkingDay: lastWorkingDay,
      handoverUserId: applicant.userId,
    },
    driver.userId,
  );
  const departureId = String(leaving.record.id);
  await departure.transition(
    departureId,
    'submit',
    driver.userId,
    Number(leaving.record.lifecycleVersion),
    randomUUID(),
  );
  async function approve(actorId: string, data?: Record<string, string>) {
    const detail = await departure.detail(departureId, actorId);
    const offer = detail.taskActions.find((o) =>
      o.actions.some((a) => a.name === 'approve'),
    )!;
    const run = detail.runs.find((r) => r.run.id === offer.task.runId)!;
    return departure.action(
      departureId,
      {
        target: { taskId: offer.task.id },
        action: 'approve',
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
        ...(data ? { input: { data } } : {}),
      },
      actorId,
    );
  }
  await approve(head.userId);
  await approve(hr.userId, { lastWorkingDay: lastWorkingDay });
  async function work(
    kind: string,
    action: string,
    actorId: string,
    input = {},
  ) {
    const item = (await departure.detail(departureId, actorId)).workItems.find(
      (r) => r.kind === kind,
    )!;
    return departure.workAction(
      departureId,
      String(item.id),
      action,
      actorId,
      Number(item.lifecycleVersion),
      randomUUID(),
      input,
    );
  }
  await work('admin', 'claim', admin.userId);
  await work('admin', 'confirmChecklist', admin.userId, { confirmed: true });
  await expect(work('admin', 'complete', admin.userId)).rejects.toMatchObject({
    code: 'VEHICLE_CUSTODY_OUTSTANDING',
  });
  for (const kind of ['work', 'it', 'admin', 'finance'])
    await work(kind, 'forceComplete', hr.userId, {
      reason: 'Explicit HR exemption, actual vehicle obligation preserved',
    });
  const fresh = await departure.detail(departureId, hr.userId);
  await departure.transition(
    departureId,
    'settle',
    hr.userId,
    Number(fresh.record.lifecycleVersion),
    randomUUID(),
    {
      settlementDate: lastWorkingDay,
      settlementNote: 'Obligation remains recorded',
    },
  );
  const clearanceSpy = vi.spyOn(vehicles, 'assertDepartureCleared');
  await departure.reconcile(new Date());
  expect(clearanceSpy).toHaveBeenCalledWith(
    driver.employeeId,
    expect.anything(),
  );
  await expect(clearanceSpy.mock.results.at(-1)!.value).rejects.toMatchObject({
    code: 'VEHICLE_CUSTODY_OUTSTANDING',
  });
  clearanceSpy.mockRestore();
  expect(
    (await departure.detail(departureId, hr.userId)).execution,
  ).toMatchObject({
    status: 'blocked',
    failureCode: 'DEPARTURE_EXECUTION_FAILED',
  });
  const users = c.resolve(userAdministrationServiceToken);
  expect((await users.get(driver.userId))?.disabledAt).toBeNull();
  expect(
    (await c.resolve(employeeServiceToken).getById(driver.employeeId))?.status,
  ).toBe('leaving');
  expect(await org.membershipsOf(driver.userId)).toHaveLength(1);
  // The actual driver is not the applicant and cannot fill somebody else's usage output.
  const usage = await requests.detail(vehicleId, applicant.userId);
  const task = usage.taskActions.find((o) =>
    o.actions.some((a) => a.name === 'registerUsage'),
  )!.task;
  await expect(
    requests.action(
      vehicleId,
      {
        target: { taskId: task.id },
        action: 'registerUsage',
        contentHash: usage.runs.at(-1)!.run.contentHash,
        requestId: randomUUID(),
      },
      driver.userId,
      { mileage: 50, fuelCents: 55555, exception: '' },
    ),
  ).rejects.toThrow();
  const spy = vi
    .spyOn(c.resolve(auditServiceToken), 'record')
    .mockRejectedValueOnce(new Error('vehicle usage audit failure'));
  await expect(
    vehicleAction(applicant.userId, 'registerUsage', {
      mileage: 50,
      fuelCents: 55555,
      exception: '',
    }),
  ).rejects.toThrow('vehicle usage audit failure');
  spy.mockRestore();
  expect(
    await db
      .repository('vehicleUsageReceipts')
      .count({ filter: { sourceId: vehicleId } }),
  ).toBe(0);
  await expect(
    db.transaction((tx) =>
      vehicles.assertDepartureCleared(driver.employeeId, tx),
    ),
  ).rejects.toMatchObject({ code: 'VEHICLE_CUSTODY_OUTSTANDING' });
  await vehicleAction(applicant.userId, 'registerUsage', {
    mileage: 50,
    fuelCents: 55555,
    exception: '',
  });
  expect(
    await db.transaction((tx) =>
      vehicles.outstandingFor(driver.employeeId, tx),
    ),
  ).toEqual([]);
  expect(
    await db.transaction((tx) =>
      vehicles.outstandingFor(applicant.employeeId, tx),
    ),
  ).toEqual([]);
  await departure.reconcile(new Date());
  expect(
    (await departure.detail(departureId, hr.userId)).execution?.status,
  ).toBe('executed');
  expect((await users.get(driver.userId))?.disabledAt).not.toBeNull();
  expect(
    (await c.resolve(employeeServiceToken).getById(driver.employeeId))?.status,
  ).toBe('left');
  expect(await org.membershipsOf(driver.userId)).toEqual([]);
  expect(
    await db.transaction((tx) => capacity.balance(account.id, tx)),
  ).toMatchObject({ used: 0 });
  expect(
    JSON.stringify(await requests.detail(vehicleId, applicant.userId)),
  ).not.toContain('55555');
});
