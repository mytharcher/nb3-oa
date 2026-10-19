import { createHash, randomUUID } from 'node:crypto';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryRecord,
} from '@nocobase/db';
import { currentDemo, demoContext, registerDemoUser } from './context.js';
import { demoCollections } from './collections.js';

export interface OwnedRow extends RepositoryRecord {
  id: string;
  datasetId: string;
  collection: string;
  key: Record<string, unknown>;
  keyHash: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  shared: boolean;
}
export function rowFilter(
  key: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(key).map(([field, value]) => {
      if (
        value !== null &&
        !['string', 'number', 'boolean'].includes(typeof value)
      )
        throw new Error('DEMO_INVALID_ROW_KEY');
      return [field, value as string | number | boolean | null];
    }),
  );
}
export const hashKey = (key: Record<string, unknown>): string =>
  createHash('sha256')
    .update(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(key).sort(([a], [b]) => a.localeCompare(b)),
        ),
      ),
    )
    .digest('hex');

/** Must be called while holding the owning business transaction's lock, before its shared write. */
export async function rememberShared(
  tx: DatabaseConnection,
  collection: string,
  key: Record<string, unknown>,
) {
  const scope = currentDemo();
  if (!scope || scope.removing) return;
  // Lock only the shared configuration row; this increment of zero is not a business change.
  await demoContext.run({ ...scope, removing: true }, () =>
    tx.repository(collection).updateMany({
      filter: rowFilter(key),
      values: { version: { increment: 0 } },
    }),
  );
  const before = await tx
    .repository(collection)
    .findOne({ filter: rowFilter(key) });
  if (!before) return;
  key = before.id !== undefined ? { id: before.id } : key;
  const filter = { datasetId: scope.id, collection, keyHash: hashKey(key) };
  if (await tx.repository('demoDataRecords').exists({ filter })) return;
  if (before)
    await tx.repository('demoDataRecords').createOne({
      values: {
        id: randomUUID(),
        ...filter,
        key,
        before,
        after: before,
        shared: true,
      },
    });
}
export async function rememberUser(tx: DatabaseConnection, userId: string) {
  const scope = currentDemo();
  if (!scope) return;
  scope.users.add(userId);
  tx.afterCommit(() => {
    registerDemoUser(userId, scope);
  });
  await claim(tx, scope.id, '@user', { id: userId });
}
async function claim(
  tx: DatabaseConnection,
  datasetId: string,
  collection: string,
  key: Record<string, unknown>,
) {
  const filter = { datasetId, collection, keyHash: hashKey(key) };
  if (!(await tx.repository('demoDataRecords').exists({ filter })))
    await tx.repository('demoDataRecords').createOne({
      values: {
        id: randomUUID(),
        ...filter,
        key,
        before: null,
        after: null,
        shared: false,
      },
    });
}

