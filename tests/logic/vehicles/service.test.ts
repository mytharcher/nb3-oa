// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createPlatformAppTest } from '../platform/helpers.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { createVehicleService } from '../../../server/providers/vehicles/service.js';
import type {
  VehicleIntent,
  VehicleSource,
} from '../../../server/providers/vehicles/contract.js';
const test = createPlatformAppTest();
test('real dispatch facts enforce capacity, driver intervals, adjacent bookings, command identity and private amounts', async ({
  app,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken),
    dictionaries = c.resolve(dictionaryServiceToken);
  const intents = new Map<string, VehicleIntent>();
  const source: VehicleSource = {
    async intent(id, actor) {
      const i = intents.get(id);
      if (!i || !['admin', i.applicantId].includes(actor))
        throw new Error('source denied');
      return i;
    },
  };
  const service = createVehicleService({
    audit,
    dictionaries,
    source,
    // This test supplies synthetic source identities; real main composition uses shared user locks.
    lockCustody: async () => {},
    activeDriver: async (id) => id === 'real-driver',
  });
  const category = (await dictionaries.list('vehicleType'))[0]!.code;
  const vehicle = await db.transaction(async (tx) =>
    service.create(
      {
        plateNumber: randomUUID(),
        name: 'Van',
        vehicleType: category,
        capacity: 4,
        status: 'active',
        actorId: 'admin',
        reason: 'Actual car',
      },
      tx,
    ),
  );
  const second = await db.transaction(async (tx) =>
    service.create(
      {
        plateNumber: randomUUID(),
        name: 'Second',
        vehicleType: category,
        capacity: 4,
        status: 'active',
        actorId: 'admin',
        reason: 'Actual car',
      },
      tx,
    ),
  );
  const driver = await db.transaction(async (tx) =>
    service.setDriver(
      {
        employeeId: 'real-driver',
        active: true,
        actorId: 'admin',
        reason: 'Qualified driver',
      },
      tx,
    ),
  );
  const add = (
    startAt = '2026-10-12T01:00:00Z',
    endAt = '2026-10-12T02:00:00Z',
  ) => {
    const sourceId = randomUUID();
    intents.set(sourceId, {
      sourceId,
      applicantId: 'applicant',
      startAt,
      endAt,
      passengers: 3,
      needsDriver: true,
    });
    return {
      sourceId,
      actorId: 'admin',
      requestKey: randomUUID(),
      reason: 'Approved dispatch',
      vehicleId: vehicle.id,
      driverId: driver.id,
    };
  };
  const command = add();
  const fact = await db.transaction(async (tx) =>
    service.dispatch(command, tx),
  );
  expect(
    await db.transaction(async (tx) => service.dispatch(command, tx)),
  ).toEqual(fact);
  await expect(
    db.transaction(async (tx) =>
      service.dispatch({ ...command, vehicleId: second.id }, tx),
    ),
  ).rejects.toMatchObject({ code: 'VEHICLE_REQUEST_REUSED' });
  await expect(
    db.transaction(async (tx) =>
      service.dispatch({ ...add(), vehicleId: second.id }, tx),
    ),
  ).rejects.toMatchObject({ code: 'VEHICLE_INTERVAL_CONFLICT' });
  await expect(
    db.transaction(async (tx) =>
      service.update(
        vehicle.id,
        {
          ...vehicle,
          version: 2,
          status: 'maintenance',
          actorId: 'admin',
          reason: 'Servicing',
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'VEHICLE_OUTSTANDING_USE' });
  const adjacent = add('2026-10-12T02:00:00Z', '2026-10-12T03:00:00Z');
  expect(
    await db.transaction(async (tx) => service.dispatch(adjacent, tx)),
  ).toMatchObject({ sourceId: adjacent.sourceId });
  const concurrentA = add('2026-10-13T01:00:00Z', '2026-10-13T02:00:00Z'),
    concurrentB = add('2026-10-13T01:30:00Z', '2026-10-13T02:30:00Z');
  const race = await Promise.allSettled([
    db.transaction((tx) => service.dispatch(concurrentA, tx)),
    db.transaction((tx) => service.dispatch(concurrentB, tx)),
  ]);
  expect(race.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const usage = {
    ...command,
    actorId: 'applicant',
    requestKey: randomUUID(),
    reason: 'Actual use',
    mileage: 25,
    fuelCents: 12000,
    exception: '',
  };
  const receipt = await db.transaction(async (tx) =>
    service.registerUsage(usage, tx),
  );
  expect(receipt).not.toHaveProperty('fuelCents');
  expect(
    await db.transaction(async (tx) => service.registerUsage(usage, tx)),
  ).toEqual(receipt);
  const log = await db
    .repository('auditLogs')
    .findOne({ filter: { targetId: receipt.id } });
  expect(JSON.stringify(log)).not.toContain('12000');
  expect(
    await db
      .repository('vehicleUses')
      .count({ filter: { sourceId: command.sourceId } }),
  ).toBe(1);
  const cost = await db
    .repository('vehicleUsageCosts')
    .findOne({ filter: { id: receipt.id } });
  expect(Number(cost?.fuelCents)).toBe(12000);
});
test('missing sources, invalid drivers and audit failure fail closed without immutable facts', async ({
  app,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken),
    dictionaries = c.resolve(dictionaryServiceToken);
  const service = createVehicleService({
    audit,
    dictionaries,
    activeDriver: async () => false,
  });
  await expect(
    db.transaction(async (tx) =>
      service.dispatch(
        {
          sourceId: 'forged',
          actorId: 'admin',
          requestKey: 'key',
          reason: 'reason',
          vehicleId: 'forged',
          driverId: null,
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'VEHICLE_SOURCE_UNAVAILABLE' });
  await expect(
    db.transaction(async (tx) =>
      service.setDriver(
        {
          employeeId: 'arbitrary-user',
          active: true,
          actorId: 'admin',
          reason: 'reason',
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'VEHICLE_DRIVER_INACTIVE' });
  const broken = createVehicleService({
    audit: {
      ...audit,
      record: async () => {
        throw new Error('audit unavailable');
      },
    },
    dictionaries,
    activeDriver: async () => false,
  });
  const plateNumber = randomUUID();
  const vehicleType = (await dictionaries.list('vehicleType'))[0]!.code;
  await expect(
    db.transaction(async (tx) =>
      broken.create(
        {
          plateNumber,
          name: 'Vehicle',
          vehicleType,
          capacity: 4,
          status: 'active',
          actorId: 'admin',
          reason: 'reason',
        },
        tx,
      ),
    ),
  ).rejects.toThrow('audit unavailable');
  expect(
    await db.repository('vehicles').count({ filter: { plateNumber } }),
  ).toBe(0);
});
