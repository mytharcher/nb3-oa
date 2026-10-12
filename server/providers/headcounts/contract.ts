import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
export interface HeadcountKey {
  departmentId: string;
  positionId: string;
  year: number;
}
export interface HeadcountAccount extends HeadcountKey {
  id: string;
  limit: number;
  initialized: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface HeadcountBalance extends HeadcountAccount {
  used: number;
  pending: number;
  allocated: number;
  replacementPending: number;
  replacementAllocated: number;
  replacementBlocked: number;
  available: number;
}
export interface HeadcountCommand {
  actorId: string;
  requestKey: string;
  reason: string;
}
export interface HeadcountSource {
  sourceKind: string;
  sourceId: string;
}
export interface HeadcountReservation extends HeadcountSource {
  id: string;
  accountId: string;
  mode: string;
  state: string;
  quantity: number;
  remaining: number;
  consumed: number;
  /** Future replacement seats whose original employee was restored; upstream approval must fail closed. */
  blocked: number;
}
export const headcountSortFields = [
  'year',
  'limit',
  'used',
  'pending',
  'allocated',
  'available',
  'updatedAt',
] as const;
export type HeadcountSort = (typeof headcountSortFields)[number];
export interface HeadcountService {
  /** Complete actual roster; callers must additionally enforce account scope. No profile or compensation fields. */
  roster(
    accountId: string,
    tx: DatabaseConnection,
    employeePolicy?: RepositoryPolicy,
  ): Promise<readonly { id: string; name: string; status: string }[]>;
  /** Internal business-source read; HTTP callers must enforce their owner's record policy separately. */
  reservation(
    source: HeadcountSource,
    tx: DatabaseConnection,
  ): Promise<HeadcountReservation | null>;
  /** Acquire before upstream employee/SDK writes; all callers use guard -> employees -> accounts. */
  within<T>(
    connection: DatabaseConnection,
    work: (tx: DatabaseConnection) => Promise<T>,
  ): Promise<T>;
  /** Administrative/import writes may preserve a reconciled roster, never invent occupied sources. */
  protectRoster<T>(
    userIds: readonly string[] | undefined,
    connection: DatabaseConnection,
    work: (tx: DatabaseConnection) => Promise<T>,
  ): Promise<T>;
  create(
    input: HeadcountKey & HeadcountCommand & { limit: number },
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<HeadcountBalance>;
  reconcile(
    input: HeadcountCommand & {
      accountId: string;
      expectedVersion: number;
      employeeIds: readonly string[];
    },
    tx: DatabaseConnection,
  ): Promise<HeadcountBalance>;
  adjustLimit(
    input: HeadcountCommand & {
      accountId: string;
      expectedVersion: number;
      limit: number;
    },
    tx: DatabaseConnection,
  ): Promise<HeadcountBalance>;
  hold(
    input: HeadcountCommand &
      HeadcountSource & {
        accountId: string;
        quantity: number;
        replacementEmployeeIds?: readonly string[];
      },
    tx: DatabaseConnection,
  ): Promise<HeadcountReservation>;
  reviseHold(
    input: HeadcountCommand &
      HeadcountSource & {
        accountId: string;
        quantity: number;
        replacementEmployeeIds?: readonly string[];
      },
    tx: DatabaseConnection,
  ): Promise<HeadcountReservation>;
  allocate(
    input: HeadcountCommand & HeadcountSource,
    tx: DatabaseConnection,
  ): Promise<HeadcountReservation>;
  close(
    input: HeadcountCommand & HeadcountSource,
    tx: DatabaseConnection,
  ): Promise<HeadcountReservation>;
  consume(
    input: HeadcountCommand & HeadcountSource & { employeeId: string },
    tx: DatabaseConnection,
  ): Promise<HeadcountReservation>;
  /** Called in the real left transaction; no missing occupancy is silently decremented. */
  releaseEmployee(
    input: HeadcountCommand & { employeeId: string },
    tx: DatabaseConnection,
  ): Promise<void>;
  /** Durable backfill for historical blocked sources; no capacity or employee mutation. */
  recoverReplacementNotifications(tx: DatabaseConnection): Promise<void>;
  /** Recheck real restored employee statuses; returns blocked future claims for upstream notifications. */
  invalidateReplacements(
    input: HeadcountCommand & { employeeId: string },
    tx: DatabaseConnection,
  ): Promise<readonly HeadcountSource[]>;
  /** Moves unconsumed ordinary allocation only; target yearly account must be initialized and have capacity. */
  rebind(
    input: HeadcountCommand & HeadcountSource & { targetAccountId: string },
    tx: DatabaseConnection,
  ): Promise<HeadcountReservation>;
  /** Capacity-only half of effective transfer: caller must atomically write employee/org facts. */
  transfer(
    input: HeadcountCommand &
      HeadcountSource & { employeeId: string; sourceAccountId: string },
    tx: DatabaseConnection,
  ): Promise<HeadcountReservation>;
  balance(
    id: string,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<HeadcountBalance | null>;
  list(
    query: {
      page: number;
      pageSize: number;
      departmentId?: string;
      positionId?: string;
      year?: number;
      orderBy?: HeadcountSort;
      desc?: boolean;
    },
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<{ items: HeadcountBalance[]; total: number }>;
  journal(
    id: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
    query: { page: number; pageSize: number; desc?: boolean },
  ): Promise<{ items: readonly Record<string, unknown>[]; total: number }>;
}
export const headcountServiceToken = createServiceToken<HeadcountService>(
  'oa/headcount-service',
);
