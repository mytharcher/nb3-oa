import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import type { JsonObject, LifecycleRecord } from '@nocobase/lifecycle';
import type { BudgetAccount } from '../budgets/contract.js';
export const PURCHASE_LIFECYCLE = 'oa.purchase';
export interface PurchaseItem {
  id: string;
  name: string;
  specification: string;
  quantity: string;
  unit: string;
}
export interface PurchaseQuote {
  vendorId: string;
  attachmentIds: string[];
}
export interface PurchaseRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  items: PurchaseItem[];
  subject: string;
  estimatedCents: number;
  expectedDate: string;
  suggestedVendorId: string | null;
  purpose: string;
  actualCents: number | null;
  selectedVendorId: string | null;
  quotes: PurchaseQuote[];
  departmentId: string | null;
  year: number | null;
  heldAccount: BudgetAccount | null;
  heldCents: number;
  headApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  gmMerged: JsonObject | null;
  ruleSnapshot: JsonObject | null;
  handlingFailureReason: string | null;
  approvedFingerprint: string | null;
  financeEntered: boolean;
  priceConfirmationRequired: boolean;
  handlingForced: boolean;
  handlingActorId: string | null;
  orderId: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export type PurchaseInput = Pick<
  PurchaseRecord,
  | 'items'
  | 'subject'
  | 'estimatedCents'
  | 'expectedDate'
  | 'suggestedVendorId'
  | 'purpose'
>;
export interface PurchaseOrder {
  id: string;
  purchaseId: string;
  number: string;
  applicantId: string;
  departmentId: string;
  items: PurchaseItem[];
  actualCents: number;
  vendor: { id: string; code: string; name: string; category: string };
  account: BudgetAccount;
  status: 'awaitingReceipt' | 'accepted' | 'cancelled';
  version: number;
  createdAt: Date;
  acceptedAt: Date | null;
  acceptedById: string | null;
  receiptDate: string | null;
  receiptReason: string | null;
}
export interface PurchasePaymentReference {
  id: string;
  orderId: string;
  paymentId: string;
  cents: number;
  state: 'pending' | 'paid' | 'released';
  requiresAdditionalApproval: boolean;
  createdAt: Date;
}
export interface PurchasePaymentVerifier {
  /** Payment provider verifies authoritative approved/cashier immutable source and completed full staircase in this transaction. No caller boolean is accepted. */
  confirm(
    input: {
      paymentId: string;
      purchaseOrderId: string;
      actorId: string;
      cents: number;
    },
    connection: DatabaseConnection,
  ): Promise<{
    approved: true;
    requiresFullApproval: boolean;
    completedFullApproval: boolean;
    sourceVersion: number;
  }>;
}
export interface PurchaseOrderService {
  /** Acquire every old/new source in stable order before locking the payment record. */
  lockPaymentSources(
    orderIds: readonly string[],
    connection: DatabaseConnection,
  ): Promise<void>;

  get(
    id: string,
    connection?: DatabaseConnection,
  ): Promise<PurchaseOrder | null>;
  list(
    query: {
      page: number;
      pageSize: number;
      sort: 'createdAt' | 'number' | 'actualCents';
      direction: 'asc' | 'desc';
    },
    policy: RepositoryPolicy,
    connection?: DatabaseConnection,
  ): Promise<{
    data: PurchaseOrder[];
    meta: { page: number; pageSize: number; total: number };
  }>;
  issue(
    record: PurchaseRecord,
    actorId: string,
    connection: DatabaseConnection,
  ): Promise<PurchaseOrder>;
  accept(
    id: string,
    input: {
      actorId: string;
      version: number;
      receiptDate: string;
      reason: string;
      requestKey: string;
    },
    connection: DatabaseConnection,
  ): Promise<PurchaseOrder>;
  cancel(
    id: string,
    input: {
      actorId: string;
      version: number;
      reason: string;
      requestKey: string;
    },
    connection: DatabaseConnection,
  ): Promise<PurchaseOrder>;
  reservePayment(
    input: {
      orderId: string;
      paymentId: string;
      cents: number;
      actorId: string;
      requestKey: string;
    },
    connection: DatabaseConnection,
  ): Promise<PurchasePaymentReference & { exceedsApproved: boolean }>;
  releasePayment(
    input: {
      orderId: string;
      paymentId: string;
      actorId: string;
      reason: string;
    },
    connection: DatabaseConnection,
  ): Promise<void>;
  settlePayment(
    input: {
      orderId: string;
      paymentId: string;
      actorId: string;
      requestKey: string;
      verifier: PurchasePaymentVerifier;
    },
    connection: DatabaseConnection,
  ): Promise<PurchasePaymentReference>;
  paymentTotals(
    id: string,
    connection?: DatabaseConnection,
  ): Promise<{ pendingCents: number; paidCents: number }>;
}
export const purchaseOrderServiceToken =
  createServiceToken<PurchaseOrderService>('oa/purchase-orders');
