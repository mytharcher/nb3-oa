import type { DatabaseConnection } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';

export interface ApprovalStatisticsChange {
  /** Application approval kinds, not collection names or plugin table identifiers. */
  kinds: 'all' | readonly string[];
  /** Include both previous and new principals/delegates/owners. */
  userIds: readonly string[];
  reason: string;
}

export interface ApprovalStatisticsChanges {
  /** Acquire the selected gates (all by default) before business/delegation writes.
   * Only actual dependency changes inside work trigger synchronization. */
  guard<T>(
    work: (connection: DatabaseConnection) => Promise<T>,
    connection?: DatabaseConnection,
    kinds?: 'all' | readonly string[],
  ): Promise<T>;
  /** Acquire source gates before business locks, then recompute after final writes.
   * An existing transaction must be passed before taking conflicting business locks. */
  change<T>(
    change: ApprovalStatisticsChange,
    work: (connection: DatabaseConnection) => Promise<T>,
    connection?: DatabaseConnection,
  ): Promise<T>;
  recompute(
    change: ApprovalStatisticsChange,
    connection?: DatabaseConnection,
  ): Promise<void>;
  /** Replace this dependency's future boundaries atomically with its business write. */
  replaceBoundaries(
    key: string,
    change: ApprovalStatisticsChange,
    at: readonly string[],
    connection: DatabaseConnection,
  ): Promise<void>;
  /** Dispatch only persisted time changes; never scan/rebuild statistics rows. */
  processDue(options?: {
    limit?: number;
    signal?: AbortSignal;
  }): Promise<number>;
}

export const approvalStatisticsChangesToken =
  createServiceToken<ApprovalStatisticsChanges>(
    'oa/approval-statistics-changes',
  );
