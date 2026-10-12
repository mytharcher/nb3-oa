import { processDirectorySnapshot } from '../process-management/context.js';
import type { ContractLedgerService } from '../contracts/contract.js';
import { createAppLifecycleStore } from '../approval-runtime/repository-store.js';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import { type LifecycleRecord, type LifecycleStore } from '@nocobase/lifecycle';
import type { AsyncLocalStorage } from 'node:async_hooks';
import type {
  ApprovalDirectoryService,
  OaApprovalDirectory,
} from '../approval-directory/contract.js';
import type { PurchaseOrderService } from '../purchases/contract.js';
import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { PaymentRequestRecord } from './contract.js';
import { PaymentRequestError } from './errors.js';

export interface PaymentMutation {
  recordId: string;
  transition?: string;
  actorId?: string;
  action?: string;
  nextOrderId?: string | null;
  nextContractId?: string | null;
}
/** Public LifecycleStore transaction adapter, shared by runtime.fire and ApprovalService.perform.
 * PerformInput has no transaction option. The prelude executes before the SDK's work callback can lock tasks. */
export function createPaymentLifecycleStore(d: {
  db: DatabaseManager;
  directory: ApprovalDirectoryService;
  orders: PurchaseOrderService;
  contracts: ContractLedgerService;
  policy: AsyncLocalStorage<RepositoryPolicy>;
  mutation: AsyncLocalStorage<PaymentMutation>;
  maintenance: AsyncLocalStorage<boolean>;
  prepareSubmission(
    record: PaymentRequestRecord,
    connection: DatabaseConnection,
    actorId: string,
  ): Promise<boolean>;
}) {
  const snapshots = new WeakMap<
    object,
    {
      directory: OaApprovalDirectory;
      connection: DatabaseConnection;
      submissionFullApprovalRequired?: boolean;
    }
  >();
  const base = createAppLifecycleStore(d.db, {
    collections: {
      transitions: 'oaLifecycleTransitions',
      effectRuns: 'oaLifecycleEffectRuns',
    },
  });
  const normalize = (r: LifecycleRecord): PaymentRequestRecord => {
    const result = { ...r } as PaymentRequestRecord;
    for (const name of [
      'amountCents',
      'sourceHeldCents',
      'sourceApprovedCents',
      'sourceCumulativeCents',
    ] as const) {
      if (r[name] === null) continue;
      const value = Number(r[name]);
      if (!Number.isSafeInteger(value) || value < 0)
        throw new PaymentRequestError(
          'PAYMENT_REQUEST_INVALID_AMOUNT',
          'Stored payment amounts must be exact integer cents.',
        );
      result[name] = value;
    }
    return result;
  };
  function wrap(store: LifecycleStore): LifecycleStore {
    return new Proxy(store, {
      get(target, key) {
        if (key === 'findRecord')
          return async (collection: string, id: string | number) => {
            const record = await target.findRecord(collection, id);
            return collection === 'paymentRequests' && record
              ? normalize(record)
              : record;
          };
        if (key === 'createRecord')
          return async (
            collection: string,
            values: Readonly<Record<string, unknown>>,
          ) => {
            const policy = d.policy.getStore();
            if (collection !== 'paymentRequests' || !policy) {
              const record = await target.createRecord(collection, values);
              return collection === 'paymentRequests'
                ? normalize(record)
                : record;
            }
            const tx = target.transactionHandle as DatabaseConnection;
            const row = await tx
              .repository(collection)
              .withPolicy(policy)
              .createOne({ values: values as RepositoryRecord });
            if (row.record.id === undefined)
              throw new PaymentRequestError(
                'PAYMENT_REQUEST_FIELDS_RESTRICTED',
                'The grant must expose the created payment.',
                'permission',
              );
            return normalize(row.record as LifecycleRecord);
          };
        if (key === 'updateRecordIf')
          return async (
            collection: string,
            id: string,
            condition: Parameters<LifecycleStore['updateRecordIf']>[2],
            values: Readonly<Record<string, unknown>>,
          ) => {
            const policy = d.policy.getStore();
            if (collection !== 'paymentRequests' || !policy)
              return target.updateRecordIf(collection, id, condition, values);
            const tx = target.transactionHandle as DatabaseConnection;
            const result = await tx
              .repository(collection)
              .withPolicy(policy)
              .updateMany({
                filter: {
                  id,
                  [condition.stateField]: condition.state,
                  [condition.versionField]: condition.version,
                },
                values: values as RepositoryRecord,
              });
            return result.updatedCount > 0;
          };
        if (key === 'transaction')
          return async <R>(
            work: (store: LifecycleStore) => Promise<R>,
            options?: Parameters<LifecycleStore['transaction']>[1],
          ) =>
            target.transaction(async (tx) => {
              const connection = tx.transactionHandle as DatabaseConnection;
              const mutation = d.mutation.getStore();
              let submissionFullApprovalRequired: boolean | undefined;
              if (d.maintenance.getStore()) {
                // sweepReport exposes no record-targeted public API. Prelock its
                // whole active business set before SDK work can lock clock tasks.
                const repo =
                  connection.repository<PaymentRequestRecord>(
                    'paymentRequests',
                  );
                const before = await repo.findMany({
                  filter: (f) =>
                    f.or(
                      ['head', 'finance', 'executive', 'gm', 'cashier'].map(
                        (state) => f.string('status').eq(state),
                      ),
                    ),
                });
                // Canonical source-kind ordering: contracts, then purchase orders, before users/payments.
                await d.contracts.lockSources(
                  before
                    .flatMap((r) => [r.sourceContractId, r.contractId])
                    .filter((id): id is string => Boolean(id)),
                  connection,
                );
                await d.orders.lockPaymentSources(
                  before
                    .flatMap((record) => [
                      record.sourceOrderId,
                      record.purchaseOrderId,
                    ])
                    .filter((id): id is string => Boolean(id)),
                  connection,
                );
                for (const applicant of [
                  ...new Set(before.map((record) => record.applicantId)),
                ].sort())
                  await lockUserForAdministration(connection, applicant);
                for (const record of before.sort((a, b) =>
                  a.id.localeCompare(b.id),
                )) {
                  const locked = await repo.updateMany({
                    filter: {
                      id: record.id,
                      lifecycleVersion: record.lifecycleVersion,
                      status: record.status,
                    },
                    values: { status: record.status },
                  });
                  const fresh = await repo.findOne({
                    filter: { id: record.id },
                  });
                  if (
                    !locked.updatedCount ||
                    !fresh ||
                    fresh.lifecycleVersion !== record.lifecycleVersion ||
                    fresh.purchaseOrderId !== record.purchaseOrderId ||
                    fresh.sourceOrderId !== record.sourceOrderId ||
                    fresh.sourceContractId !== record.sourceContractId ||
                    fresh.contractId !== record.contractId
                  )
                    throw new PaymentRequestError(
                      'PAYMENT_REQUEST_SOURCE_STALE',
                      'A payment source changed during maintenance prelocking. Retry the maintenance job.',
                      'conflict',
                    );
                }
              }
              if (mutation) {
                const repo =
                  connection.repository<PaymentRequestRecord>(
                    'paymentRequests',
                  );
                const before = await repo.findOne({
                  filter: { id: mutation.recordId },
                });
                if (!before)
                  throw new PaymentRequestError(
                    'PAYMENT_REQUEST_NOT_FOUND',
                    'Payment request not found.',
                    'notFound',
                  );
                await d.contracts.lockSources(
                  [
                    before.sourceContractId,
                    before.contractId,
                    mutation.nextContractId,
                  ].filter((id): id is string => Boolean(id)),
                  connection,
                );
                await d.orders.lockPaymentSources(
                  [
                    before.sourceOrderId,
                    before.purchaseOrderId,
                    mutation.nextOrderId,
                  ].filter((id): id is string => Boolean(id)),
                  connection,
                );
                await lockUserForAdministration(connection, before.applicantId);
                const locked = await repo.updateMany({
                  filter: {
                    id: before.id,
                    lifecycleVersion: before.lifecycleVersion,
                    status: before.status,
                  },
                  values: { status: before.status },
                });
                const after = await repo.findOne({ filter: { id: before.id } });
                if (
                  !locked.updatedCount ||
                  !after ||
                  after.lifecycleVersion !== before.lifecycleVersion ||
                  after.sourceOrderId !== before.sourceOrderId ||
                  after.purchaseOrderId !== before.purchaseOrderId ||
                  after.sourceContractId !== before.sourceContractId ||
                  after.contractId !== before.contractId
                )
                  throw new PaymentRequestError(
                    'PAYMENT_REQUEST_SOURCE_STALE',
                    'The payment source changed while its source locks were acquired. Reload before acting.',
                    'conflict',
                  );
                if (
                  mutation.transition === 'submit' &&
                  ['draft', 'revision'].includes(after.status)
                )
                  submissionFullApprovalRequired = await d.prepareSubmission(
                    normalize(after),
                    connection,
                    mutation.actorId!,
                  );
              }
              snapshots.set(connection, {
                directory: await processDirectorySnapshot(
                  d.directory,
                  'oa.payment',
                  connection,
                ),
                connection,
                submissionFullApprovalRequired,
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
  return { store: wrap(base), snapshots, normalize };
}
