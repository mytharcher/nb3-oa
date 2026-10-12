import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection } from '@nocobase/db';
import type { BudgetAccount } from '../budgets/contract.js';
export type ExpenseSourceKind = 'oa.expensePlan' | 'oa.travel' | 'oa.training';
export interface ExpenseAuthorization {
  budgetMode: 'reserved' | 'none';
  departmentId: string | null;
  year: number | null;
  subject: string | null;
  id: string;
  sourceKind: ExpenseSourceKind;
  sourceId: string;
  applicantId: string;
  sourceReference: string;
  grantedCents: number;
  issuedAt: Date;
  deadline: string;
  state: 'open' | 'closed' | 'expired';
  version: number;
}
export interface ExpenseClaim {
  id: string;
  authorizationId: string;
  reimbursementId: string;
  cents: number;
  state: 'pending' | 'paid' | 'cancelled';
  overrunReason: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface ExpenseCommand {
  actorId: string;
  reason: string;
  requestKey: string;
  now?: Date;
}
export interface ExpenseAuthorizationService {
  listFor(
    applicantId: string,
    connection?: DatabaseConnection,
  ): Promise<ExpenseAuthorization[]>;
  issue(
    input: (
      | (BudgetAccount & { budgetMode?: 'reserved' })
      | {
          budgetMode?: 'none';
          departmentId?: never;
          year?: never;
          subject?: never;
        }
    ) &
      ExpenseCommand & {
        sourceKind: ExpenseSourceKind;
        id?: string;
        sourceId: string;
        applicantId: string;
        grantedCents: number;
      },
    connection: DatabaseConnection,
  ): Promise<ExpenseAuthorization>;
  get(
    id: string,
    connection?: DatabaseConnection,
  ): Promise<ExpenseAuthorization | null>;
  claims(id: string, connection?: DatabaseConnection): Promise<ExpenseClaim[]>;
  reserveClaim(
    input: ExpenseCommand & {
      authorizationId: string;
      applicantId: string;
      reimbursementId: string;
      cents: number;
      overrunReason?: string;
    },
    connection: DatabaseConnection,
  ): Promise<ExpenseClaim>;
  /** Revision updates only a pending claim; its applicant/source authorization link is immutable. */
  adjustClaim(
    input: ExpenseCommand & {
      authorizationId: string;
      applicantId: string;
      reimbursementId: string;
      cents: number;
      overrunReason?: string;
    },
    connection: DatabaseConnection,
  ): Promise<ExpenseClaim>;
  cancelClaim(
    input: ExpenseCommand & {
      authorizationId: string;
      reimbursementId: string;
    },
    connection: DatabaseConnection,
  ): Promise<ExpenseClaim>;
  settleClaim(
    input: ExpenseCommand & {
      authorizationId: string;
      reimbursementId: string;
    },
    connection: DatabaseConnection,
  ): Promise<ExpenseClaim>;
  close(
    input: ExpenseCommand & { authorizationId: string },
    connection: DatabaseConnection,
  ): Promise<ExpenseAuthorization>;
  expireDue(now?: Date): Promise<{ expired: number; pending: number }>;
}
export const expenseAuthorizationServiceToken =
  createServiceToken<ExpenseAuthorizationService>(
    'oa/expense-authorization-service',
  );
