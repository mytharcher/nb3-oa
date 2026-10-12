import type { DatabaseConnection } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
export const FINANCE_ASSIGNMENTS_SETTINGS = 'oa.financeAssignments';
export interface FinanceAssignment {
  id: string;
  departmentId: string;
  accountantId: string;
  active: boolean;
  version: number;
  updatedAt: Date;
}
export interface FinanceAssignmentQuery {
  departmentId?: string;
  active?: boolean;
  page: number;
  pageSize: number;
  order: 'asc' | 'desc';
}
export interface FinanceAssignmentService {
  list(
    query: FinanceAssignmentQuery,
    connection?: DatabaseConnection,
  ): Promise<{
    data: FinanceAssignment[];
    meta: { page: number; pageSize: number; total: number };
  }>;
  get(
    id: string,
    connection?: DatabaseConnection,
  ): Promise<FinanceAssignment | null>;
  candidates(connection?: DatabaseConnection): Promise<readonly string[]>;
  create(
    input: {
      departmentId: string;
      accountantId: string;
      actorId: string;
      reason: string;
    },
    connection: DatabaseConnection,
  ): Promise<FinanceAssignment>;
  update(
    id: string,
    input: {
      accountantId?: string;
      active?: boolean;
      version: number;
      actorId: string;
      reason: string;
    },
    connection: DatabaseConnection,
  ): Promise<FinanceAssignment>;
  /** Fresh department/role membership resolved within the caller's approval transaction. */
  resolve(
    departmentId: string,
    applicantId: string,
    connection: DatabaseConnection,
  ): Promise<string | undefined>;
}
export const financeAssignmentServiceToken =
  createServiceToken<FinanceAssignmentService>('oa/finance-assignment-service');
