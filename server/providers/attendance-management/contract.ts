import { createServiceToken } from '@nocobase/service-provider';
import type {
  DatabaseConnection,
  RepositoryRecord,
  RepositoryPolicy,
} from '@nocobase/db';
import type { ShiftDefinition } from './shift.js';
export interface ShiftPointer extends RepositoryRecord {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  currentRevision: number;
  version: number;
}
export interface ShiftRevision extends RepositoryRecord, ShiftDefinition {
  id: string;
  shiftId: string;
  revision: number;
  actorId: string;
  createdAt: string;
}
export interface SchedulePointer extends RepositoryRecord {
  id: string;
  departmentId: string;
  date: string;
  currentRevisionId: string;
  version: number;
}
export interface ScheduleRevision extends RepositoryRecord {
  id: string;
  scheduleId: string;
  revision: number;
  shiftRevisionId: string | null;
  restDay: boolean;
  actorId: string;
  reason: string;
  createdAt: string;
}
export interface ShiftListInput {
  page: number;
  pageSize: number;
  search?: string;
  enabled?: 'all' | 'true' | 'false';
  sort?: 'code' | 'name' | 'currentRevision';
  direction?: 'asc' | 'desc';
}
export interface AttendanceWritePolicies {
  pointer: RepositoryPolicy;
  revision: RepositoryPolicy;
}
export interface AttendanceManagementService {
  saveShift(
    input: {
      id?: string;
      code: string;
      definition: ShiftDefinition;
      enabled: boolean;
      expectedVersion: number | null;
      actorId: string;
      reason: string;
    },
    connection: DatabaseConnection,
    policies?: AttendanceWritePolicies,
  ): Promise<{ shift: ShiftPointer; revision: ShiftRevision }>;
  saveSchedule(
    input: {
      departmentId: string;
      date: string;
      shiftRevisionId: string | null;
      restDay: boolean;
      expectedVersion: number | null;
      actorId: string;
      reason: string;
    },
    connection: DatabaseConnection,
    policies?: AttendanceWritePolicies,
  ): Promise<SchedulePointer>;
  shiftRevision(
    id: string,
    connection: DatabaseConnection,
  ): Promise<ShiftRevision | undefined>;
  /** Policy-scoped reads for administrative HTTP composition; no unrestricted list facade. */
  listShifts(
    input: ShiftListInput,
    connection: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<{ items: Partial<ShiftPointer>[]; total: number }>;
  schedule(
    departmentId: string,
    date: string,
    connection: DatabaseConnection,
    policies: { current: RepositoryPolicy; revision: RepositoryPolicy },
    revisionNumber?: number,
  ): Promise<
    | { current: Partial<SchedulePointer>; revision: Partial<ScheduleRevision> }
    | undefined
  >;
}
export const attendanceManagementServiceToken =
  createServiceToken<AttendanceManagementService>(
    'oa/attendance-management-service',
  );
