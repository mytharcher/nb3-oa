import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';

/** Public payment DTOs only. Private bank fields belong to the separate account endpoint. */
export interface PaymentInput {
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
export interface PaymentRecord extends PaymentInput {
  id: string;
  applicantId: string;
  applicant?: Person;
  creator?: Person;
  createdById: string;
  number: string | null;
  departmentId: string | null;
  sourceOrderId: string | null;
  sourceContractId?: string | null;
  sourceContractVersion?: number | null;
  sourceHeldCents: number;
  sourceApprovedCents: number | null;
  sourceCumulativeCents: number | null;
  vendorSnapshot: Record<string, unknown> | null;
  fullApprovalRequired: boolean;
  ruleSnapshot: Record<string, unknown> | null;
  headApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  headApprovedAt: string | null;
  financeApprovedAt: string | null;
  executiveApprovedAt: string | null;
  gmApprovedAt: string | null;
  gmMerged: Record<string, unknown> | null;
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
export interface PaymentDetail {
  record: PaymentRecord;
  users: Person[];
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  upcoming: UpcomingStage[];
  timeline: ApprovalTimeline;
}
export interface PaymentOrderOption {
  id: string;
  number: string;
  applicantId: string;
  applicant: Person | null;
  actualCents: number;
  vendor: { id: string; code: string; name: string; category: string };
  status: 'awaitingReceipt' | 'accepted' | 'cancelled';
  pendingCents: number;
  paidCents: number;
}
export interface PaymentOptions {
  actorId: string;
  applicantId: string;
  actor: Person | null;
  applicant: Person | null;
  timeZone: string;
  vendors: {
    id: string;
    name: string;
    category: string;
    active: boolean;
    status: 'manual' | 'qualified' | 'disabled';
  }[];
  orders: PaymentOrderOption[];
  contracts?: Array<{
    id: string;
    number: string | null;
    version: number;
    amountCents: number;
    heldCents: number;
    paidCents: number;
    counterparty:
      | { kind: 'vendor'; id: string; name: string }
      | { kind: 'customer'; name: string };
  }>;

  paymentMethods: {
    id: string;
    type: string;
    code: string;
    label: Record<string, string>;
    active: boolean;
    sortOrder: number;
    extra: Record<string, unknown> | null;
  }[];
}
export interface SourceContext {
  reload: () => void;
  focusList?: () => void;
}
export interface DetailContext extends SourceContext {
  detail: PaymentDetail;
  reloadDetail: () => void;
  applyRecord: (record: PaymentRecord) => void;
  options?: PaymentOptions;
  timeZone?: string;
}
export const STATUSES = [
  'draft',
  'revision',
  'head',
  'finance',
  'executive',
  'gm',
  'cashier',
  'exception',
  'paid',
  'forcedPaid',
  'rejected',
  'withdrawn',
  'terminated',
] as const;
export const RECORD_ACTIONS = new Set([
  'edit',
  'submit',
  'withdraw',
  'terminate',
  'retryCash',
  'reviseBusiness',
  'retryCashAsAdmin',
  'forcePayException',
]);
export const APPROVAL_ACTIONS = new Set([
  'approve',
  'reject',
  'return',
  'returnTo',
  'comment',
  'read',
  'urge',
  'transfer',
  'addSigner',
  'cc',
  'claim',
  'release',
  'assign',
  'appoint',
  'reassign',
  'complete',
  'unable',
  'forceComplete',
]);
export function vendorName(record: PaymentRecord): string {
  return typeof record.vendorSnapshot?.name === 'string'
    ? record.vendorSnapshot.name
    : '';
}
