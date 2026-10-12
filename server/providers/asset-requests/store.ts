import { AsyncLocalStorage } from 'node:async_hooks';
import type {
  DatabaseManager,
  DatabaseConnection,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import type { LifecycleStore, LifecycleRecord } from '@nocobase/lifecycle';
import { createAppLifecycleStore } from '../approval-runtime/repository-store.js';
import type {
  ApprovalDirectoryService,
  OaApprovalDirectory,
} from '../approval-directory/contract.js';
import { AssetError } from '../assets/errors.js';
export interface AssetTransactionServices {
  directory: OaApprovalDirectory;
  connection: DatabaseConnection;
  resumeEligible?: boolean;
}
/** Acquire the synchronous public directory fresh inside every real lifecycle transaction. */
export function createAssetRequestStore(
  db: DatabaseManager,
  directory: ApprovalDirectoryService,
) {
  const prepare = new AsyncLocalStorage<
    (tx: DatabaseConnection) => Promise<{ resumeEligible: boolean }>
  >();
  const readDirectory = new AsyncLocalStorage<OaApprovalDirectory>();
  const mutation = new AsyncLocalStorage<RepositoryPolicy>(),
    snapshots = new WeakMap<object, AssetTransactionServices>();
  const base = createAppLifecycleStore(db, {
    collections: {
      transitions: 'oaLifecycleTransitions',
      effectRuns: 'oaLifecycleEffectRuns',
    },
  });
  function wrap(store: LifecycleStore): LifecycleStore {
    return new Proxy(store, {
      get(target, key) {
        const policy = mutation.getStore();
        if (policy && key === 'createRecord')
          return async (
            collection: string,
            values: Readonly<Record<string, unknown>>,
          ) => {
            if (collection !== 'assetRequests')
              return target.createRecord(collection, values);
            const tx = target.transactionHandle as DatabaseConnection;
            await tx
              .repository(collection)
              .withPolicy(policy)
              .createOne({ values: values as RepositoryRecord });
            // Internal engine facts are read only after the actual mutation policy has accepted the write.
            // HTTP callers receive a separate read through their own projection policy.
            if (typeof values.id !== 'string')
              throw new AssetError(
                'ASSET_INVALID_COMMAND',
                'The application ID is missing.',
              );
            const record = await tx
              .repository<LifecycleRecord>(collection)
              .findOne({ filter: { id: values.id } });
            if (!record)
              throw new AssetError(
                'ASSET_SOURCE_MISSING',
                'The created application was not found.',
              );
            return record;
          };
        if (policy && key === 'updateRecordIf')
          return async (
            collection: string,
            id: string,
            condition: Parameters<LifecycleStore['updateRecordIf']>[2],
            values: Readonly<Record<string, unknown>>,
          ) => {
            if (collection !== 'assetRequests')
              return target.updateRecordIf(collection, id, condition, values);
            const tx = target.transactionHandle as DatabaseConnection;
            return (
              (
                await tx
                  .repository(collection)
                  .withPolicy(policy)
                  .updateMany({
                    filter: {
                      id,
                      [condition.stateField]: condition.state,
                      [condition.versionField]: condition.version,
                    },
                    values: values as RepositoryRecord,
                  })
              ).updatedCount > 0
            );
          };
        if (key === 'transaction')
          return async <R>(
            work: (tx: LifecycleStore) => Promise<R>,
            options?: Parameters<LifecycleStore['transaction']>[1],
          ) =>
            target.transaction(async (tx) => {
              const connection = tx.transactionHandle as DatabaseConnection;
              snapshots.set(connection, {
                connection,
                directory:
                  readDirectory.getStore() ??
                  (await directory.snapshot(connection)),
                ...(await prepare.getStore()?.(connection)),
              });
              return work(wrap(tx));
            }, options);
        const value: unknown = Reflect.get(target, key);
        return typeof value === 'function'
          ? (value as (...args: unknown[]) => unknown).bind(target)
          : value;
      },
    });
  }
  let outside: AssetTransactionServices | undefined;
  return {
    store: wrap(base),
    /** Pure SDK reads use one directory; mutations still load inside their transaction. */
    async withReadDirectory<T>(work: () => Promise<T>): Promise<T> {
      const snapshot = await directory.snapshot();
      return readDirectory.run(snapshot, work);
    },
    withPreparation<T>(
      load: (tx: DatabaseConnection) => Promise<{ resumeEligible: boolean }>,
      work: () => Promise<T>,
    ) {
      return prepare.run(load, work);
    },
    async refresh() {
      outside = {
        connection: db.connection(),
        directory: await directory.snapshot(),
      };
    },
    services(handle: unknown): AssetTransactionServices {
      const current =
        handle && typeof handle === 'object' ? snapshots.get(handle) : outside;
      if (!current)
        throw new AssetError(
          'ASSET_DIRECTORY_UNAVAILABLE',
          'A fresh approval directory is required.',
        );
      return current;
    },
    withMutationPolicy<T>(
      policy: RepositoryPolicy | undefined,
      work: () => Promise<T>,
    ) {
      return policy ? mutation.run(policy, work) : work();
    },
  };
}
