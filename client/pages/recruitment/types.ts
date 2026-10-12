import type {
  ApprovalTimeline,
  RunView,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
export interface Person {
  id: string;
  name: string;
}
export interface Proposal {
  departmentId: string;
  positionId: string;
  gradeId: string;
  accountId: string;
  year: number;
  quantity: number;
  kind: 'additional' | 'replacement';
  replacementEmployeeIds: string[];
  minimumCents: number;
  maximumCents: number;
  expectedStartDate: string;
  jobDescription: string;
  reason: string;
}
export interface RecruitmentRecord extends Omit<
  Proposal,
  'minimumCents' | 'maximumCents'
> {
  id: string;
  applicantId: string;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
  statusChangedAt: string;
}
export interface Identities {
  department: Person | null;
  position: Person | null;
  grade: Person | null;
}
export interface Detail {
  record: RecruitmentRecord;
  identities: Identities;
  users: Person[];
  canSubmit?: boolean;
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  timeline: ApprovalTimeline;
}
export interface ListRow extends RecruitmentRecord {
  identities: Identities;
  applicant: Person | null;
}
export interface Options {
  canCreate?: boolean;
  editableFields: string[];
  departments?: Person[];
  department?: Person | null;
  positions: Person[];
  grades: Person[];
}
export interface Requisition {
  id: string;
  requestId: string;
  departmentId: string;
  positionId: string;
  gradeId: string;
  originalQuantity: number;
  remaining: number;
  consumed: number;
  sourceYear: number;
  sourceVersion: number;
  status: 'recruiting' | 'full' | 'closed';
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface Source {
  reload: () => void;
}
