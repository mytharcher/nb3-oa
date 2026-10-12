import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface LoanRequestRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  departmentId: string | null;
  dueDate: string;
  travelId: string | null;
  managerApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  paymentAccount: null;
  paymentVoucher: string | null;
  paidAt: string | null;
  approvalGrantedAt: string | null;
  returnDueDate: string | null;
  quotaSnapshot: {
    outstandingCents: number;
    inflightCents: number;
    totalCents: number;
  } | null;
  gmMerged: {
    runId: string;
    taskId: string;
    personId: string;
    at: string;
    stages: string[];
  } | null;
  amountCents: number;
  heldCents: number;
  reason: string;
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  headApproverId: string | null;
  createdAt: string;
}
export interface LoanRequestDetail {
  timeZone: string;
  department: { id: string; title: string } | null;
  loan: {
    id: string;
    principalCents: number;
    repaidCents: number;
    heldCents: number;
    outstandingCents: number;
    availableCents: number;
    dueDate: string;
  } | null;
  record: LoanRequestRecord;
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
  detail: LoanRequestDetail;
  update: (record: LoanRequestRecord) => void;
}
import { ACTIONS as BASE_ACTIONS } from '../approvals/types.js';
export { TAB_VIEW } from '../approvals/types.js';
export const ACTIONS = [
  ...BASE_ACTIONS,
  'claim',
  'release',
  'assign',
  'complete',
  'unable',
  'retryCash',
] as const;
