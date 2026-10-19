import { demoNow } from '../demo-data/context.js';
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import { AssetError } from '../assets/errors.js';
interface StoredCommand {
  id: string;
  actorId: string;
  requestKey: string;
  recordId: string;
  fingerprint: string;
  createdAt: Date;
}
const canonical = (value: unknown) =>
  JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
/** Public approval SDK dedupes request IDs without comparing payloads. Reserve before invoking it. */
export function createAssetRequestJournal(
  db: DatabaseManager,
  audit: Pick<AuditService, 'record'>,
) {
  return {
    async reserve(command: {
      actorId: string;
      requestId: string;
      recordId?: string;
      operation: string;
      payload: unknown;
    }): Promise<{ recordId: string }> {
      if (
        !command.actorId ||
        !command.requestId ||
        command.requestId.length > 128
      )
        throw new AssetError(
          'ASSET_INVALID_COMMAND',
          'An actor and stable request ID are required.',
        );
      const id = createHash('sha256')
        .update(JSON.stringify([command.actorId, command.requestId]))
        .digest('hex');
      const fingerprint = canonical({
        operation: command.operation,
        payload: command.payload,
      });
      function verify(row: StoredCommand) {
        if (
          row.actorId !== command.actorId ||
          row.requestKey !== command.requestId ||
          row.fingerprint !== fingerprint ||
          (command.recordId !== undefined && row.recordId !== command.recordId)
        )
          throw new AssetError(
            'ASSET_REQUEST_REUSED',
            'This request ID is bound to another asset command.',
            'conflict',
          );
        return { recordId: row.recordId };
      }
      try {
        return await db.transaction(async (tx) => {
          const repo = tx.repository<StoredCommand>('assetRequestCommands');
          const previous = await repo.findOne({ filter: { id } });
          if (previous) return verify(previous);
          const recordId = command.recordId ?? randomUUID();
          await repo.createOne({
            values: {
              id,
              actorId: command.actorId,
              requestKey: command.requestId,
              recordId,
              fingerprint,
              createdAt: demoNow(),
            },
          });
          await audit.record(
            {
              actorId: command.actorId,
              action: 'assetRequest.commandReserved',
              targetType: 'assetRequests',
              targetId: recordId,
              reason: 'Bind an immutable asset request command',
              after: {
                operation: command.operation,
                requestId: command.requestId,
              },
            },
            tx,
          );
          return { recordId };
        });
      } catch (cause) {
        // Reconcile concurrent unique-key losers outside their aborted PostgreSQL transaction.
        const row = await db
          .repository<StoredCommand>('assetRequestCommands')
          .findOne({ filter: { id } });
        if (row) return verify(row);
        throw cause;
      }
    },
  };
}
