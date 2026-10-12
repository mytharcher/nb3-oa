import { createHash, randomUUID } from 'node:crypto';
import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { DictionaryService } from '../platform/index.js';
import type {
  Driver,
  Vehicle,
  VehicleService,
  VehicleDependencies,
  VehicleCommand,
  VehicleIntent,
  VehicleUse,
} from './contract.js';
import { VehicleError } from './errors.js';
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
function fail(code: string, message: string): never {
  throw new VehicleError(code, message);
}
const checkCommand = (c: { actorId: string; reason: string }) => {
  if (!c.actorId || !c.reason?.trim() || c.reason.length > 5000)
    fail('VEHICLE_INVALID_COMMAND', 'An actor and audit reason are required.');
};
function interval(intent: VehicleIntent) {
  const start = new Date(intent.startAt),
    end = new Date(intent.endAt);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start >= end ||
    !Number.isSafeInteger(intent.passengers) ||
    intent.passengers < 1 ||
    !intent.applicantId
  )
    fail(
      'VEHICLE_INVALID_INTERVAL',
      'Provide an ordered time interval and positive passenger count.',
    );
  return { ...intent, startAt: start.toISOString(), endAt: end.toISOString() };
}
export function createVehicleService(
  d: VehicleDependencies & {
    audit: AuditService;
    dictionaries: DictionaryService;
  },
): VehicleService {
  async function outstandingFor(employeeId: string, tx: DatabaseConnection) {
    if (!d.employeeUserId)
      fail(
        'VEHICLE_CUSTODY_UNAVAILABLE',
        'Employee identity service is required.',
      );
    const userId = await d.employeeUserId(employeeId, tx);
    await lockUserForAdministration(tx, userId);
    const drivers = await tx
      .repository<Driver>('vehicleDrivers')
      .findMany({ filter: { employeeId } });
    const driverIds = new Set(drivers.map((r) => r.id));
    const result: {
      useId: string;
      sourceId: string;
      role: 'applicant' | 'driver';
    }[] = [];
    for (const use of await tx.repository<VehicleUse>('vehicleUses').findMany({
      filter: (f) =>
        f.or([
          f.string('applicantId').eq(userId),
          ...[...driverIds].map((id) => f.string('driverId').eq(id)),
        ]),
    })) {
      if (
        use.applicantId !== userId &&
        (!use.driverId || !driverIds.has(use.driverId))
      )
        continue;
      if (
        await tx
          .repository('vehicleUsageReceipts')
          .exists({ filter: { sourceId: use.sourceId } })
      )
        continue;
      result.push({
        useId: use.id,
        sourceId: use.sourceId,
        role: use.applicantId === userId ? 'applicant' : 'driver',
      });
    }
    return result;
  }
  async function lock<T extends { id: string; version: number }>(
    collection: string,
    id: string,
    tx: DatabaseConnection,
  ): Promise<T> {
    const repo = tx.repository(collection),
      row = (await repo.findOne({ filter: { id } })) as T | undefined;
    if (!row) fail('VEHICLE_NOT_FOUND', 'Vehicle or driver not found.');
    if (
      !Number.isSafeInteger(row.version) ||
      row.version >= Number.MAX_SAFE_INTEGER
    )
      fail('VEHICLE_INVALID_VERSION', 'The stored version cannot advance.');
    const result = await repo.updateMany({
      filter: { id, version: row.version },
      values: { version: row.version + 1 },
    });
    if (result.updatedCount !== 1)
      fail(
        'VEHICLE_VERSION_CONFLICT',
        'The resource changed; retry with fresh data.',
      );
    return { ...row, version: row.version + 1 };
  }
  async function validate(
    input: Omit<Vehicle, 'id' | 'version'>,
    tx: DatabaseConnection,
  ) {
    if (
      !input.plateNumber?.trim() ||
      input.plateNumber.length > 64 ||
      !input.name?.trim() ||
      input.name.length > 200 ||
      !Number.isSafeInteger(input.capacity) ||
      input.capacity < 1 ||
      !['active', 'inactive', 'maintenance'].includes(input.status)
    )
      fail(
        'VEHICLE_INVALID_INPUT',
        'Provide vehicle identification, positive capacity and a valid status.',
      );
    if (
      !(await d.dictionaries.get('vehicleType', input.vehicleType, tx))?.active
    )
      fail('VEHICLE_TYPE_INACTIVE', 'Choose an active vehicle type.');
    return {
      plateNumber: input.plateNumber.trim(),
      name: input.name.trim(),
      vehicleType: input.vehicleType,
      capacity: input.capacity,
      status: input.status,
    };
  }
  async function intent(
    c: VehicleCommand,
    phase: 'dispatch' | 'usage',
    tx: DatabaseConnection,
  ) {
    checkCommand(c);
    if (!c.sourceId || !c.requestKey || c.requestKey.length > 128)
      fail(
        'VEHICLE_INVALID_COMMAND',
        'A source and stable request key are required.',
      );
    if (!d.source)
      fail(
        'VEHICLE_SOURCE_UNAVAILABLE',
        'The real approval source adapter is unavailable.',
      );
    const result = interval(
      await d.source.intent(c.sourceId, c.actorId, phase, tx),
    );
    if (result.sourceId !== c.sourceId)
      fail(
        'VEHICLE_SOURCE_MISMATCH',
        'The command does not match its approval source.',
      );
    return result;
  }
  async function command<T>(
    c: VehicleCommand,
    phase: string,
    payload: unknown,
    tx: DatabaseConnection,
    work: () => Promise<T>,
  ): Promise<T> {
    // Source lock acquired by intent() serializes duplicate keys; do not catch unique failures inside an aborted PG transaction.
    const id = hash([c.sourceId, c.requestKey]),
      fingerprint = hash([phase, c.actorId, c.reason, payload]);
    const repo = tx.repository<{
        id: string;
        fingerprint: string;
        receipt: { value: T };
        createdAt: Date;
      }>('vehicleCommands'),
      old = await repo.findOne({ filter: { id } });
    if (old) {
      if (old.fingerprint !== fingerprint)
        fail(
          'VEHICLE_REQUEST_REUSED',
          'This request key is bound to another actor or payload.',
        );
      return old.receipt.value;
    }
    const value = await work();
    await repo.createOne({
      values: { id, fingerprint, receipt: { value }, createdAt: new Date() },
    });
    return value;
  }
  async function outstanding(
    collection: 'vehicleId' | 'driverId',
    id: string,
    tx: DatabaseConnection,
  ) {
    const uses = await tx
      .repository<VehicleUse>('vehicleUses')
      .findMany({ filter: { [collection]: id } });
    for (const use of uses)
      if (
        !(await tx
          .repository('vehicleUsageReceipts')
          .exists({ filter: { sourceId: use.sourceId } }))
      )
        return true;
    return false;
  }
  async function available(
    field: 'vehicleId' | 'driverId',
    id: string,
    i: VehicleIntent,
    tx: DatabaseConnection,
  ) {
    const rows = await tx
      .repository<VehicleUse>('vehicleUses')
      .findMany({ filter: { [field]: id } });
    return !rows.some(
      (row) =>
        new Date(row.startAt).getTime() < new Date(i.endAt).getTime() &&
        new Date(row.endAt).getTime() > new Date(i.startAt).getTime(),
    );
  }
  const audit = async (
    c: { actorId: string; reason: string },
    action: string,
    targetId: string,
    after: unknown,
    tx: DatabaseConnection,
  ) =>
    d.audit.record(
      {
        actorId: c.actorId,
        reason: c.reason,
        action,
        targetType: 'vehicles',
        targetId,
        after,
      },
      tx,
    );
  return {
    outstandingFor,
    async assertDepartureCleared(employeeId, tx) {
      if ((await outstandingFor(employeeId, tx)).length)
        fail(
          'VEHICLE_CUSTODY_OUTSTANDING',
          'Complete actual dispatched use before departure clearance.',
        );
    },
    async create(input, tx, policy) {
      checkCommand(input);
      const clean = await validate(input, tx),
        row = { ...clean, id: randomUUID(), version: 1 };
      const repo = tx.repository('vehicles');
      await (policy ? repo.withPolicy(policy) : repo).createOne({
        values: row,
      });
      await audit(input, 'vehicle.create', row.id, row, tx);
      return row;
    },
    async update(id, input, tx, policy) {
      checkCommand(input);
      const clean = await validate(input, tx),
        row = await lock<Vehicle>('vehicles', id, tx);
      if (row.version !== input.version + 1)
        fail('VEHICLE_VERSION_CONFLICT', 'Load the current vehicle version.');
      if (
        (clean.status !== 'active' || clean.capacity !== row.capacity) &&
        (await outstanding('vehicleId', id, tx))
      )
        fail(
          'VEHICLE_OUTSTANDING_USE',
          'Complete actual use before reducing capacity or disabling this vehicle.',
        );
      const repo = tx.repository('vehicles');
      if (
        policy &&
        !(
          await repo.withPolicy(policy).validateMutation({
            operation: 'updateOne',
            filter: { id },
            values: { ...clean, version: row.version },
          })
        ).valid
      )
        fail(
          'VEHICLE_ACCESS_DENIED',
          'All actual vehicle update fields must be permitted.',
        );
      const result = await (policy ? repo.withPolicy(policy) : repo).updateMany(
        { filter: { id }, values: clean },
      );
      if (result.updatedCount !== 1)
        fail(
          'VEHICLE_ACCESS_DENIED',
          'Vehicle update is outside its granted policy.',
        );
      const after = { ...row, ...clean };
      await audit(input, 'vehicle.update', id, after, tx);
      return after;
    },
    async setDriver(input, tx, policy) {
      checkCommand(input);
      if (input.active && !(await d.activeDriver(input.employeeId, tx)))
        fail(
          'VEHICLE_DRIVER_INACTIVE',
          'Choose a real active employee with an enabled account.',
        );
      const old = await tx
        .repository<Driver>('vehicleDrivers')
        .findOne({ filter: { employeeId: input.employeeId } });
      const row = old
        ? await lock<Driver>('vehicleDrivers', old.id, tx)
        : {
            id: randomUUID(),
            employeeId: input.employeeId,
            active: input.active,
            version: 1,
          };
      if (
        input.version !== undefined &&
        input.version !== (old ? row.version - 1 : 0)
      )
        fail('VEHICLE_VERSION_CONFLICT', 'Driver version changed.');
      if (!input.active && (await outstanding('driverId', row.id, tx)))
        fail(
          'VEHICLE_OUTSTANDING_USE',
          'Complete actual use before disabling this driver.',
        );
      const repo = tx.repository<Driver>('vehicleDrivers'),
        scoped = policy ? repo.withPolicy(policy) : repo;
      if (old) {
        const result = await scoped.updateMany({
          filter: { id: row.id },
          values: { active: input.active, version: row.version },
        });
        if (result.updatedCount !== 1)
          fail(
            'VEHICLE_ACCESS_DENIED',
            'Driver update is outside its granted policy.',
          );
      } else await scoped.createOne({ values: row });
      const after = {
        ...row,
        active: input.active,
        version: row.version,
      };
      await audit(input, 'vehicle.driverSet', row.id, after, tx);
      return after;
    },
    async dispatch(c, tx) {
      const i = await intent(c, 'dispatch', tx);
      return command(c, 'dispatch', [c.vehicleId, c.driverId], tx, async () => {
        if (i.needsDriver !== (c.driverId !== null))
          fail(
            'VEHICLE_DRIVER_REQUIRED',
            'Driver selection must match the approved request.',
          );
        if (!d.lockCustody)
          fail(
            'VEHICLE_CUSTODY_UNAVAILABLE',
            'Account custody locking is required.',
          );
        const selectedDriver = c.driverId
          ? await tx
              .repository<Driver>('vehicleDrivers')
              .findOne({ filter: { id: c.driverId } })
          : null;
        if (c.driverId && !selectedDriver)
          fail('VEHICLE_NOT_FOUND', 'Driver not found.');
        await d.lockCustody(
          i.applicantId,
          selectedDriver?.employeeId ?? null,
          tx,
        );
        // Shared user locks precede driver and vehicle locks. Departure holds the same user lock.
        const driver = c.driverId
          ? await lock<Driver>('vehicleDrivers', c.driverId, tx)
          : null;
        const vehicle = await lock<Vehicle>('vehicles', c.vehicleId, tx);
        if (vehicle.status !== 'active' || vehicle.capacity < i.passengers)
          fail(
            'VEHICLE_UNAVAILABLE',
            'Choose an active vehicle with enough capacity.',
          );
        if (
          driver &&
          (!driver.active || !(await d.activeDriver(driver.employeeId, tx)))
        )
          fail(
            'VEHICLE_DRIVER_INACTIVE',
            'The driver is not currently eligible.',
          );
        if (
          !(await available('vehicleId', vehicle.id, i, tx)) ||
          (driver && !(await available('driverId', driver.id, i, tx)))
        )
          fail(
            'VEHICLE_INTERVAL_CONFLICT',
            'The vehicle or driver is already dispatched in this interval.',
          );
        if (
          await tx
            .repository('vehicleUses')
            .exists({ filter: { sourceId: c.sourceId } })
        )
          fail(
            'VEHICLE_ALREADY_DISPATCHED',
            'This source already has an immutable dispatch fact.',
          );
        const row = {
          ...i,
          id: randomUUID(),
          vehicleId: vehicle.id,
          driverId: driver?.id ?? null,
          dispatchedById: c.actorId,
          createdAt: new Date().toISOString(),
        };
        await tx.repository('vehicleUses').createOne({ values: row });
        await audit(c, 'vehicle.dispatch', row.id, row, tx);
        return row;
      });
    },
    async registerUsage(c, tx) {
      const i = await intent(c, 'usage', tx);
      if (i.applicantId !== c.actorId)
        fail(
          'VEHICLE_USAGE_OWNER',
          'Only the actual applicant may register usage.',
        );
      if (
        !Number.isSafeInteger(c.mileage) ||
        c.mileage < 0 ||
        !Number.isSafeInteger(c.fuelCents) ||
        c.fuelCents < 0 ||
        typeof c.exception !== 'string' ||
        c.exception.length > 5000
      )
        fail(
          'VEHICLE_INVALID_USAGE',
          'Mileage and fuel must be exact nonnegative integers.',
        );
      return command(
        c,
        'usage',
        [c.mileage, c.fuelCents, c.exception],
        tx,
        async () => {
          if (
            !(await tx
              .repository('vehicleUses')
              .exists({ filter: { sourceId: c.sourceId } }))
          )
            fail(
              'VEHICLE_NOT_DISPATCHED',
              'No real dispatch exists for this application.',
            );
          const id = randomUUID();
          await tx.repository('vehicleUsageReceipts').createOne({
            values: {
              id,
              sourceId: c.sourceId,
              mileage: c.mileage,
              exception: c.exception,
              registeredById: c.actorId,
              createdAt: new Date(),
            },
          });
          await tx
            .repository('vehicleUsageCosts')
            .createOne({ values: { id, fuelCents: c.fuelCents } });
          await audit(
            c,
            'vehicle.usage',
            id,
            {
              sourceId: c.sourceId,
              mileage: c.mileage,
              exception: c.exception,
            },
            tx,
          );
          return { id, sourceId: c.sourceId };
        },
      );
    },
    async candidates(sourceId, actorId, tx) {
      const i = await intent(
        {
          sourceId,
          actorId,
          requestKey: 'candidateRead',
          reason: 'Authorized dispatch candidate read',
        },
        'dispatch',
        tx,
      );
      const vehicles = [],
        drivers = [];
      for (const v of await tx
        .repository<Vehicle>('vehicles')
        .findMany({ filter: { status: 'active' } }))
        if (
          v.capacity >= i.passengers &&
          (await available('vehicleId', v.id, i, tx))
        )
          vehicles.push(v);
      if (i.needsDriver)
        for (const v of await tx
          .repository<Driver>('vehicleDrivers')
          .findMany({ filter: { active: true } }))
          if (
            (await d.activeDriver(v.employeeId, tx)) &&
            (await available('driverId', v.id, i, tx))
          )
            drivers.push(v);
      return { vehicles, drivers };
    },
  };
}
