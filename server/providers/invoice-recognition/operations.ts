import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { InvoiceEnvelope, InvoiceResult } from './gateway.js';
export interface InvoiceOperation {
  id: string;
  operation: 'recognize' | 'verify';
  recordId: string;
  lineId: string;
  fileId: string;
  ownerId: string;
  destination: string;
  contentHash: string;
  envelope: InvoiceEnvelope;
  state: 'pending' | 'running' | InvoiceResult['state'];
  result: InvoiceResult | null;
  attempts: number;
  leaseToken: string | null;
  leaseUntil: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  receivedAt: string | Date | null;
}
const collection = 'invoiceRecognitionOperations';
export class InvoiceOperationConflict extends Error {
  constructor() {
    super('The invoice operation destination or facts changed.');
  }
}
/** Caller must freshly authorize the source and bytes. No file content is persisted in this boundary. */
export function createInvoiceOperations(
  db: DatabaseConnection,
  audit: AuditService,
  clock: () => Date = () => new Date(),
) {
  const read = (id: string) =>
    db.repository<InvoiceOperation>(collection).findOne({ filter: { id } });
  async function run(
    envelope: InvoiceEnvelope,
    destination: string,
    invoke: () => Promise<InvoiceResult>,
    mode: 'submit' | 'lookup',
    actorId: string = envelope.identity.actorId,
  ) {
    const id = envelope.operationKey,
      now = clock(),
      token = randomUUID();
    const claim = await db.transaction(async (tx) => {
      const repo = tx.repository<InvoiceOperation>(collection);
      await repo.upsertOne({
        filter: { id },
        create: {
          id,
          operation: envelope.operation,
          recordId: envelope.identity.recordId,
          lineId: envelope.identity.lineId,
          fileId: envelope.identity.fileId,
          ownerId: envelope.identity.actorId,
          destination,
          contentHash: envelope.contentHash,
          envelope,
          state: 'pending',
          result: null,
          attempts: 0,
          leaseToken: null,
          leaseUntil: null,
          createdAt: now,
          updatedAt: now,
          receivedAt: null,
        },
        update: { id },
      });
      const current = (await repo.findOne({ filter: { id } }))!;
      if (
        current.destination !== destination ||
        current.contentHash !== envelope.contentHash
      )
        throw new InvoiceOperationConflict();
      if (
        (current.result?.state !== undefined &&
          current.result.state !== 'unknown') ||
        (current.leaseUntil &&
          new Date(current.leaseUntil).getTime() > now.getTime())
      )
        return { execute: false, record: current };
      await repo.updateOne({
        filter: { id },
        values: {
          state: 'running',
          leaseToken: token,
          leaseUntil: new Date(now.getTime() + 60000),
          attempts: current.attempts + 1,
          updatedAt: now,
        },
      });
      await audit.record(
        {
          actorId,
          action: `invoiceRecognition.${mode}`,
          targetType: collection,
          targetId: id,
          before: { state: current.state },
          after: {
            state: 'running',
            contentHash: envelope.contentHash,
            attempt: current.attempts + 1,
          },
        },
        tx,
      );
      return {
        execute: true,
        record: (await repo.findOne({ filter: { id } }))!,
      };
    });
    if (!claim.execute) return claim.record;
    let result: InvoiceResult;
    try {
      result = await invoke();
    } catch {
      result = { state: 'unknown', code: 'transport' };
    }
    return db.transaction(async (tx) => {
      const repo = tx.repository<InvoiceOperation>(collection);
      await repo.updateOne({ filter: { id }, values: { id } });
      const current = (await repo.findOne({ filter: { id } }))!;
      if (current.leaseToken !== token) return current;
      const receivedAt = clock();
      await repo.updateOne({
        filter: { id },
        values: {
          state: result.state,
          result,
          receivedAt,
          updatedAt: receivedAt,
          leaseToken: null,
          leaseUntil: null,
        },
      });
      await audit.record(
        {
          actorId,
          action: 'invoiceRecognition.result',
          targetType: collection,
          targetId: id,
          before: { state: current.state },
          after: { state: result.state, contentHash: envelope.contentHash },
        },
        tx,
      );
      return (await repo.findOne({ filter: { id } }))!;
    });
  }
  return { read, run };
}
