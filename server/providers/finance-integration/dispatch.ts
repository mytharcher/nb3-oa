import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type {
  FinanceEnvelope,
  FinanceGatewayResult,
  FinanceGateway,
} from './gateway.js';

export interface FinanceDispatch {
  id: string;
  kind: 'reimbursement' | 'payment';
  recordId: string;
  destination: string;
  idempotencyKey: string;
  payloadHash: string;
  payload: FinanceEnvelope;
  state: 'pending' | 'sending' | 'accepted' | 'posted' | 'rejected' | 'unknown';
  externalId: string | null;
  voucherNumber: string | null;
  resultCode: string | null;
  attempts: number;
  leaseToken: string | null;
  leaseUntil: Date | string | null;
  actorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
const collection = 'financeIntegrationDispatches';
export function financeDispatchId(kind: string, recordId: string) {
  return createHash('sha256')
    .update(JSON.stringify([kind, recordId]))
    .digest('hex');
}
export class FinanceDispatchConflict extends Error {
  constructor() {
    super(
      'Finance facts or destination changed after dispatch. Reconcile the existing external entry first.',
    );
  }
}

/** Internal persistence boundary. The calling application facade must authorize the current source record first. */
export function createFinanceDispatcher(
  db: DatabaseConnection,
  audit: AuditService,
  clock: () => Date = () => new Date(),
) {
  async function read(kind: string, recordId: string) {
    return db
      .repository<FinanceDispatch>(collection)
      .findOne({ filter: { id: financeDispatchId(kind, recordId) } });
  }
  async function dispatch(
    envelope: FinanceEnvelope,
    destination: string,
    actorId: string,
    gateway: Pick<FinanceGateway, 'submit' | 'lookup'>,
    mode: 'submit' | 'lookup',
  ) {
    const now = clock(),
      id = financeDispatchId(envelope.source.kind, envelope.source.id),
      leaseToken = randomUUID();
    const claim = await db.transaction(async (tx) => {
      const repository = tx.repository<FinanceDispatch>(collection);
      // The upsert's write lock serializes first creation and concurrent retry claims.
      await repository.upsertOne({
        filter: { id },
        create: {
          id,
          kind: envelope.source.kind,
          recordId: envelope.source.id,
          destination,
          idempotencyKey: envelope.idempotencyKey,
          payloadHash: envelope.payloadHash,
          payload: envelope,
          state: 'pending',
          externalId: null,
          voucherNumber: null,
          resultCode: null,
          attempts: 0,
          leaseToken: null,
          leaseUntil: null,
          actorId,
          createdAt: now,
          updatedAt: now,
        },
        update: { id },
      });
      const current = (await repository.findOne({ filter: { id } }))!;
      if (
        current.destination !== destination ||
        current.payloadHash !== envelope.payloadHash ||
        current.idempotencyKey !== envelope.idempotencyKey
      )
        throw new FinanceDispatchConflict();
      if (
        current.state === 'posted' ||
        (current.leaseToken &&
          current.leaseUntil &&
          new Date(current.leaseUntil).getTime() > now.getTime())
      )
        return { execute: false as const, record: current };
      await repository.updateOne({
        filter: { id },
        values: {
          state: current.state === 'accepted' ? 'accepted' : 'sending',
          leaseToken,
          leaseUntil: new Date(now.getTime() + 60000),
          actorId,
          attempts: current.attempts + 1,
          updatedAt: now,
        },
      });
      const record = (await repository.findOne({ filter: { id } }))!;
      await audit.record(
        {
          actorId,
          action: `financeIntegration.${mode}`,
          targetType: collection,
          targetId: id,
          before: { state: current.state },
          after: {
            state: record.state,
            attempt: record.attempts,
            payloadHash: current.payloadHash,
          },
        },
        tx,
      );
      return { execute: true as const, record };
    });
    if (!claim.execute) return claim.record;
    let result: FinanceGatewayResult;
    try {
      result =
        mode === 'submit'
          ? await gateway.submit(claim.record.payload)
          : await gateway.lookup(claim.record.payload);
    } catch {
      result = { state: 'unknown', code: 'transport' };
    }
    return db.transaction(async (tx) => {
      const repository = tx.repository<FinanceDispatch>(collection);
      // Serialize finalization with a new lease claim. An old response cannot overwrite a newer attempt.
      await repository.updateOne({ filter: { id }, values: { id } });
      const current = (await repository.findOne({ filter: { id } }))!;
      if (current.leaseToken !== leaseToken) return current;
      const confirmed =
        result.state === 'unknown' || result.state === 'not_found'
          ? undefined
          : result;
      const state =
        confirmed?.state ??
        (current.state === 'accepted' ? 'accepted' : 'unknown');
      await repository.updateOne({
        filter: { id },
        values: {
          state,
          externalId: confirmed
            ? (confirmed.externalId ?? current.externalId)
            : current.externalId,
          voucherNumber: confirmed
            ? (confirmed.voucherNumber ?? current.voucherNumber)
            : current.voucherNumber,
          resultCode: confirmed
            ? (confirmed.reasonCode ?? null)
            : result.state === 'unknown'
              ? result.code
              : 'not_found',
          leaseToken: null,
          leaseUntil: null,
          updatedAt: clock(),
        },
      });
      const record = (await repository.findOne({ filter: { id } }))!;
      await audit.record(
        {
          actorId,
          action: 'financeIntegration.result',
          targetType: collection,
          targetId: id,
          before: { state: current.state },
          after: {
            state,
            resultCode: record.resultCode,
            externalId: record.externalId,
            voucherNumber: record.voucherNumber,
          },
        },
        tx,
      );
      return record;
    });
  }
  return { read, dispatch };
}
