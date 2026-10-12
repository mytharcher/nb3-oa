import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface ReimbursementLine {
  id: string;
  category: string;
  date: string;
  amountCents: number;
  invoiceNumber: string;
  attachmentIds: string[];
  standardExceptionReason: string;
}
export interface ReimbursementRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  reason: string;
  authorizationId: string | null;
  loanId: string | null;
  bindingCaptured: boolean;
  boundAuthorizationId: string | null;
  boundLoanId: string | null;
  offsetCents: number;
  overrunReason: string;
  lines: ReimbursementLine[];
  totalCents: number;
  departmentId: string | null;
  managerId: string | null;
  headId: string | null;
  accountantId: string | null;
  executiveId: string | null;
  gmId: string | null;
  standardSnapshot: Record<string, unknown> | null;
  ruleSnapshot: Record<string, unknown> | null;
  financeLineFacts: Record<
    string,
    { outcome: 'approved' | 'returned' | 'pending'; contentHash: string }
  >;
  financeCorrectionLines: ReimbursementLine[];
  handlingFailureReason: string | null;
  voucherNumber: string | null;
  forcedReason: string | null;
  paymentId: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export interface ReimbursementDetail {
  record: ReimbursementRecord;
  users: Person[];
  timeZone: string;
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  upcoming: UpcomingStage[];
  timeline: ApprovalTimeline;
}
export interface SourceContext {
  reload: () => void;
  focusList?: () => void;
}
export interface DetailContext extends SourceContext {
  detail: ReimbursementDetail;
  reloadDetail: () => void;
}
export const STATUSES = [
  'draft',
  'revision',
  'manager',
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
