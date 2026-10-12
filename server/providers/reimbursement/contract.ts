import type { LifecycleRecord, JsonObject } from '@nocobase/lifecycle';
export const REIMBURSEMENT_LIFECYCLE = 'oa.reimbursement';
export interface ReimbursementLine {
  id: string;
  category: string;
  date: string;
  amountCents: number;
  invoiceNumber: string;
  attachmentIds: string[];
  standardExceptionReason: string;
}
export interface FinanceLineFact {
  outcome: 'approved' | 'returned' | 'pending';
  contentHash: string;
}
export interface BusinessReviewBasis {
  /** Original self-made business approval ceiling, retained for a lower resubmitted claim. */
  limitCents: number;
  identityHash: string;
}
export interface ReimbursementRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  reason: string;
  authorizationId: string | null;
  loanId: string | null;
  bindingCaptured: boolean;
  boundAuthorizationId: string | null;
  boundLoanId: string | null;
  debtHeldCents: number;
  /** A zero-valued adjusted reservation still requires terminal settlement/release. */
  debtHoldRecorded: boolean;
  offsetCents: number;
  overrunReason: string;
  lines: ReimbursementLine[];
  totalCents: number;
  /** Previous submission amount, retained independently of an edited proposal to detect an increase. */
  lastSubmittedTotalCents: number | null;
  departmentId: string | null;
  managerId: string | null;
  headId: string | null;
  accountantId: string | null;
  executiveId: string | null;
  gmId: string | null;
  ruleSnapshot: JsonObject | null;
  standardSnapshot: JsonObject | null;
  managerReviewBasis: BusinessReviewBasis | null;
  headReviewBasis: BusinessReviewBasis | null;
  financeLineFacts: Record<string, FinanceLineFact>;
  /** Exact submitted lines for repeated edits during a single finance correction. */
  financeCorrectionLines: ReimbursementLine[];
  exceptionContentHash: string | null;
  handlingFailureReason: string | null;
  voucherNumber: string | null;
  paymentId: string | null;
  forcedReason: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export type ReimbursementInput = Pick<
  ReimbursementRecord,
  | 'reason'
  | 'authorizationId'
  | 'loanId'
  | 'offsetCents'
  | 'overrunReason'
  | 'lines'
>;
export interface ReimbursementPayee {
  requestId: string;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  version: number;
}
