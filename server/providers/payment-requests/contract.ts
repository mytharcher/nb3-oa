import type {
  ApprovalService,
  PerformInput,
} from '@nocobase/app-plugin-approval/server';
import type { LifecycleRecord, JsonObject } from '@nocobase/lifecycle';
import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { PurchasePaymentVerifier } from '../purchases/contract.js';
export const PAYMENT_REQUEST_LIFECYCLE = 'oa.payment';
export interface PaymentRequestInput {
  reason: string;
  sourceMode: 'purchase' | 'contract' | 'none';
  purchaseOrderId: string | null;
  contractId: string | null;
  contractVersion?: number | null;
  noPriorApprovalReason: string;
  vendorId: string | null;
  amountCents: number;
  invoiceNumber: string;
  attachments: string[];
  paymentMethod: string;
}
export interface PaymentRequestRecord
  extends LifecycleRecord, PaymentRequestInput {
  id: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  departmentId: string | null;
  sourceOrderId: string | null;
  sourceContractId?: string | null;
  sourceContractVersion?: number | null;
  sourceHeldCents: number;
  sourceApprovedCents: number | null;
  sourceCumulativeCents: number | null;
  vendorSnapshot: JsonObject | null;
  fullApprovalRequired: boolean;
  ruleSnapshot: JsonObject | null;
  headApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  headApprovedAt: string | null;
  financeApprovedAt: string | null;
  executiveApprovedAt: string | null;
  gmApprovedAt: string | null;
  gmMerged: JsonObject | null;
  approvalGrantedAt: string | null;
  voucherNumber: string | null;
  voucherAttachments: string[];
  paidAt: string | null;
  paymentId: string | null;
  exceptionContentHash: string | null;
  handlingFailureReason: string | null;
  forcedReason: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export interface PaymentPayee {
  requestId: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  version: number;
}
/** Trusted order-settlement proof, independently verifies authoritative payment facts in caller transaction. */
export interface PaymentRequestSettlementService extends PurchasePaymentVerifier {
  financeExport(
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
  ): Promise<import('../finance-integration/contract.js').FinanceSourceFact>;
  searchVisible(
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
  ): Promise<void>;
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

  /** Public authorized list for approval-center composition; no private bank fields. */
  list(
    actorId: string,
    view: string,
    policy?: RepositoryPolicy,
  ): Promise<
    (PaymentRequestRecord & { applicant: { id: string; name: string } })[]
  >;

  /** Public authorized detail source. Consumers must enforce needed field policies before rendering a DTO. */
  detail(
    id: string,
    actorId: string,
    readPolicy: RepositoryPolicy,
  ): Promise<{
    record: PaymentRequestRecord;
    users: { id: string; name: string }[];
    runs: Awaited<ReturnType<ApprovalService['runViewsFor']>>;
    timeline: Awaited<ReturnType<ApprovalService['timelineFor']>>;
  }>;

  paymentFact(
    id: string,
    connection: DatabaseConnection,
  ): Promise<{
    id: string;
    purchaseOrderId: string | null;
    cents: number;
    paidAt: string;
    forced: boolean;
  } | null>;
}
export const paymentRequestServiceToken =
  createServiceToken<PaymentRequestSettlementService>(
    'oa/payment-request-service',
  );
