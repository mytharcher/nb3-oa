import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
/** Public DTO deliberately contains no salary amount. Private compensation is a separate resource. */
export interface ProbationRecord {
  id: string;
  employeeId: string;
  applicantId: string;
  createdById: string;
  applicant: Person | null;
  createdBy: Person | null;
  managerApprover: Person | null;
  headApprover: Person | null;
  gmApprover: Person | null;
  hrActor: Person | null;
  number: string | null;
  probationEndDate: string;
  selfEvaluation: string;
  evaluation: string | null;
  conclusion: 'regular' | 'deferred' | 'declined' | null;
  deferredTo: string | null;
  gradeId: string | null;
  compensationProposalId: string | null;
  hrActorId: string | null;
  departmentId: string | null;
  managerApproverId: string | null;
  headApproverId: string | null;
  headMerged: Record<string, unknown> | null;
  gmApproverId: string | null;
  ruleSnapshot: Record<string, unknown> | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export interface ProbationDetail {
  record: ProbationRecord;
  timeZone: string;
  users: Person[];
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  upcoming: UpcomingStage[];
  timeline: ApprovalTimeline;
}
export interface ProbationOptions {
  timeZone: string;
  actorId: string;
  actor: Person | null;
  canCreateManualDraft: boolean;
}
export interface GradeOption {
  id: string;
  code: string;
  title: string;
  rank: number;
  active: boolean;
}
export interface SourceContext {
  reload: () => void;
  focusList?: () => void;
}
export interface DetailContext extends SourceContext {
  detail: ProbationDetail;
  reloadDetail: () => void;
  applyRecord: (record: ProbationRecord) => void;
}
export const STATUSES = [
  'draft',
  'revision',
  'manager',
  'head',
  'hr',
  'gm',
  'approved',
  'rejected',
  'withdrawn',
  'terminated',
] as const;
export const RECORD_ACTIONS = new Set([
  'edit',
  'submit',
  'withdraw',
  'terminate',
]);
export const APPROVAL_ACTIONS = new Set([
  'approve',
  'reject',
  'return',
  'returnTo',
  'comment',
  'read',
  'urge',
  'transfer',
  'addSigner',
  'cc',
  'claim',
  'release',
  'appoint',
  'reassign',
]);
/** A company calendar date has no offset: do not turn YYYY-MM-DD into a browser-local instant. */
export function calendarDateLabel(
  value: string | null,
  locale: string,
): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '—';
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
    ? '—'
    : new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(date);
}
