import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface ExpensePlanRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  departmentId: string | null;
  year: number | null;
  subject: string;
  matterType: string;
  participants: number;
  eventDate: string;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  authorizationId: string | null;
  gmMerged: {
    runId: string;
    taskId: string;
    personId: string;
    at: string;
    stages: string[];
  } | null;
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
export interface ExpensePlanDetail {
  timeZone: string;
  department: { id: string; title: string } | null;
  authorization: {
    id: string;
    grantedCents: number;
    state: 'open' | 'closed' | 'expired';
    deadline: string;
    issuedAt: string;
  } | null;
  record: ExpensePlanRecord;
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
  detail: ExpensePlanDetail;
  update: (record: ExpensePlanRecord) => void;
}
export { ACTIONS, TAB_VIEW } from '../approvals/types.js';
