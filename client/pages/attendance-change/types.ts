import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface AttendanceChangeRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  originalAttendanceId: string;
  originalVersion: number;
  date: string;
  correctionAt: string;
  proof: string;
  attachments: string[];
  reason: string;
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  hrRecipients: string[];
  managerApproverId: string | null;
  createdAt: string;
}
export interface AttendanceChangeDetail {
  timeZone: string;
  record: AttendanceChangeRecord;
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
  detail: AttendanceChangeDetail;
  update: (record: AttendanceChangeRecord) => void;
}
export { ACTIONS, TAB_VIEW } from '../approvals/types.js';
