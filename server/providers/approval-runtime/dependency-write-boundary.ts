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
  const runEffect = runtime.runEffect.bind(runtime);
  const perform = approvals.perform.bind(approvals);
  const sweepReport = approvals.sweepReport.bind(approvals);
  runtime.fire = (name, id, transition, options) =>
    attempt(
      () =>
        fire(name, id, transition, {
          ...options,
          transaction: options.transaction ?? appLifecycleTransaction(),
        }),
      () =>
        within(
          () =>
            fire(name, id, transition, {
              ...options,
              transaction: options.transaction ?? appLifecycleTransaction(),
            }),
          options.transaction,
        ),
      options.transaction,
    );
  runtime.create = (name, values, options) =>
    attempt(
      () =>
        create(name, values, {
          ...options,
          transaction: options.transaction ?? appLifecycleTransaction(),
        }),
      () =>
        within(
          () =>
            create(name, values, {
              ...options,
              transaction: options.transaction ?? appLifecycleTransaction(),
            }),
          options.transaction,
        ),
      options.transaction,
    );
  runtime.runEffect = (...args) => within(() => runEffect(...args));
  approvals.perform = (...args) =>
    attempt(
      () => perform(...args),
      () => within(() => perform(...args)),
    );
  approvals.sweepReport = (...args) => within(() => sweepReport(...args));
  return () => {
    runtime.fire = fire;
    runtime.create = create;
    runtime.runEffect = runEffect;
    approvals.perform = perform;
    approvals.sweepReport = sweepReport;
  };
}
