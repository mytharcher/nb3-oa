import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface GeneralRequestRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  title: string;
  body: string;
  attachments: string[];
  extraApproverIds: string[];
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  managerApproverId: string | null;
  createdAt: string;
}
export interface GeneralRequestDetail {
  record: GeneralRequestRecord;
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
  detail: GeneralRequestDetail;
  update: (record: GeneralRequestRecord) => void;
}
export { ACTIONS, TAB_VIEW } from '../approvals/types.js';
