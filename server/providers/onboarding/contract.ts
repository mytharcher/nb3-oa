import { createServiceToken } from '@nocobase/service-provider';
import type {
  DatabaseConnection,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import type { OnboardingEmployeeInput } from '../employees/contract.js';
export interface Onboarding extends RepositoryRecord {
  id: string;
  creatorId: string;
  employeeId: string;
  userId: string;
  requisitionId: string;
  departmentId: string;
  positionId: string;
  gradeId: string;
  hireDate: string;
  mentorEmployeeId?: string | null;
  mentorName?: string | null;
  workstationRequirement?: string | null;
  status: 'handling' | 'completed' | 'cancelled';
  version: number;
}
export const ONBOARDING_FIELDS = [
  'id',
  'creatorId',
  'employeeId',
  'userId',
  'requisitionId',
  'departmentId',
  'positionId',
  'gradeId',
  'hireDate',
  'mentorEmployeeId',
  'mentorName',
  'workstationRequirement',
  'status',
  'version',
] as const;
export interface OnboardingCommand {
  actorId: string;
  requestKey: string;
  reason: string;
}
export interface CreateOnboardingInput {
  id: string;
  requisitionId: string;
  requisitionVersion: number;
  /** Explicit initialized yearly account when consuming an older recruitment allocation. */
  targetAccountId?: string;
  account: { name: string; email: string; username?: string; password: string };
  employee: Omit<OnboardingEmployeeInput, 'userId' | 'positionId' | 'gradeId'>;
  baseSalary: string;
  mentorEmployeeId?: string | null;
  workstationRequirement?: string | null;
}
export interface OnboardingTask extends RepositoryRecord {
  id: string;
  onboardingId: string;
  kind: string;
  status: 'open' | 'claimed' | 'completed' | 'cancelled';
  assigneeId: string | null;
  targetUserId: string | null;
  dutyRoleCode: string | null;
  dueDate: string;
  facts: Record<string, string> | null;
  forced: boolean;
  version: number;
}
export const ONBOARDING_TASK_FIELDS = [
  'id',
  'onboardingId',
  'kind',
  'status',
  'assigneeId',
  'targetUserId',
  'dutyRoleCode',
  'dueDate',
  'facts',
  'forced',
  'version',
] as const;
export interface OnboardingTaskInput {
  id: string;
  taskId: string;
  expectedVersion: number;
  action:
    | 'claim'
    | 'release'
    | 'complete'
    | 'forceComplete'
    | 'transfer'
    | 'reassignMentor';
  targetUserId?: string;
  attachmentIds?: string[];
  facts?: Record<string, string>;
  assetUnits?: { code: string; serialNumber: string }[];
}
export interface OnboardingTimelineEntry {
  id: string;
  at: string;
  action: string;
  actorId: string | null;
  taskId?: string;
  kind?: string;
  fromUserId?: string;
  toUserId?: string;
  assetReceiptId?: string;
  sourceTaskId?: string;
  forced?: boolean;
  parentCompleted?: boolean;
  accountEnabled?: boolean;
}
export interface OnboardingService {
  list(
    query: {
      page: number;
      pageSize: number;
      status?: 'handling' | 'completed' | 'cancelled';
      q?: string;
      desc?: boolean;
    },
    tx: DatabaseConnection,
    viewPolicy: RepositoryPolicy,
  ): Promise<{ items: Onboarding[]; total: number }>;
  authorizeAttachment(
    taskId: string,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<OnboardingTask>;
  maintenance(): Promise<{ pending: number; sent: number }>;
  detail(
    id: string,
    tx: DatabaseConnection,
    viewPolicy: RepositoryPolicy,
    taskPolicy: RepositoryPolicy,
  ): Promise<{
    record: Onboarding;
    tasks: OnboardingTask[];
    timeline: OnboardingTimelineEntry[];
  }>;
  privateFacts(
    id: string,
    kind: 'salary' | 'bank',
    tx: DatabaseConnection,
    viewPolicy: RepositoryPolicy,
    privatePolicy: RepositoryPolicy,
  ): Promise<Record<string, unknown> | null>;

  cancel(
    id: string,
    expectedVersion: number,
    command: OnboardingCommand,
    tx: DatabaseConnection,
    viewPolicy: RepositoryPolicy,
    cancelPolicy: RepositoryPolicy,
  ): Promise<Onboarding>;

  act(
    input: OnboardingTaskInput,
    command: OnboardingCommand,
    tx: DatabaseConnection,
    viewPolicy: RepositoryPolicy,
    taskPolicy: RepositoryPolicy,
    assetPolicy?: RepositoryPolicy,
    ordinaryTaskPolicy?: RepositoryPolicy,
  ): Promise<OnboardingTask>;

  /** Actual HR plus current caller policy required; employee/account/capacity/allocation are one transaction. */
  create(
    input: CreateOnboardingInput,
    command: OnboardingCommand,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
    requisitionPolicy: RepositoryPolicy,
    mentorPolicy?: RepositoryPolicy,
  ): Promise<Onboarding>;
}
export const onboardingServiceToken = createServiceToken<OnboardingService>(
  'oa/onboarding-service',
);
