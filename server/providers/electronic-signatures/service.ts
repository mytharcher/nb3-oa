import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { ServerFileRepositoryManager } from '@nocobase/app-plugin-file/server';
import type { AuditService } from '../audit/index.js';
import type {
  SignatureSourceAccess,
  SignatureSourceService,
  SignatureSource,
} from './contract.js';
import {
  signatureEnvelope,
  digest,
  type SignatureEnvelope,
  type SignatureGateway,
  type SignatureReceipt,
} from './gateway.js';
export interface SignatureRecord {
  id: string;
  kind: 'contract' | 'seal';
  recordId: string;
  sourceVersion: string;
  destination: string;
  idempotencyKey: string;
  payloadHash: string;
  documentHash: string;
  payload: SignatureEnvelope;
  state:
    | 'pending'
    | 'sending'
    | 'accepted'
    | 'signing'
    | 'unknown'
    | 'archivePending'
    | 'archived'
    | 'rejected'
    | 'cancelled';
  externalId: string | null;
  signingPath: string | null;
  signedHash: string | null;
  fileId: string | null;
  resultCode: string | null;
  leaseToken: string | null;
  leaseUntil: Date | string | null;
  signedAt: Date | string | null;
  archivedAt: Date | string | null;
  actorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
export interface SignatureConfig {
  enabled: boolean;
  instanceId: string;
  baseUrl: string;
  token: string;
}
export const signatureRecordId = (
  source: Pick<SignatureSource, 'kind' | 'id' | 'version'>,
) => digest(JSON.stringify([source.kind, source.id, source.version]));
export function createSignatureService(
  db: DatabaseConnection,
  audit: AuditService,
  files: ServerFileRepositoryManager,
) {
  const collection = 'signatureEnvelopes';
  async function source(
    owner: SignatureSourceService,
    id: string,
    actor: string,
    access: SignatureSourceAccess,
    send: boolean,
  ) {
    return db.transaction((tx) => owner.source(id, actor, access, tx, send));
  }
  async function read(value: SignatureSource) {
    return db
      .repository<SignatureRecord>(collection)
      .findOne({ filter: { id: signatureRecordId(value) } });
  }
  async function recordAudit(
    tx: DatabaseConnection,
    row: SignatureRecord,
    action: string,
    actor: string,
  ) {
    await audit.record(
      {
        actorId: actor,
        action: `electronicSignature.${action}`,
        targetType: collection,
        targetId: row.id,
        after: {
          state: row.state,
          sourceId: row.recordId,
          documentHash: row.documentHash,
        },
        reason: null,
      },
      tx,
    );
  }
  async function execute(
    owner: SignatureSourceService,
    id: string,
    actor: string,
    access: SignatureSourceAccess,
    config: SignatureConfig,
    gateway: Pick<SignatureGateway, 'submit' | 'lookup' | 'document'>,
    mode: 'submit' | 'lookup',
  ) {
    const lease = randomUUID(),
      destination = digest(
        JSON.stringify([config.instanceId, new URL(config.baseUrl).href]),
      );
    const claim = await db.transaction(async (tx) => {
      const value = await owner.source(id, actor, access, tx, false),
        key = signatureRecordId(value),
        repo = tx.repository<SignatureRecord>(collection),
        old = await repo.findOne({ filter: { id: key } });
      if (old?.state === 'archived')
        return { execute: false as const, row: old, source: value };
      if (mode === 'lookup' && !old) throw new Error('SIGNATURE_NOT_SENT');
      await owner.source(
        id,
        actor,
        access,
        tx,
        mode === 'lookup' ? 'recover' : true,
      );
      const payload = signatureEnvelope({
          schemaVersion: 1,
          source: {
            instanceId: config.instanceId,
            kind: value.kind,
            id: value.id,
            version: value.version,
            number: value.number,
          },
          document: {
            filename: value.filename,
            mimeType: 'application/pdf',
            sha256: digest(value.bytes),
            base64: value.bytes.toString('base64'),
          },
        }),
        now = new Date();
      await repo.upsertOne({
        filter: { id: key },
        create: {
          id: key,
          kind: value.kind,
          recordId: id,
          sourceVersion: value.version,
          destination,
          idempotencyKey: payload.idempotencyKey,
          payloadHash: payload.payloadHash,
          documentHash: payload.document.sha256,
          payload,
          state: 'pending',
          externalId: null,
          signingPath: null,
          signedHash: null,
          fileId: null,
          resultCode: null,
          leaseToken: null,
          leaseUntil: null,
          signedAt: null,
          archivedAt: null,
          actorId: actor,
          createdAt: now,
          updatedAt: now,
        },
        update: { id: key },
      });
      const row = (await repo.findOne({ filter: { id: key } }))!;
      if (
        row.destination !== destination ||
        row.payloadHash !== payload.payloadHash ||
        row.idempotencyKey !== payload.idempotencyKey
      )
        throw new Error('SIGNATURE_SOURCE_CHANGED');
      if (
        row.state === 'archived' ||
        (row.leaseToken && row.leaseUntil && +new Date(row.leaseUntil) > +now)
      )
        return { execute: false as const, row, source: value };
      await repo.updateOne({
        filter: { id: key },
        values: {
          leaseToken: lease,
          leaseUntil: new Date(+now + 90000),
          state: [
            'accepted',
            'signing',
            'archivePending',
            'rejected',
            'cancelled',
          ].includes(row.state)
            ? row.state
            : 'sending',
          actorId: actor,
          updatedAt: now,
        },
      });
      const claimed = (await repo.findOne({ filter: { id: key } }))!;
      await recordAudit(tx, claimed, mode, actor);
      return { execute: true as const, row: claimed, source: value };
    });
    if (!claim.execute) return claim.row;
    const initial = claim.row;
    let receipt: SignatureReceipt | null = null;
    if (
      initial.state === 'archivePending' &&
      initial.signedHash &&
      initial.externalId &&
      initial.signedAt
    )
      receipt = {
        state: 'signed',
        idempotencyKey: initial.idempotencyKey,
        payloadHash: initial.payloadHash,
        externalId: initial.externalId,
        signedAt: new Date(initial.signedAt).toISOString(),
        signedDocumentSha256: initial.signedHash,
        verification: 'verified',
      };
    else {
      const result = await (mode === 'submit'
        ? gateway.submit(initial.payload)
        : gateway.lookup(initial));
      if (result.state !== 'unknown' && result.state !== 'not_found')
        receipt = result;
      const updated = await db.transaction(async (tx) => {
        const repo = tx.repository<SignatureRecord>(collection),
          current = await repo.findOne({
            filter: { id: initial.id, leaseToken: lease },
          });
        if (!current) return null;
        const signed = receipt?.state === 'signed',
          state =
            receipt?.state === 'signed'
              ? 'archivePending'
              : (receipt?.state ??
                (['accepted', 'signing'].includes(current.state)
                  ? current.state
                  : 'unknown'));
        await repo.updateOne({
          filter: { id: current.id, leaseToken: lease },
          values: {
            state,
            externalId: receipt?.externalId ?? current.externalId,
            signingPath: receipt?.signingPath ?? current.signingPath,
            signedHash: signed
              ? receipt!.signedDocumentSha256!
              : current.signedHash,
            signedAt: signed ? new Date(receipt!.signedAt!) : current.signedAt,
            resultCode: receipt ? null : 'unconfirmed',
            ...(!signed ? { leaseToken: null, leaseUntil: null } : {}),
            updatedAt: new Date(),
          },
        });
        const row = (await repo.findOne({ filter: { id: current.id } }))!;
        await recordAudit(tx, row, 'receipt', actor);
        return row;
      });
      if (!updated) return (await read(claim.source))!;
      if (receipt?.state !== 'signed') return updated;
    }
    const bytes = await gateway.document(
      initial.idempotencyKey,
      receipt.signedDocumentSha256!,
    );
    if (!bytes)
      return archiveFailure(initial.id, lease, 'document_unavailable', actor);
    try {
      return await db.transaction(async (tx) => {
        // Owner locks precede the envelope lock, matching dispatch claim order.
        const verified = await owner.source(id, actor, access, tx, true);
        const repo = tx.repository<SignatureRecord>(collection);
        await repo.updateMany({
          filter: { id: initial.id, leaseToken: lease },
          values: { id: initial.id },
        });
        const current = await repo.findOne({
          filter: { id: initial.id, leaseToken: lease },
        });
        if (!current)
          return (await repo.findOne({ filter: { id: initial.id } }))!;
        // Re-authorize current facts before storing any signed file or closing its owning workflow.
        if (
          verified.version !== claim.source.version ||
          digest(verified.bytes) !== current.documentHash
        )
          throw new Error('SIGNATURE_SOURCE_CHANGED');
        const { record: file } = await files
          .repository('signatureArchiveFiles', {
            connection: 'main',
            disk: 'local',
            accessPath: '/uploads/electronic-signatures',
            transaction: tx,
            policy: { read: true, create: true, update: false, delete: false },
          })
          .uploadOne({
            file: new File([bytes], `signed-${id}.pdf`, {
              type: 'application/pdf',
            }),
          });
        await owner.finalize(
          verified,
          {
            envelopeId: current.id,
            fileId: String(file.id),
            externalId: receipt.externalId,
            documentHash: current.documentHash,
            signedHash: receipt.signedDocumentSha256!,
            signedAt: receipt.signedAt!,
          },
          actor,
          access,
          tx,
        );
        await repo.updateOne({
          filter: { id: current.id, leaseToken: lease },
          values: {
            state: 'archived',
            fileId: String(file.id),
            archivedAt: new Date(),
            leaseToken: null,
            leaseUntil: null,
            resultCode: null,
            updatedAt: new Date(),
          },
        });
        const row = (await repo.findOne({ filter: { id: current.id } }))!;
        await recordAudit(tx, row, 'archived', actor);
        return row;
      });
    } catch {
      return archiveFailure(initial.id, lease, 'archive_conflict', actor);
    }
  }
  async function archiveFailure(
    id: string,
    lease: string,
    code: string,
    actor: string,
  ) {
    return db.transaction(async (tx) => {
      const repo = tx.repository<SignatureRecord>(collection);
      await repo.updateMany({
        filter: { id, leaseToken: lease },
        values: {
          state: 'archivePending',
          resultCode: code,
          leaseToken: null,
          leaseUntil: null,
          updatedAt: new Date(),
        },
      });
      const row = (await repo.findOne({ filter: { id } }))!;
      await recordAudit(tx, row, 'archivePending', actor);
      return row;
    });
  }
  return { source, read, execute };
}
