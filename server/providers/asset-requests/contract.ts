import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type {
  LifecycleRecord,
  JsonObject,
  LifecycleRuntime,
} from '@nocobase/lifecycle';
import type {
  ApprovalService,
  PerformInput,
} from '@nocobase/app-plugin-approval/server';
import type { AssetSnapshot, AssetUnit } from '../assets/contract.js';

export const ASSET_REQUEST_LIFECYCLE = 'oa.assetRequest';
export type AssetOperation = 'use' | 'borrow' | 'scrap';
export interface AssetRequestRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  employeeId: string | null;
  departmentId: string | null;
  headApproverId: string | null;
  issuedById: string | null;
  number: string | null;
  operation: AssetOperation;
  category: string | null;
  assetIds: string[];
  quantity: number;
  purpose: string;
  borrowDueDate: string | null;
  scrapReason: string;
  photos: string[];
  allocation: Omit<AssetSnapshot, 'originalValueCents'>[] | null;
  originalValueCents: number | null;
  ruleSnapshot: JsonObject | null;
  needsGm: boolean;
  appraisalOpinion: string | null;
  handlingUnits: AssetUnit[] | null;
  handlingReason: string | null;
  approvedFingerprint: string | null;
  exceptionReason: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
  updatedAt: string;
}
export type AssetRequestInput = Pick<
  AssetRequestRecord,
  | 'operation'
  | 'category'
  | 'assetIds'
  | 'quantity'
  | 'purpose'
  | 'borrowDueDate'
  | 'scrapReason'
  | 'photos'
>;
export interface AssetRequestService {
  list(
    actorId: string,
    view: 'mine' | 'pending' | 'done' | 'copied',
    policy: RepositoryPolicy,
  ): Promise<
    (Partial<AssetRequestRecord> & {
      applicant?: { id: string; name: string };
      createdBy?: { id: string; name: string };
    })[]
  >;
  readableIds(actorId: string): Promise<string[]>;
  detail(
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
  ): Promise<AssetRequestDetail>;
  candidates(
    id: string,
    actorId: string,
    target: { taskId: string } | { runId: string },
    action: string,
    query: { search?: string; offset?: number; limit?: number },
    policy: RepositoryPolicy,
  ): Promise<{
    people: { id: string; name: string }[];
    nextOffset: number | null;
  }>;
  approvals: Pick<ApprovalService, 'tasksOf' | 'runsFor' | 'actionsOf'>;
  get(
    id: string,
    connection?: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Partial<AssetRequestRecord> | null>;
  create(
    actorId: string,
    input: AssetRequestInput,
    requestId: string,
    policy?: RepositoryPolicy,
  ): Promise<Partial<AssetRequestRecord>>;
  edit(
    id: string,
    actorId: string,
    input: AssetRequestInput & { lifecycleVersion: number; requestId: string },
    policy?: RepositoryPolicy,
  ): Promise<Partial<AssetRequestRecord>>;
  act(
    id: string,
    actorId: string,
    action: string,
    input: { lifecycleVersion: number; requestId: string; comment?: string },
    policy?: RepositoryPolicy,
  ): Promise<Partial<AssetRequestRecord>>;
  action(
    id: string,
    actorId: string,
    input: PerformInput,
    policy?: RepositoryPolicy,
  ): Promise<unknown>;
  maintenanceReassign(
    id: string,
    actorId: string,
    input: Omit<PerformInput, 'actor'>,
    policy: RepositoryPolicy,
  ): Promise<unknown>;
  returnIssued(
    id: string,
    actorId: string,
    input: { units: AssetUnit[]; reason: string; requestId: string },
    policy: RepositoryPolicy,
  ): Promise<Partial<AssetRequestRecord>>;
  remindBorrowers(now: Date): Promise<{ sent: number; pending: number }>;
}
export interface AssetRequestDetail {
  record: Partial<AssetRequestRecord>;
  users: { id: string; name: string }[];
  timeZone: string;
  view: Omit<Awaited<ReturnType<LifecycleRuntime['view']>>, 'record'>;
  runs: Awaited<ReturnType<ApprovalService['runViewsFor']>>;
  taskActions: Awaited<ReturnType<ApprovalService['actionsFor']>>;
  runActions: Awaited<ReturnType<ApprovalService['runActionsFor']>>;
  upcoming: Awaited<ReturnType<ApprovalService['upcomingStagesFor']>>;
  timeline: Awaited<ReturnType<ApprovalService['timelineFor']>>;
}
export const assetRequestServiceToken = createServiceToken<AssetRequestService>(
  'oa/asset-request-service',
);
