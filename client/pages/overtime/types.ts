import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface OvertimeRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  date: string;
  minutes: number;
  monthlyMinutes: number;
  settlement: 'compensatory' | 'pay';
  reason: string;
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  hrRecipients: string[];
  requiresHr: boolean;
  managerApproverId: string | null;
  createdAt: string;
}
export interface OvertimeDetail {
  record: OvertimeRecord;
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
  detail: OvertimeDetail;
  update: (record: OvertimeRecord) => void;
}
export { ACTIONS, TAB_VIEW } from '../approvals/types.js';
