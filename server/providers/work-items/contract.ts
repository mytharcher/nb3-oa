import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
export type WorkItemState =
  | 'draft'
  | 'open'
  | 'assigned'
  | 'claimed'
  | 'awaitingConfirmation'
  | 'blocked'
  | 'completed'
  | 'cancelled';
export const WORK_ITEM_ACTIONS = [
  'dispatch',
  'claim',
  'release',
  'complete',
  'confirm',
  'return',
  'block',
  'resume',
  'reassign',
  'cancel',
  'forceComplete',
] as const;
export type WorkItemAction = (typeof WORK_ITEM_ACTIONS)[number];
export interface WorkItem {
  id: string;
  creatorUserId: string;
  confirmationOwnerUserId: string | null;
  targetUserId: string | null;
  dutyRoleCode: string | null;
  assigneeUserId: string | null;
  title: string;
  description: string;
  dueAt: Date;
  requiresConfirmation: boolean;
  attachments: string[];
  resultAttachments: string[];
  result: string | null;
  reason: string | null;
  forced: boolean;
  completedAt: Date | null;
  status: WorkItemState;
  version: number;
}
export const WORK_ITEM_FIELDS = [
  'id',
  'creatorUserId',
  'confirmationOwnerUserId',
  'targetUserId',
  'dutyRoleCode',
  'assigneeUserId',
  'title',
  'description',
  'dueAt',
  'requiresConfirmation',
  'attachments',
  'resultAttachments',
  'result',
  'reason',
  'forced',
  'completedAt',
  'status',
  'version',
] as const;
export interface Command {
  actorId: string;
  requestId: string;
}
export interface DraftInput extends Command {
  id?: string;
  expectedVersion?: number;
  title: string;
  description: string;
  targetUserId: string | null;
  dutyRoleCode: string | null;
  dueAt: string;
  requiresConfirmation: boolean;
  attachments: string[];
}
export interface ActionInput extends Command {
  id: string;
  expectedVersion: number;
  action: WorkItemAction;
  result?: string;
  reason?: string;
  resultAttachments?: string[];
  targetUserId?: string | null;
  dutyRoleCode?: string | null;
}
export interface WorkItemDepartureBlocker {
  id: string;
  status: WorkItemState;
  reasons: ('assignee' | 'confirmationOwner')[];
}
export interface ConfirmationHandoverInput extends Command {
  id: string;
  fromUserId: string;
  toUserId: string;
  expectedVersion: number;
  reason: string;
}
export interface ConfirmationHandoverPolicies {
  view: RepositoryPolicy;
  handover: RepositoryPolicy;
}
export interface WorkItemService {
  /** Pending business responsibilities intersect current ordinary view and full action mutation policies. */
  listForCenter(
    actorId: string,
    tx: DatabaseConnection,
    policies: {
      view: RepositoryPolicy;
      actions: Partial<Record<WorkItemAction, RepositoryPolicy>>;
    },
  ): Promise<
    {
      id: string;
      initiatorId: string;
      title: string;
      status: WorkItemState;
      dueAt: string;
      createdAt: string | null;
    }[]
  >;
  /** Current UI capability; commands still recheck all policies and identities in their transaction. */
  canHandoverConfirmation(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policies: ConfirmationHandoverPolicies,
  ): Promise<boolean>;
  handoverConfirmation(
    input: ConfirmationHandoverInput,
    tx: DatabaseConnection,
    policies: ConfirmationHandoverPolicies,
  ): Promise<WorkItem>;

  /** Trusted owner scan in caller transaction. Includes inactive people; does not grant HTTP access or serialize concurrent upstream writes. */
  departureBlockers(
    userId: string,
    tx: DatabaseConnection,
  ): Promise<{ items: WorkItemDepartureBlocker[]; remaining: number }>;
  save(
    input: DraftInput,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<WorkItem>;
  act(
    input: ActionInput,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<WorkItem>;
  get(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<WorkItem | undefined>;
  /** Business eligibility only. HTTP and center adapters must intersect each action with its current grant and record scope. */
  actions(
    item: WorkItem,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<WorkItemAction[]>;
  authorizeUpload(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<{ item: WorkItem; purpose: 'input' | 'result' }>;
  /** Safe personal summaries; item actions are business eligibility, not authorization grants. */
  pending(
    actorId: string,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<{
    items: {
      kind: 'oa.workItem';
      sourceId: string;
      title: string;
      dueAt: Date;
      overdue: boolean;
      actions: WorkItemAction[];
    }[];
    count: number;
  }>;
}
export const workItemServiceToken = createServiceToken<WorkItemService>(
  'oa/work-item-service',
);
