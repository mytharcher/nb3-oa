import type { DatabaseConnection } from '@nocobase/db';
import type { LifecycleRecord } from '@nocobase/lifecycle';
import { createServiceToken } from '@nocobase/service-provider';

export const DEPARTURE_LIFECYCLE = 'oa.departure';
export interface DepartureRecord extends LifecycleRecord {
  id: string;
  employeeId: string;
  applicantId: string;
  createdById: string;
  departureType: string;
  reason: string;
  expectedLastWorkingDay: string | null;
  handoverUserId: string | null;
  sourceProbationId: string | null;
  sourceKey: string | null;
  number: string | null;
  lastWorkingDay: string | null;
  settlementDate: string | null;
  settlementNote: string | null;
  departmentId: string | null;
  managerApproverId: string | null;
  headApproverId: string | null;
  gmApproverId: string | null;
  gradeRank: number | null;
  ruleSnapshot: import('@nocobase/lifecycle').JsonObject | null;
  headMerged: import('@nocobase/lifecycle').JsonObject | null;
  originalEmployeeStatus?: 'probation' | 'regular' | null;
  cancellationRequestedById?: string | null;
  cancellationFromStatus?: string | null;
  cancellationReason?: string | null;
  hrInterviewCompleted: boolean;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export interface DepartureCreateInput {
  employeeId?: string;
  departureType: string;
  reason: string;
  expectedLastWorkingDay?: string | null;
  handoverUserId?: string | null;
}
/** A missing adapter blocks normal clearance; an empty synthetic ledger is never evidence. */
export interface DepartureAssetClearance {
  assertAllReturned(
    employeeId: string,
    connection: DatabaseConnection,
  ): Promise<void>;
}
export const departureAssetClearanceToken =
  createServiceToken<DepartureAssetClearance>('oa/departure-asset-clearance');
export type DepartureService = ReturnType<
  typeof import('./service.js').createDepartureService
>;
export const departureServiceToken = createServiceToken<DepartureService>(
  'oa/departure-service',
);
export interface DepartureFinancialClearance {
  assertReimbursementsCleared(
    applicantId: string,
    connection: DatabaseConnection,
  ): Promise<void>;
}
export const departureFinancialClearanceToken =
  createServiceToken<DepartureFinancialClearance>(
    'oa/departure-financial-clearance',
  );
export const DEPARTURE_WORK_LIFECYCLE = 'oa.departureWork';
export const DEPARTURE_WORK_KINDS = ['work', 'it', 'admin', 'finance'] as const;
export type DepartureWorkKind = (typeof DEPARTURE_WORK_KINDS)[number];
export interface DepartureWorkRecord extends LifecycleRecord {
  id: string;
  departureId: string;
  employeeId: string;
  applicantId: string;
  kind: DepartureWorkKind;
  managerId: string | null;
  receiverId: string | null;
  claimedById: string | null;
  checklistConfirmed: boolean;
  receiverAcknowledged: boolean;
  forcedById: string | null;
  forceReason: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
/** SDK reassign commits each stay separately; retries must visit every registered business service. */
export interface DepartureApprovalReassignment {
  reassign(input: {
    from: string;
    to: string;
    reason: string;
    requestKey: string;
  }): Promise<{ remaining: number }>;
}
export const departureApprovalReassignmentToken =
  createServiceToken<DepartureApprovalReassignment>(
    'oa/departure-approval-reassignment',
  );
export const DEPARTURE_EXECUTION_LIFECYCLE = 'oa.departureExecution';
export interface DepartureExecutionRecord extends LifecycleRecord {
  id: string;
  departureId: string;
  employeeId: string;
  applicantId: string;
  managerId: string | null;
  lastWorkingDay: string;
  status: string;
  lifecycleVersion: number;
  failureCode: string | null;
  createdAt: string;
}

/** Every physical custody owner contributes a same-transaction final departure guard. */
export interface DepartureCustodyClearance {
  register(
    name: string,
    check: (
      employeeId: string,
      connection: DatabaseConnection,
    ) => Promise<void>,
  ): void;
  assertCleared(
    employeeId: string,
    connection: DatabaseConnection,
  ): Promise<void>;
}
export const departureCustodyClearanceToken =
  createServiceToken<DepartureCustodyClearance>(
    'oa/departure-custody-clearance',
  );
