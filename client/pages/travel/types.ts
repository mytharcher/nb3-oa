import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface TravelRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  departmentId: string | null;
  destination: string;
  international: boolean;
  startAt: string;
  endAt: string;
  companionIds: string[];
  attachments: string[];
  transportCents: number;
  lodgingCents: number;
  allowanceCents: number;
  amountCents: number;
  needsLoan: boolean;
  needsBooking: boolean;
  approvalGrantedAt: string | null;
  originalHeadApproverId: string | null;
  bookingInformation: string | null;
  exceptionReason: string | null;
  cancelledAt: string | null;
  cancellationId: string | null;
  standardSnapshot: Record<string, unknown> | null;
  authorizationId: string | null;
  authorizationSourceId: string | null;
  approvalGeneration: number;
  managerApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  headMerged: Record<string, unknown> | null;
  gmMerged: Record<string, unknown> | null;
  reason: string;
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  headApproverId: string | null;
  createdAt: string;
}
export interface TravelDetail {
  timeZone: string;
  record: TravelRecord;
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
  detail: TravelDetail;
  update: (record: TravelRecord) => void;
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
