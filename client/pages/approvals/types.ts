import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
  RoutePreview,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
export interface Person {
  id: string;
  name: string;
}
export interface LeaveRecord {
  id: string;
  applicantId: string;
  applicant?: Person;
  createdById: string;
  number: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  startHalf: 'am' | 'pm';
  endHalf: 'am' | 'pm';
  days: number | string;
  reason: string;
  attachments: string[];
  handoverUserId: string | null;
  enableDelegation: boolean;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export interface LeaveDetail {
  record: LeaveRecord;
  users: Person[];
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  upcoming: UpcomingStage[];
  timeline: ApprovalTimeline;
}
export interface LeaveType {
  code: string;
  label: Record<string, string>;
  active: boolean;
  extra?: {
    deductsBalance?: boolean;
    requiresAttachmentAfterDays?: number;
    requiresAttachment?: boolean;
    attachmentAboveDays?: number;
    maxDays?: number;
  };
}
export interface LeaveOptions {
  leaveTypes: LeaveType[];
  balanceAvailable: boolean;
  timeZone?: string;
}
export interface LeavePreview {
  days: number;
  route: RoutePreview;
  users?: Person[];
}
export interface SourceContext {
  reload: () => void;
}
export interface DetailContext extends SourceContext {
  detail: LeaveDetail;
  update: (record: LeaveRecord) => void;
}
export const TAB_VIEW: Record<string, string> = {
  todo: 'pending',
  done: 'done',
  copied: 'copied',
  mine: 'mine',
};
export const ACTIONS = [
  'transfer',
  'addSigner',
  'urge',
  'approve',
  'reject',
  'return',
  'comment',
  'read',
  'appoint',
  'reassign',
] as const;
