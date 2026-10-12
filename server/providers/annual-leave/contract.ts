import type { DatabaseConnection } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import type { Employee } from '../employees/contract.js';
import type { AnnualLeavePolicy } from './calculation.js';
export interface AnnualLeaveAccrual {
  id: string;
  employeeId: string;
  year: number;
  units: number;
  snapshot: Record<string, unknown>;
  expiresAt: Date | string;
  grantedAt: Date | string;
}
/** Application integration supplies approved policy and verified HR seniority data. Missing data fails closed. */
export interface AnnualLeavePolicyResolver {
  policy(
    at: Date,
    connection: DatabaseConnection,
  ): Promise<AnnualLeavePolicy | null>;
  seniorityStartDate(
    employee: Employee,
    policy: AnnualLeavePolicy,
    connection: DatabaseConnection,
  ): Promise<string | null>;
}
export interface AnnualLeaveSweepResult {
  granted: number;
  existing: number;
  skipped: number;
  blocked: { employeeId: string; year: number; code: string }[];
}
export interface AnnualLeaveService {
  /** Creates one durable employee/year result, even when entitlement is zero; audit and grant share the transaction. */
  accrue(
    employeeId: string,
    year: number,
    at: Date,
    connection: DatabaseConnection,
  ): Promise<{
    status: 'granted' | 'existing' | 'skipped';
    record?: AnnualLeaveAccrual;
  }>;
  /** Daily reconciliation covers the current year only, so missing January 1 is recoverable. */
  reconcile(at?: Date): Promise<AnnualLeaveSweepResult>;
}
export const annualLeaveServiceToken = createServiceToken<AnnualLeaveService>(
  'oa/annual-leave-service',
);
export const annualLeavePolicyResolverToken =
  createServiceToken<AnnualLeavePolicyResolver>(
    'oa/annual-leave-policy-resolver',
  );