/** Provenance is committed with each write, including rollback. No before/after database diff is used. */
export function installDemoOwnership(db: DatabaseManager): () => void {
  const supported = new Set<string>(demoCollections);
  return db.connection().onRepositoryMutation(
    {
      id: 'oa-demo-ownership',
      collections: [...demoCollections, 'auditLogs'],
      values: true,
    },
    {
      async inTransaction(event, tx) {
        const scope = currentDemo();
        if (scope?.retired) throw new Error('DEMO_DATA_REMOVED');
        if (scope?.removing) return;
        if (!scope) {
          if (event.granularity !== 'rows') return;
          const ids = new Set<string>();
          const collect = (v: unknown): void => {
            if (typeof v === 'string' && v.length >= 12 && v.length <= 128)
              ids.add(v);
            else if (Array.isArray(v)) v.forEach(collect);
            else if (v && typeof v === 'object')
              Object.values(v).forEach(collect);
          };
          event.changes
            .filter((c) => c.collection !== 'auditLogs' && c.kind !== 'deleted')
            .forEach((c) => collect(c.values));
          if (!ids.size) return;
          const hashes = [...ids].map((id) => hashKey({ id }));
          const live = await tx.repository('demoDataRecords').findMany({
            filter: (f) => f.or(hashes.map((h) => f.text('keyHash').eq(h))),
          });
          const retired = () =>
            tx.repository('demoDataRetiredReferences').exists({
              filter: (f) => f.or([...ids].map((id) => f.string('id').eq(id))),
            });
          if (!live.length && !(await retired())) return;
          // Only writes involving a demo identity acquire this gate. Normal business
          // records retain their existing locks and do not serialize on demo control.
          await tx.repository('demoDataControl').updateMany({
            filter: { id: 'main' },
            values: { version: { increment: 0 } },
          });
          const control = await tx
            .repository('demoDataControl')
            .findOne({ filter: { id: 'main' } });
          if (
            (await retired()) ||
            (control?.operation === 'remove' &&
              live.some((r) => r.datasetId === control.datasetId))
          )
            throw new Error('DEMO_REFERENCE_RETIRED');
          return;
        }
        if (!scope.operationToken) {
          const control = await tx
            .repository('demoDataControl')
            .findOne({ filter: { id: 'main' } });
          if (control?.datasetId === scope.id && control.operationId)
            throw new Error('DEMO_DATA_BUSY');
        }
        if (scope.operationToken) {
          const valid = await tx.repository('demoDataControl').exists({
            filter: {
              id: 'main',
              datasetId: scope.id,
              leaseToken: scope.operationToken,
            },
          });
          if (!valid) throw new Error('DEMO_OPERATION_FENCED');
        }
        if (event.granularity !== 'rows')
          throw new Error('DEMO_UNTRACKED_WRITE');
        for (const change of event.changes) {
          if (change.collection === 'auditLogs') {
            // The organization service intentionally uses QueryAdapter inserts. Its transactional
            // audit is the public provenance for those five inserts, not a post-import scan.
            const value = change.values;
            const collection =
              typeof value?.targetType === 'string' ? value.targetType : '';
            if (
              ['departments', 'positions', 'grades'].includes(collection) &&
              String(value?.action).endsWith('.create')
            )
              await claim(tx, scope.id, collection, { id: value?.targetId });
            if (
              ['departmentMembers', 'dutyRoleMembers'].includes(collection) &&
              String(value?.action).endsWith('.add')
            ) {
              const after = value?.after as Record<string, unknown>;
              const filter =
                collection === 'departmentMembers'
                  ? { departmentId: after.departmentId, userId: after.userId }
                  : { dutyRoleCode: after.dutyRoleCode, userId: after.userId };
              const row = await tx
                .repository(collection)
                .findOne({ filter: rowFilter(filter) });
              if (row) await claim(tx, scope.id, collection, { id: row.id });
            }
            continue;
          }
          if (!supported.has(change.collection)) continue;
          const filter = {
            datasetId: scope.id,
            collection: change.collection,
            keyHash: hashKey({ ...change.key }),
          };
          if (change.kind === 'created') {
            await claim(tx, scope.id, change.collection, { ...change.key });
            continue;
          }
          const owned = await tx
            .repository<OwnedRow>('demoDataRecords')
            .findOne({ filter });
          if (!owned)
            throw new Error(`DEMO_SHARED_WRITE_REFUSED:${change.collection}`);
          if (change.kind === 'deleted' && !owned.shared) {
            await tx.repository('demoDataRecords').deleteMany({ filter });
          }
          if (owned.shared) {
            const after = await tx
              .repository(change.collection)
              .findOne({ filter: rowFilter({ ...change.key }) });
            await tx.repository('demoDataRecords').updateOne({
              filter: { id: owned.id },
              values: { after: after ?? null },
            });
          }
        }
      },
    },
  );
}

/** Readable names are never evidence that a row belongs to this batch. */
export async function assertDemoOwnership(
  tx: DatabaseConnection,
  collection: string,
  id: unknown,
): Promise<void> {
  const scope = currentDemo();
  if (!scope) return;
  if (
    typeof id !== 'string' ||
    !(await tx.repository('demoDataRecords').exists({
      filter: { datasetId: scope.id, collection, keyHash: hashKey({ id }) },
    }))
  )
    throw new Error('DEMO_RESOURCE_COLLISION');
}
