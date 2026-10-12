import type { DatabaseConnection } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';

export interface Loan {
  id: string;
  sourceId: string;
  applicantId: string;
  principalCents: number;
  dueDate: string;
  issuedAt: Date;
  version: number;
}
export interface LoanBalance extends Loan {
  repaidCents: number;
  heldCents: number;
  outstandingCents: number;
  availableCents: number;
}
export interface LoanCommand {
  actorId: string;
  reason: string;
  requestKey: string;
  now?: Date;
}
export interface LoanReservation {
  id: string;
  loanId: string;
  reference: string;
  kind: 'reimbursement' | 'cash';
  cents: number;
  state: 'pending' | 'settled' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
export interface LoanLedgerService {
  issue(
    input: LoanCommand & {
      sourceId: string;
      applicantId: string;
      principalCents: number;
      dueDate: string;
    },
    connection: DatabaseConnection,
  ): Promise<LoanBalance>;
  get(id: string, connection?: DatabaseConnection): Promise<LoanBalance | null>;
  listFor(
    applicantId: string,
    connection?: DatabaseConnection,
  ): Promise<LoanBalance[]>;
  reserveOffset(
    input: LoanCommand & {
      loanId: string;
      applicantId: string;
      reimbursementId: string;
      cents: number;
    },
    connection: DatabaseConnection,
  ): Promise<LoanReservation>;
  settleOffset(
    input: LoanCommand & { loanId: string; reimbursementId: string },
    connection: DatabaseConnection,
  ): Promise<LoanReservation>;
  releaseOffset(
    input: LoanCommand & { loanId: string; reimbursementId: string },
    connection: DatabaseConnection,
  ): Promise<LoanReservation>;
  recordCashRepayment(
    input: LoanCommand & { loanId: string; receiptId: string; cents: number },
    connection: DatabaseConnection,
  ): Promise<LoanReservation>;
  confirmCashRepayment(
    input: LoanCommand & { loanId: string; receiptId: string },
    connection: DatabaseConnection,
  ): Promise<LoanReservation>;
  cancelCashRepayment(
    input: LoanCommand & { loanId: string; receiptId: string },
    connection: DatabaseConnection,
  ): Promise<LoanReservation>;
}
export const loanLedgerServiceToken = createServiceToken<LoanLedgerService>(
  'oa/loan-ledger-service',
);
