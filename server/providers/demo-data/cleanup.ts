import { randomUUID } from 'node:crypto';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { databaseManagerToken } from '@nocobase/db';
import type { Application } from '@nocobase/app-server/application';
import {
  type DatabaseConnection,
  type RepositoryMutationScalarValue,
} from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { demoCollections } from './collections.js';
import { hashKey, rowFilter, type OwnedRow } from './ownership.js';
import { demoError } from './errors.js';
import { demoContexts } from './context.js';

export const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
export function references(value: unknown, ids: Set<string>): boolean {
  if (typeof value === 'string') return ids.has(value);
  if (Array.isArray(value)) return value.some((v) => references(v, ids));
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.values(value).some((v) => references(v, ids))
  );
}
export async function ownedRows(
  tx: DatabaseConnection,
  datasetId: string,
): Promise<OwnedRow[]> {
  return tx
    .repository<OwnedRow>('demoDataRecords')
    .findMany({ filter: { datasetId } });
}
/** Conservative semantic-reference check, including JSON links used by OA modules.
 * Audit history and monotonically allocated document sequences are intentionally retained. */
export async function cleanupBlocked(
  tx: DatabaseConnection,
  datasetId: string,
): Promise<boolean> {
  const owned = await ownedRows(tx, datasetId);
  const ids = new Set(
    owned
      .filter((r) => !r.shared)
      .flatMap((r) => Object.values(r.key))
      .filter((v): v is string => typeof v === 'string' && v.length >= 12),
  );
  const byCollection = new Map<string, Set<string>>();
  for (const r of owned) {
    if (!byCollection.has(r.collection))
      byCollection.set(r.collection, new Set());
    byCollection.get(r.collection)!.add(r.keyHash);
    if (r.shared) {
      const current = await tx
        .repository(r.collection)
        .findOne({ filter: rowFilter(r.key) });
      if (canonical(current ?? null) !== canonical(r.after)) return true;
    }
  }
  for (const collection of demoCollections) {
    const definition = await tx.collections.get(collection);
    if (!definition) continue;
    const pk = definition.constraints?.find((c) => c.type === 'primary');
    const keyFields =
      pk && 'fields' in pk
        ? pk.fields
        : (definition.fields?.filter((f) => f.primaryKey).map((f) => f.name) ??
          []);
    if (!keyFields.length) continue;
    // Scan page by page. This is an infrequent destructive preflight, not a business list.
    for (let offset = 0; ; offset += 250) {
      const rows = await tx
        .repository(collection)
        .findMany({ limit: 250, offset });
      for (const row of rows) {
        const key = Object.fromEntries(
          keyFields.map((field) => [field, row[field]]),
        );
        if (byCollection.get(collection)?.has(hashKey(key))) continue;
        if (references(row, ids)) return true;
      }
      if (rows.length < 250) break;
    }
  }
  return false;
}

/** Deletes only transactionally registered application rows. Plugin identities and
 * assignments use their public services; security/audit history is retained. */
export async function removeOwnedDemo(
  app: Application,
  datasetId: string,
  actorId: string,
  tx: DatabaseConnection,
) {
  if (await cleanupBlocked(tx, datasetId)) demoError('DEMO_REFERENCE_CONFLICT');
  const owned = await ownedRows(tx, datasetId);
  // A durable reference tombstone closes the race with a writer that started
  // before this transaction and reaches its mutation hook after we commit.
  for (const id of new Set(
    owned
      .filter((r) => !r.shared)
      .flatMap((r) => Object.values(r.key))
      .filter((v): v is string => typeof v === 'string' && v.length >= 12),
  )) {
    if (
      !(await tx
        .repository('demoDataRetiredReferences')
        .exists({ filter: { id } }))
    )
      await tx
        .repository('demoDataRetiredReferences')
        .createOne({ values: { id, datasetId } });
  }
  for (const r of owned.filter((r) => r.shared))
    await tx.repository(r.collection).updateOne({
      filter: rowFilter(r.key),
      values: (r.before ?? {}) as Record<string, RepositoryMutationScalarValue>,
    });
  // Persist physical deletions before removing metadata. A failed disk operation
  // can be retried after restart without reviving accounts or deleting user files.
  for (const r of owned.filter((r) => !r.shared && r.collection !== '@user')) {
    const record = await tx
      .repository(r.collection)
      .findOne({ filter: rowFilter(r.key) });
    if (
      typeof record?.disk === 'string' &&
      typeof record.key === 'string' &&
      typeof record.filename === 'string' &&
      typeof record.mimeType === 'string'
    )
      await tx.repository('demoDataFileRemovals').createOne({
        values: {
          id: randomUUID(),
          datasetId,
          disk: record.disk,
          key: record.key,
          complete: false,
        },
      });
  }
  // Newest rows first gives dependent application records the first cleanup turn.
  for (const r of owned
    .filter((r) => !r.shared && r.collection !== '@user')
    .reverse())
    await tx.repository(r.collection).deleteMany({ filter: rowFilter(r.key) });
  const authz = app.container
    .resolve(authorizationToken)
    .permissionSets.withTransaction(tx);
  const users = app.container
    .resolve(userAdministrationServiceToken)
    .withConnection(tx);
  const ids = owned
    .filter((r) => r.collection === '@user')
    .map((r) => String(r.key.id));
  const assignments = await authz.listAssignments();
  for (const assignment of assignments)
    if (
      assignment.subject.type === 'user' &&
      ids.includes(assignment.subject.id)
    )
      await authz.revoke(assignment.id);
  for (const id of ids) {
    const user = await users.get(id);
    if (!user) continue;
    await users.revokeSessions(id);
    // Authentication retains its required historical tombstone and credentials are revoked.
    await users.remove(id, actorId);
    tx.afterCommit(() => {
      demoContexts.delete(id);
    });
  }
  await tx.repository('demoDataRecords').deleteMany({ filter: { datasetId } });
  // No raw plugin table cleanup or broad cascade is permitted here.
}

/** Uses the public Drive API only after the business cleanup transaction commits. */
export async function removeDemoFiles(
  app: Application,
  datasetId: string,
): Promise<void> {
  const db = app.container.resolve(databaseManagerToken),
    drive = app.container.resolve(driveManagerToken);
  const pending = await db
    .repository<{
      id: string;
      datasetId: string;
      disk: string;
      key: string;
      complete: boolean;
    }>('demoDataFileRemovals')
    .findMany({ filter: { datasetId, complete: false } });
  for (const file of pending) {
    const disk = drive.use(file.disk);
    if (await disk.exists(file.key)) await disk.delete(file.key);
    await db
      .repository('demoDataFileRemovals')
      .updateOne({ filter: { id: file.id }, values: { complete: true } });
  }
}
