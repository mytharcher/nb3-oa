import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface TrainingRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  departmentId: string | null;
  name: string;
  institution: string;
  startAt: string;
  endAt: string;
  usesWorkingTime: boolean;
  attendanceRecorded: boolean;
  amountCents: number;
  authorizationId: string | null;
  managerApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  headMerged: Record<string, unknown> | null;
  gmMerged: Record<string, unknown> | null;
  hrRecipients: string[];
  reason: string;
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  headApproverId: string | null;
  createdAt: string;
}
export interface TrainingDetail {
  timeZone: string;
  record: TrainingRecord;
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
  detail: TrainingDetail;
  update: (record: TrainingRecord) => void;
}
import { ACTIONS as SHARED_ACTIONS } from '../approvals/types.js';
export const ACTIONS = [...SHARED_ACTIONS, 'cc'] as const;
export { TAB_VIEW } from '../approvals/types.js';
