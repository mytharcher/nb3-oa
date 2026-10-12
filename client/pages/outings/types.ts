import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface OutingRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  startAt: string;
  endAt: string;
  location: string;
  reason: string;
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  hrRecipients: string[];
  managerApproverId: string | null;
  createdAt: string;
}
export interface OutingDetail {
  timeZone: string;
  record: OutingRecord;
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
  detail: OutingDetail;
  update: (record: OutingRecord) => void;
}
export { ACTIONS, TAB_VIEW } from '../approvals/types.js';
