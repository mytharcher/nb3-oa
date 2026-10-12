import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface DepartureRecord {
  id: string;
  employeeId: string;
  applicantId: string;
  createdById: string;
  applicant: Person | null;
  createdBy: Person | null;
  handoverUser: Person | null;
  managerApprover: Person | null;
  headApprover: Person | null;
  gmApprover: Person | null;
  departureType: string;
  departureTypeLabel: Record<string, string> | null;
  number: string | null;
  reason: string;
  cancellationReason?: string | null;
  expectedLastWorkingDay: string | null;
  lastWorkingDay: string | null;
  handoverUserId: string | null;
  sourceProbationId: string | null;
  sourceKey: string | null;
  settlementDate: string | null;
  settlementNote: string | null;
  hrInterviewCompleted: boolean;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export interface WorkOffer {
  name: string;
  allowed: boolean;
  blockers: { code: string; message?: string }[];
}
export interface WorkItem {
  id: string;
  kind: 'work' | 'it' | 'admin' | 'finance';
  status: 'open' | 'claimed' | 'completed';
  lifecycleVersion: number;
  manager: Person | null;
  receiver: Person | null;
  claimedBy: Person | null;
  forcedBy: Person | null;
  checklistConfirmed: boolean;
  receiverAcknowledged: boolean;
  forceReason: string | null;
  offers: WorkOffer[];
}
export interface DepartureDetail {
  record: DepartureRecord;
  timeZone: string;
  users: Person[];
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  upcoming: UpcomingStage[];
  timeline: ApprovalTimeline;
  readyForSubmission: boolean;
  blockedBy: string[];
  workItems: WorkItem[];
  execution: {
    id: string;
    status: 'ready' | 'transferring' | 'blocked' | 'executed';
    failureCode: string | null;
  } | null;
}
export interface TypeOption {
  code: string;
  label: Record<string, string>;
}
export interface DepartureOptions {
  timeZone: string;
  actor: Person | null;
  canCreateSelfDraft: boolean;
  canCreateManualDraft: boolean;
  departureTypes: TypeOption[];
  selfDepartureTypes: TypeOption[];
  manualDepartureTypes: TypeOption[];
}
export interface SourceContext {
  reload: () => void;
  focusList?: () => void;
}
export interface DetailContext extends SourceContext {
  detail: DepartureDetail;
  reloadDetail: () => void;
  applyRecord: (record: DepartureRecord) => void;
}
export const STATUSES = [
  'draft',
  'revision',
  'manager',
  'head',
  'hr',
  'gm',
  'handover',
  'completed',
  'withdrawn',
  'rejected',
  'terminated',
] as const;
export const RECORD_ACTIONS = new Set([
  'edit',
  'submit',
  'withdraw',
  'terminate',
  'settle',
  'requestCancellation',
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
export function typeLabel(
  label: Record<string, string> | null | undefined,
  locale: string,
  fallback: string,
) {
  return label?.[locale] ?? label?.['zh-CN'] ?? label?.['en-US'] ?? fallback;
}
export function calendarDateLabel(value: string | null, locale: string) {
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
