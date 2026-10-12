import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface BudgetAdjustmentRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  departmentId: string;
  year: number;
  subject: string;
  adjustmentType: 'transfer' | 'increase';
  sourceSubject: string | null;
  amountCents: number;
  heldCents: number;
  heldAccount: { departmentId: string; year: number; subject: string } | null;
  reason: string;
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  headApproverId: string | null;
  createdAt: string;
}
export interface BudgetAdjustmentDetail {
  record: BudgetAdjustmentRecord;
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
  detail: BudgetAdjustmentDetail;
  update: (record: BudgetAdjustmentRecord) => void;
}
export { ACTIONS, TAB_VIEW } from '../approvals/types.js';
