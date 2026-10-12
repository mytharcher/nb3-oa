import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface PurchaseItem {
  id: string;
  name: string;
  specification: string;
  quantity: string;
  unit: string;
}
export interface VendorOption {
  id: string;
  name: string;
  category: string;
  active: boolean;
  status: 'manual' | 'qualified' | 'disabled';
}
export interface PurchaseRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
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
  quotes: { vendorId: string; attachmentIds: string[] }[];
  departmentId: string | null;
  year: number | null;
  heldAccount: { departmentId: string; year: number; subject: string } | null;
  heldCents: number;
  headApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  gmMerged: {
    runId: string;
    taskId: string;
    personId: string;
    at: string;
    stages: string[];
  } | null;
  ruleSnapshot: Record<string, unknown> | null;
  handlingFailureReason: string | null;
  approvedFingerprint: string | null;
  financeEntered: boolean;
  priceConfirmationRequired: boolean;
  handlingForced: boolean;
  handlingActorId: string | null;
  handlingActor?: Person | null;
  orderId: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export interface PurchaseOrder {
  id: string;
  purchaseId: string;
  number: string;
  applicantId: string;
  applicant: Person | null;
  departmentId: string;
  items: PurchaseItem[];
  actualCents: number;
  vendor: { id: string; code: string; name: string; category: string };
  account: { departmentId: string; year: number; subject: string };
  status: 'awaitingReceipt' | 'accepted' | 'cancelled';
  version: number;
  createdAt: string;
  acceptedAt: string | null;
  acceptedById: string | null;
  acceptedBy: Person | null;
  receiptDate: string | null;
  receiptReason: string | null;
}
export interface PurchaseDetail {
  quoteBasisHash: string;
  timeZone: string;
  department: { id: string; title: string } | null;
  order: PurchaseOrder | null;
  record: PurchaseRecord;
  users: Person[];
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  upcoming: UpcomingStage[];
  timeline: ApprovalTimeline;
}
export interface SourceContext {
  reload: () => void;
}
export interface DetailContext extends SourceContext {
  detail: PurchaseDetail;
  update: (record: PurchaseRecord) => void;
}
export { TAB_VIEW } from '../approvals/types.js';

export const ACTIONS = [
  'transfer',
  'addSigner',
  'urge',
  'approve',
  'reject',
  'return',
  'comment',
  'read',
  'appoint',
  'reassign',
  'cc',
  'claim',
  'release',
  'assign',
  'complete',
  'unable',
  'forceComplete',
] as const;
