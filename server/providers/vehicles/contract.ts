import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
export interface Vehicle {
  id: string;
  plateNumber: string;
  name: string;
  vehicleType: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  version: number;
}
export interface Driver {
  id: string;
  employeeId: string;
  active: boolean;
  version: number;
}
export interface VehicleIntent {
  sourceId: string;
  applicantId: string;
  startAt: string;
  endAt: string;
  passengers: number;
  needsDriver: boolean;
}
/** Must lock the real lifecycle source, validate current allowed task/action and field policy in this TX. */
export interface VehicleSource {
  intent(
    sourceId: string,
    actorId: string,
    phase: 'dispatch' | 'usage',
    tx: DatabaseConnection,
  ): Promise<VehicleIntent>;
}
export interface VehicleCommand {
  sourceId: string;
  actorId: string;
  requestKey: string;
  reason: string;
}
export interface DispatchCommand extends VehicleCommand {
  vehicleId: string;
  driverId: string | null;
}
export interface VehicleUse extends VehicleIntent {
  id: string;
  vehicleId: string;
  driverId: string | null;
  dispatchedById: string;
  createdAt: string;
}
export interface UsageCommand extends VehicleCommand {
  mileage: number;
  fuelCents: number;
  exception: string;
}
export interface VehicleDependencies {
  source?: VehicleSource;
  /** Shared account lock with final departure execution; recheck identities after locking. */
  lockCustody?(
    applicantId: string,
    driverEmployeeId: string | null,
    tx: DatabaseConnection,
  ): Promise<void>;
  employeeUserId?(employeeId: string, tx: DatabaseConnection): Promise<string>;
  activeDriver(employeeId: string, tx: DatabaseConnection): Promise<boolean>;
}
export const vehicleSourceToken =
  createServiceToken<VehicleSource>('oa/vehicle-source');
export const vehicleServiceToken =
  createServiceToken<VehicleService>('oa/vehicle-service');
export interface VehicleService {
  /** Trusted integration only; not an HTTP permission bypass or physical-return certificate. */
  outstandingFor(
    employeeId: string,
    tx: DatabaseConnection,
  ): Promise<
    readonly { useId: string; sourceId: string; role: 'applicant' | 'driver' }[]
  >;
  assertDepartureCleared(
    employeeId: string,
    tx: DatabaseConnection,
  ): Promise<void>;
  create(
    input: Omit<Vehicle, 'id' | 'version'> & {
      actorId: string;
      reason: string;
    },
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Vehicle>;
  update(
    id: string,
    input: Omit<Vehicle, 'id'> & { actorId: string; reason: string },
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Vehicle>;
  setDriver(
    input: {
      employeeId: string;
      active: boolean;
      version?: number;
      actorId: string;
      reason: string;
    },
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Driver>;
  dispatch(input: DispatchCommand, tx: DatabaseConnection): Promise<VehicleUse>;
  registerUsage(
    input: UsageCommand,
    tx: DatabaseConnection,
  ): Promise<{ id: string; sourceId: string }>;
  candidates(
    sourceId: string,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<{ vehicles: Vehicle[]; drivers: Driver[] }>;
}
