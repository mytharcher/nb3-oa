import type { RecordView } from '@nocobase/lifecycle/react';
import type {
  RunView,
  TaskActions,
  ApprovalTimeline,
} from '@nocobase/app-plugin-approval/client';
export interface Person {
  id: string;
  name: string;
}
export interface Proposal {
  employeeId: string;
  kinds: string[];
  targetDepartmentId: string;
  targetPositionId: string;
  targetGradeId: string;
  targetManagerId: string | null;
  sourceAccountId: string | null;
  targetAccountId: string | null;
  effectiveDate: string;
  targetSalary: string;
  reason: string;
}
export interface TransferRecord extends Omit<Proposal, 'targetSalary'> {
  id: string;
  applicantId: string;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
  executionFailureCode: string | null;
  users?: Person[];
  employee?: Person;
}
export interface Detail {
  record: TransferRecord;
  facts: {
    employee: Person;
    department: Person;
    position: Person;
    grade: Person;
    manager: Person | null;
  };
  users: Person[];
  view: RecordView;
  runs: RunView[];
  actions: TaskActions[];
  timeline: ApprovalTimeline;
}
export interface Options {
  canCreateAsHR: boolean;
  editableFields: string[];
  employee: Person | null;
  departments: Person[];
  positions: Person[];
  grades: Person[];
  managers: Person[];
}
export interface Context {
  reload: () => void;
  detail?: Detail;
  writable?: boolean;
  update?: (detail: Detail) => void;
}
export const transferPolicy = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.transfer' },
  action,
});
export const statuses = [
  'draft',
  'revision',
  'manager',
  'sourceHead',
  'targetHead',
  'hr',
  'executive',
  'gm',
  'pendingEffective',
  'cancellationReview',
  'completed',
  'cancelled',
  'rejected',
  'withdrawn',
  'terminated',
];
