import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface TravelCancellationRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  departmentId: string | null;
  sourceId: string;
  baseline: string | null;
  needsUnbooking: boolean;
  unbookingInformation: string | null;
  exceptionReason: string | null;
  managerApproverId: string | null;
  reason: string;
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  createdAt: string;
}
export interface TravelCancellationDetail {
  timeZone: string;
  record: TravelCancellationRecord;
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
  detail: TravelCancellationDetail;
  update: (record: TravelCancellationRecord) => void;
}
import { ACTIONS as SHARED_ACTIONS } from '../approvals/types.js';
export const ACTIONS = [
  ...SHARED_ACTIONS,
  'cc',
  'claim',
  'release',
  'assign',
  'appoint',
  'reassign',
  'complete',
  'unable',
  'forceComplete',
] as const;
export { TAB_VIEW } from '../approvals/types.js';
