import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
export interface Person {
  id: string;
  name: string;
}
export interface Committee {
  version: number;
  min: number;
  settle: 'veto';
  seats: {
    key: string;
    source: 'purchasing' | 'finance' | 'applicantHead' | 'technical' | 'legal';
    veto: boolean;
  }[];
}
export interface QualificationInput {
  operation: 'qualify' | 'remove';
  vendorId: string;
  name: string;
  category: string;
  reason: string;
  quoteCents: number;
  cases: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  attachments: string[];
  qualificationExpiry: string | null;
}
export interface QualificationRecord extends QualificationInput {
  id: string;
  applicantId: string;
  createdById: string;
  applicant: Person | null;
  createdBy: Person | null;
  number: string | null;
  status: string;
  lifecycleVersion: number;
  sourceVendorVersion: number | null;
  committeeVersion: number | null;
  committeeSnapshot: Committee | null;
  createdAt: string;
}
export interface QualificationDetail {
  record: QualificationRecord;
  knownUsers: Person[];
  runs: RunView[];
  actions: TaskActions[];
  runActions: RunActions[];
  view: RecordView;
  timeline: ApprovalTimeline;
  upcoming: UpcomingStage[];
  timeZone: string;
}
export interface QualificationOptions {
  applicant: Person;
  timeZone: string;
  canCreateQualification: boolean;
  canCreateRemoval: boolean;
  vendors: {
    id: string;
    name: string;
    category: string;
    status: string;
    eligibleOperations: ('qualify' | 'remove')[];
  }[];
  categories: { code: string; label: Record<string, string> }[];
  committeeVersions: Committee[];
  activeCommitteeVersion: number;
}
export interface SourceContext {
  reload: () => void;
  focusList?: () => void;
}
export interface DetailContext extends SourceContext {
  detail: QualificationDetail;
  reloadDetail: () => void;
  writable: boolean;
}
export interface BankResult {
  account: {
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
    version: number;
  } | null;
  lifecycleVersion: number;
}
export interface Configuration {
  versions: Committee[];
  activeCommitteeVersion: number;
  assignments: {
    committeeVersion: number;
    seatKey: string;
    personId: string | null;
    version: number;
  }[][];
  removalHead: { personId: string | null; version: number } | null;
  knownUsers: Person[];
}
export const STATUSES = [
  'draft',
  'revision',
  'purchasing',
  'removalReview',
  'qualified',
  'removed',
  'rejected',
  'withdrawn',
  'terminated',
];
export function stageLabel(
  status: string,
  t: (key: string, values?: Record<string, unknown>) => string,
) {
  const version = /^committee_v(\d+)$/.exec(status)?.[1];
  return version
    ? t('vendorQualifications.committeeVersion', { version })
    : t(`vendorQualifications.statuses.${status}`);
}
export const emptyInput: QualificationInput = {
  operation: 'qualify',
  vendorId: '',
  name: '',
  category: '',
  reason: '',
  quoteCents: 0,
  cases: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  attachments: [],
  qualificationExpiry: null,
};
