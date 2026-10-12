import type {
  ApprovalService,
  PerformInput,
} from '@nocobase/app-plugin-approval/server';
import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { JsonObject, LifecycleRecord } from '@nocobase/lifecycle';
export const LOAN_REQUEST_LIFECYCLE = 'oa.loan';
export interface LoanRequestRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  reason: string;
  amountCents: number;
  dueDate: string;
  travelId: string | null;
  departmentId: string | null;
  ruleSnapshot: JsonObject | null;
  quotaSnapshot: JsonObject | null;
  managerApproverId: string | null;
  headApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  gmMerged: JsonObject | null;
  heldCents: number;
  paymentAccount: JsonObject | null;
  paymentVoucher: string | null;
  approvalGrantedAt: string | null;
  paidAt: string | null;
  returnDueDate: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export type LoanRequestInput = Pick<
  LoanRequestRecord,
  'reason' | 'amountCents' | 'dueDate' | 'travelId'
>;
export interface LoanRequestService {
  /** Public maintenance facade for departure task reassignment; mutation stays in this module's lifecycle. */
  readonly approvals: Pick<
    ApprovalService,
    'tasksOf' | 'runsFor' | 'actionsOf'
  >;
  action(
    recordId: string,
    input: Omit<PerformInput, 'actor'>,
    actorId: string,
    policy?: RepositoryPolicy,
  ): Promise<unknown>;

  /** Authorized public list for approval-center composition; private bank snapshots are redacted. */
  list(
    actorId: string,
    view: string,
    policy?: RepositoryPolicy,
  ): Promise<
    (LoanRequestRecord & {
      applicant: { id: string; name: string } | null;
      paymentAccount: null;
    })[]
  >;

  /** Travel final cancellation joins this transaction: pending applications terminate; paid outstanding debt becomes due without changing immutable ledger facts. */
  markReturnDue(
    input: {
      travelId: string;
      actorId: string;
      reason: string;
      requestKey: string;
      now?: Date;
    },
    connection: DatabaseConnection,
  ): Promise<{ terminated: string[]; returnDue: string[] }>;
}
export const loanRequestServiceToken = createServiceToken<LoanRequestService>(
  'oa/loan-request-service',
);
