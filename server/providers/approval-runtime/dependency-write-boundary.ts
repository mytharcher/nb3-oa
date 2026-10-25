import type { ApprovalService } from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection } from '@nocobase/db';
import type { LifecycleRuntime } from '@nocobase/lifecycle';
import type { ApprovalStatisticsChanges } from './statistics-contract.js';
import {
  appLifecycleTransaction,
  withAppLifecycleTransaction,
} from './repository-store.js';
import {
  DelegationBoundaryRequired,
  withDelegationAttempt,
} from './delegation-write-context.js';

/** Ordinary writes stay local. A real delegation mutation aborts that atomic
 * attempt and retries once with all gates acquired before business locks. */
export function installDelegationWriteBoundary(
  runtime: LifecycleRuntime,
  approvals: ApprovalService,
  changes: ApprovalStatisticsChanges,
  business: string,
): () => void {
  const within = <T>(
    work: () => Promise<T>,
    transaction?: unknown,
  ): Promise<T> =>
    appLifecycleTransaction()
      ? work()
      : changes.guard(
          (connection) =>
            withDelegationAttempt(false, () =>
              withAppLifecycleTransaction(connection, work),
            ),
          transaction as DatabaseConnection | undefined,
        );
  const attempt = async <T>(
    local: () => Promise<T>,
    guarded: () => Promise<T>,
    transaction?: unknown,
  ): Promise<T> => {
    if (appLifecycleTransaction()) return local();
    try {
      return await withDelegationAttempt(true, () =>
        changes.guard(
          (connection) => withAppLifecycleTransaction(connection, local),
          transaction as DatabaseConnection | undefined,
          [business],
        ),
      );
    } catch (error) {
      if (!(error instanceof DelegationBoundaryRequired)) throw error;
      return guarded();
    }
  };
  const fire = runtime.fire.bind(runtime);
  const create = runtime.create.bind(runtime);
  const perform = approvals.perform.bind(approvals);
  const sweepReport = approvals.sweepReport.bind(approvals);
  runtime.fire = (name, id, transition, options) => {
    const joined = appLifecycleTransaction();
    // An external transaction is wrapped in a savepoint by guard. Use that
    // child, rather than opening a sibling while the guard's child is active.
    // Calls already inside a lifecycle boundary retain explicit SDK children.
    const transaction = () =>
      joined
        ? (options.transaction ?? joined)
        : (appLifecycleTransaction() ?? options.transaction);
    return attempt(
      () =>
        fire(name, id, transition, {
          ...options,
          transaction: transaction(),
        }),
      () =>
        within(
          () =>
            fire(name, id, transition, {
              ...options,
              transaction: transaction(),
            }),
          options.transaction,
        ),
      options.transaction,
    );
  };
  runtime.create = (name, values, options) => {
    const joined = appLifecycleTransaction();
    const transaction = () =>
      joined
        ? (options.transaction ?? joined)
        : (appLifecycleTransaction() ?? options.transaction);
    return attempt(
      () =>
        create(name, values, {
          ...options,
          transaction: transaction(),
        }),
      () =>
        within(
          () =>
            create(name, values, {
              ...options,
              transaction: transaction(),
            }),
          options.transaction,
        ),
      options.transaction,
    );
  };
  // These owners' effects deliver notifications after commit. runEffect reads
  // and claims its journal through the root store and may perform external I/O;
  // holding every source gate around it can exhaust the pool with gate waiters.
  // Delegation mutations remain guarded at create/fire/perform/sweep boundaries.
  approvals.perform = (...args) =>
    attempt(
      () => perform(...args),
      () => within(() => perform(...args)),
    );
  approvals.sweepReport = (...args) => within(() => sweepReport(...args));
  return () => {
    runtime.fire = fire;
    runtime.create = create;
    approvals.perform = perform;
    approvals.sweepReport = sweepReport;
  };
}
