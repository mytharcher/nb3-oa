import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type {
  ContractCommand,
  ContractFacts,
  ContractLedgerService,
  ContractReservation,
  ContractSource,
} from './contract.js';
import { cents, fail } from './errors.js';

interface Row {
  id: string;
  number: string | null;
  requestId: string;
  applicantId: string;
  departmentId: string;
  status: ContractSource['status'];
  version: number;
  amountCents: number;
  facts: ContractFacts;
}
function bounded(value: string, length = 64) {
  if (!value || value.length > length)
    fail('INVALID_ID', 'A bounded identity is required.');
}
function validate(input: ContractCommand) {
  bounded(input.actorId);
  bounded(input.requestKey, 128);
  if (!input.reason.trim() || input.reason.length > 5000)
    fail('REASON_REQUIRED', 'A bounded reason is required.');
  if (input.now && !Number.isFinite(input.now.getTime()))
    fail('INVALID_TIME', 'The timestamp is invalid.');
}
/** Stable fingerprints distinguish payloads without depending on object insertion order. */
export function commandFingerprint(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(commandFingerprint).join(',')}]`;
  return `{${Object.entries(value)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${commandFingerprint(v)}`)
    .join(',')}}`;
}
export function createContractLedgerService(
  _db: DatabaseManager,
  audit: AuditService,
): ContractLedgerService {
  async function source(
    id: string,
    tx: DatabaseConnection,
  ): Promise<ContractSource | null> {
    const row = await tx
      .repository<Row>('contracts')
      .findOne({ filter: { id } });
    if (!row) return null;
    const entries = await tx
      .repository<{ contractId: string; heldDelta: number; paidDelta: number }>(
        'contractMoneyLedger',
      )
      .findMany({ filter: { contractId: id } });
    let held = 0n,
      paid = 0n;
    for (const entry of entries) {
      held += BigInt(entry.heldDelta);
      paid += BigInt(entry.paidDelta);
    }
    const amount = BigInt(row.amountCents),
      available = amount - held - paid;
    if (
      amount < 0n ||
      amount > BigInt(Number.MAX_SAFE_INTEGER) ||
      held < 0n ||
      paid < 0n ||
      held + paid > BigInt(Number.MAX_SAFE_INTEGER)
    )
      fail('CORRUPT_BALANCE', 'Contract quantities are inconsistent.');
    return {
      id: row.id,
      number: row.number,
      requestId: row.requestId,
      applicantId: row.applicantId,
      departmentId: row.departmentId,
      status: row.status,
      version: row.version,
      amountCents: Number(amount),
      heldCents: Number(held),
      paidCents: Number(paid),
      availableCents: Number(available < 0n ? 0n : available),
      facts: row.facts,
    };
  }
  async function lockSources(ids: readonly string[], tx: DatabaseConnection) {
    for (const id of [...new Set(ids)].sort()) {
      bounded(id);
      const locked = await tx.repository('contracts').updateMany({
        filter: { id },
        values: { lockVersion: { increment: 1 } },
      });
      if (!locked.updatedCount)
        fail('NOT_FOUND', 'The contract does not exist.');
    }
  }
  async function command(
    input: ContractCommand,
    kind: string,
    targetId: string,
    payload: unknown,
    tx: DatabaseConnection,
  ): Promise<{ id: string; replay: boolean }> {
    validate(input);
    const fingerprint = commandFingerprint({
      kind,
      targetId,
      reason: input.reason,
      payload,
    });
    const repo = tx.repository('contractCommands');
    const old = await repo.findOne({
      filter: { actorId: input.actorId, requestKey: input.requestKey },
    });
    if (old) {
      if (old.fingerprint !== fingerprint)
        fail(
          'IDEMPOTENCY_CONFLICT',
          'This request key belongs to another contract operation.',
        );
      return {
        id:
          typeof old.id === 'string'
            ? old.id
            : fail('STORED_ID_INVALID', 'Stored command identity is invalid.'),
        replay: true,
      };
    }
    const id = randomUUID();
    await repo.createOne({
      values: {
        id,
        actorId: input.actorId,
        requestKey: input.requestKey,
        targetId,
        fingerprint,
        result: null,
      },
    });
    return { id, replay: false };
  }
  async function result(id: string, value: object, tx: DatabaseConnection) {
    await tx
      .repository('contractCommands')
      .updateOne({ filter: { id }, values: { result: { ...value } } });
  }
  async function auditWrite(
    input: ContractCommand,
    kind: string,
    contractId: string,
    before: unknown,
    after: unknown,
    tx: DatabaseConnection,
  ) {
    await audit.record(
      {
        actorId: input.actorId,
        action: `contract.${kind}`,
        targetType: 'contracts',
        targetId: contractId,
        before,
        after,
        reason: input.reason,
      },
      tx,
    );
  }
  async function reservation(
    reference: string,
    tx: DatabaseConnection,
  ): Promise<ContractReservation | null> {
    const row = await tx
      .repository<ContractReservation>('contractPaymentReservations')
      .findOne({ filter: { reference } });
    return row
      ? { ...row, cents: Number(row.cents), updatedAt: new Date(row.updatedAt) }
      : null;
  }
  async function monetary(
    input: ContractCommand & {
      contractId: string;
      reference: string;
      cents?: number;
      expectedVersion?: number;
      payment?: boolean;
    },
    kind: 'hold' | 'release' | 'settle',
    tx: DatabaseConnection,
  ) {
    validate(input);
    bounded(input.reference, 255);
    if (kind === 'hold') cents(input.cents!, false);
    await lockSources([input.contractId], tx);
    const current = (await source(input.contractId, tx))!;
    if (
      input.expectedVersion !== undefined &&
      current.version !== input.expectedVersion
    )
      fail('VERSION_CONFLICT', 'The payment contract version changed.');
    const op = await command(
      input,
      kind,
      input.contractId,
      {
        reference: input.reference,
        ...(kind === 'hold' ? { cents: input.cents } : {}),
        expectedVersion: input.expectedVersion,
      },
      tx,
    );
    let old = await reservation(input.reference, tx);
    if (old && old.contractId !== input.contractId)
      fail(
        'SOURCE_CONFLICT',
        'A payment reference cannot move between contracts.',
      );
    if (op.replay) {
      if (!old) fail('NOT_FOUND', 'The replayed reservation is missing.');
      return old;
    }
    let heldDelta: number;
    let paidDelta = 0;
    if (kind === 'hold') {
      if (!['active', 'activePendingSeal'].includes(current.status))
        fail(
          'INACTIVE_SOURCE',
          'Only an effective approved contract accepts payment holds.',
        );
      if (
        old &&
        old.state !== 'held' &&
        !(input.payment && old.state === 'released')
      )
        fail(
          'RESERVATION_CLOSED',
          'A released or paid payment reference cannot reserve again.',
        );
      heldDelta = input.cents! - (old?.state === 'held' ? old.cents : 0);
      if (!input.payment && heldDelta > current.availableCents)
        fail(
          'LIMIT_EXCEEDED',
          'Pending and paid amounts exceed the contract limit.',
        );
      const existed = !!old;
      old = old
        ? {
            ...old,
            state: 'held',
            cents: input.cents!,
            updatedAt: input.now ?? new Date(),
          }
        : {
            id: randomUUID(),
            contractId: input.contractId,
            reference: input.reference,
            cents: input.cents!,
            state: 'held',
            updatedAt: input.now ?? new Date(),
          };
      if (existed)
        await tx.repository('contractPaymentReservations').updateOne({
          filter: { id: old.id, contractId: input.contractId },
          values: {
            state: old.state,
            cents: old.cents,
            updatedAt: old.updatedAt,
          },
        });
      else {
        try {
          await tx.transaction((savepoint) =>
            savepoint
              .repository('contractPaymentReservations')
              .createOne({ values: { ...old! } }),
          );
        } catch (error) {
          if (await reservation(input.reference, tx))
            fail(
              'SOURCE_CONFLICT',
              'This payment reference was concurrently bound to another contract.',
            );
          throw error;
        }
      }
    } else {
      if (!old || old.state !== 'held')
        fail('RESERVATION_CLOSED', 'An outstanding payment hold is required.');
      heldDelta = -old.cents;
      paidDelta = kind === 'settle' ? old.cents : 0;
      old = {
        ...old,
        state: kind === 'settle' ? 'paid' : 'released',
        updatedAt: input.now ?? new Date(),
      };
      await tx.repository('contractPaymentReservations').updateOne({
        filter: { id: old.id },
        values: { state: old.state, updatedAt: old.updatedAt },
      });
    }
    await tx.repository('contractMoneyLedger').createOne({
      values: {
        id: randomUUID(),
        contractId: input.contractId,
        reference: input.reference,
        kind,
        heldDelta,
        paidDelta,
        actorId: input.actorId,
        reason: input.reason,
        at: input.now ?? new Date(),
      },
    });
    await auditWrite(
      input,
      kind,
      input.contractId,
      { heldCents: current.heldCents, paidCents: current.paidCents },
      {
        heldCents: current.heldCents + heldDelta,
        paidCents: current.paidCents + paidDelta,
        reservation: old,
      },
      tx,
    );
    await result(op.id, old, tx);
    return old;
  }
  return {
    source,
    lockSources,
    async listForPayment(_actorId, policy, tx) {
      if (!policy.read)
        fail('ACCESS_DENIED', 'Ordinary contract ledger access is required.');
      const readable = policy.read;
      const required = [
        'id',
        'number',
        'requestId',
        'applicantId',
        'departmentId',
        'version',
        'status',
        'amountCents',
        'facts',
      ];
      const fields =
        readable && readable !== true ? readable.fields : undefined;
      if (
        readable !== true &&
        (!readable ||
          fields === false ||
          (Array.isArray(fields) &&
            required.some((field) => !fields.includes(field))))
      )
        fail(
          'FIELDS_RESTRICTED',
          'Payment candidates require readable contract identity, amount and counterparty fields.',
        );
      const rows = await tx
        .repository<Row>('contracts')
        .withPolicy(policy)
        .findMany({
          select: (s) =>
            s.fields(
              'id',
              'number',
              'requestId',
              'applicantId',
              'departmentId',
              'version',
              'status',
              'amountCents',
              'facts',
            ),
        });
      const result = [];
      for (const row of rows) {
        if (
          [
            'id',
            'number',
            'requestId',
            'applicantId',
            'departmentId',
            'version',
            'status',
            'amountCents',
            'facts',
          ].some((f) => !Object.hasOwn(row, f))
        )
          fail(
            'FIELDS_RESTRICTED',
            'Payment candidates require readable contract identity, amount and counterparty fields.',
          );
        if (!['active', 'activePendingSeal'].includes(row.status!)) continue;
        const current = (await source(row.id!, tx))!;
        const { facts: _facts, ...dto } = current;
        result.push({ ...dto, counterparty: current.facts.counterparty });
      }
      return result;
    },
    async reservePayment(input, tx) {
      const held = await monetary({ ...input, payment: true }, 'hold', tx);
      const current = (await source(input.contractId, tx))!;
      const exceeded =
        BigInt(current.heldCents) + BigInt(current.paidCents) >
        BigInt(current.amountCents);
      const repo = tx.repository('contractPaymentReservations');
      const row = await repo.findOne({ filter: { id: held.id } });
      const requiresFullApproval =
        exceeded || row?.requiresFullApproval === true;
      await repo.updateOne({
        filter: { id: held.id },
        values: { requiresFullApproval },
      });
      return { ...held, requiresFullApproval };
    },
    async settlePayment(input, verifier, tx) {
      await lockSources([input.contractId], tx);
      const old = await reservation(input.reference, tx);
      if (!old || old.contractId !== input.contractId)
        fail('RESERVATION_CLOSED', 'A real payment hold is required.');
      const proof = await verifier(tx);
      const row = await tx
        .repository('contractPaymentReservations')
        .findOne({ filter: { id: old.id } });
      if (
        proof.contractId !== input.contractId ||
        proof.reference !== input.reference ||
        proof.cents !== old.cents ||
        proof.contractVersion !== input.expectedVersion ||
        !proof.approved ||
        !Number.isSafeInteger(proof.sourceVersion) ||
        proof.sourceVersion < 0 ||
        proof.forced ||
        ((row?.requiresFullApproval || proof.requiresFullApproval) &&
          !proof.completedFullApproval)
      )
        fail(
          'PAYMENT_EVIDENCE_REQUIRED',
          'Actual cashier completion and the required full staircase are required.',
        );
      return monetary(input, 'settle', tx);
    },
    async listForSeal(_actorId, policy, tx) {
      if (policy.read === false)
        fail('ACCESS_DENIED', 'Contract source permission is required.');
      const rows = await tx
        .repository<Row>('contracts')
        .withPolicy(policy)
        .findMany({
          select: (s) => s.fields('id', 'number', 'version', 'status', 'facts'),
        });
      const sources: Array<{
        id: string;
        number: string | null;
        version: number;
        textVersionId: string;
        status: 'active' | 'activePendingSeal';
      }> = [];
      for (const row of rows) {
        if (
          ['id', 'number', 'version', 'status', 'facts'].some(
            (f) => !Object.hasOwn(row, f),
          ) ||
          typeof row.id !== 'string' ||
          !(typeof row.number === 'string' || row.number === null) ||
          typeof row.version !== 'number' ||
          !row.facts
        )
          fail(
            'FIELDS_RESTRICTED',
            'The sealing source requires its current identity, version and text fields.',
          );
        if (row.status !== 'active' && row.status !== 'activePendingSeal')
          continue;
        if (
          typeof row.facts.textVersionId !== 'string' ||
          !row.facts.textVersionId
        )
          continue;
        sources.push({
          id: row.id,
          number: row.number,
          version: row.version,
          textVersionId: row.facts.textVersionId,
          status: row.status,
        });
      }
      return sources;
    },
    async createCandidate(input, tx) {
      validate(input);
      cents(input.amountCents);
      bounded(input.id);
      bounded(input.requestId);
      bounded(input.applicantId);
      bounded(input.departmentId);
      const op = await command(
        input,
        'candidate',
        input.id,
        {
          requestId: input.requestId,
          applicantId: input.applicantId,
          departmentId: input.departmentId,
          amountCents: input.amountCents,
          facts: { ...input.facts },
        },
        tx,
      );
      if (op.replay) {
        const existing = await source(input.id, tx);
        if (!existing)
          fail(
            'CANDIDATE_REMOVED',
            'This submitted candidate has already been removed.',
          );
        return existing;
      }
      if (await source(input.id, tx))
        fail('SOURCE_CONFLICT', 'This contract already exists.');
      const now = input.now ?? new Date();
      await tx.repository('contracts').createOne({
        values: {
          id: input.id,
          number: null,
          requestId: input.requestId,
          applicantId: input.applicantId,
          departmentId: input.departmentId,
          status: 'underApproval',
          version: 0,
          lockVersion: 0,
          amountCents: input.amountCents,
          facts: { ...input.facts },
          createdAt: now,
          updatedAt: now,
        },
      });
      const current = (await source(input.id, tx))!;
      await auditWrite(input, 'candidate', input.id, null, current, tx);
      await result(op.id, current, tx);
      return current;
    },
    async discardCandidate(input, tx) {
      validate(input);
      // A replay remains harmless even after deletion; it cannot delete a subsequently published version.
      const op = await command(
        input,
        'discardCandidate',
        input.contractId,
        { requestId: input.requestId },
        tx,
      );
      if (op.replay) return;
      await lockSources([input.contractId], tx);
      const current = (await source(input.contractId, tx))!;
      if (
        current.status !== 'underApproval' ||
        current.version !== 0 ||
        current.requestId !== input.requestId
      )
        fail(
          'NOT_CANDIDATE',
          "Only this request's unpublished candidate may be removed.",
        );
      await tx.repository('contracts').deleteOne({
        filter: {
          id: input.contractId,
          requestId: input.requestId,
          version: 0,
          status: 'underApproval',
        },
      });
      await auditWrite(
        input,
        'discardCandidate',
        input.contractId,
        current,
        null,
        tx,
      );
      await result(op.id, { removed: true }, tx);
    },
    async publish(input, tx) {
      validate(input);
      cents(input.amountCents);
      bounded(input.requestId);
      bounded(input.number);
      if (!Number.isSafeInteger(input.baseVersion) || input.baseVersion < 0)
        fail('VERSION_CONFLICT', 'A valid immutable base version is required.');
      await lockSources([input.contractId], tx);
      const current = (await source(input.contractId, tx))!;
      const op = await command(
        input,
        'publish',
        input.contractId,
        {
          requestId: input.requestId,
          baseVersion: input.baseVersion,
          number: input.number,
          amountCents: input.amountCents,
          facts: { ...input.facts },
          terminate: input.terminate ?? false,
          historical: input.historical ?? false,
        },
        tx,
      );
      if (op.replay) return current;
      if (
        current.version !== input.baseVersion ||
        current.status === 'terminated'
      )
        fail(
          'VERSION_CONFLICT',
          'The contract changed; prepare a new proposal from the latest version.',
        );
      if (
        current.version === 0 &&
        (current.status !== 'underApproval' ||
          current.requestId !== input.requestId)
      )
        fail(
          'NOT_CANDIDATE',
          'The initial publication must belong to its original candidate.',
        );
      if (
        BigInt(input.amountCents) <
        BigInt(current.paidCents) + BigInt(current.heldCents)
      )
        fail(
          'AMOUNT_BELOW_COMMITTED',
          'The new amount cannot be below paid plus outstanding payment holds.',
        );
      if (input.terminate && current.heldCents !== 0)
        fail(
          'OUTSTANDING_PAYMENTS',
          'Release outstanding payment holds before terminating the contract.',
        );
      const version = current.version + 1,
        status = input.terminate ? 'terminated' : 'activePendingSeal',
        at = input.now ?? new Date();
      const updated = await tx.repository('contracts').updateMany({
        filter: { id: current.id, version: input.baseVersion },
        values: {
          version,
          status,
          number: current.number ?? input.number,
          amountCents: input.amountCents,
          facts: { ...input.facts },
          updatedAt: at,
        },
      });
      if (!updated.updatedCount)
        fail(
          'VERSION_CONFLICT',
          'Another approved change has already advanced the contract.',
        );
      await tx.repository('contractVersions').createOne({
        values: {
          id: randomUUID(),
          contractId: current.id,
          version,
          requestId: input.requestId,
          amountCents: input.amountCents,
          facts: { ...input.facts },
          status,
          actorId: input.actorId,
          reason: input.reason,
          at,
        },
      });
      const published = (await source(current.id, tx))!;
      await auditWrite(
        input,
        input.historical
          ? 'historicalEntry'
          : input.terminate
            ? 'terminate'
            : current.version
              ? 'change'
              : 'approve',
        current.id,
        current,
        published,
        tx,
      );
      await result(op.id, published, tx);
      return published;
    },
    hold: (input, tx) => monetary(input, 'hold', tx),
    async confirmSealed(input, verifier, tx) {
      validate(input);
      bounded(input.sealRecordId);
      if (
        !Number.isSafeInteger(input.expectedVersion) ||
        input.expectedVersion < 1
      )
        fail('VERSION_CONFLICT', 'A published contract version is required.');
      await lockSources([input.contractId], tx);
      const current = (await source(input.contractId, tx))!;
      const op = await command(
        input,
        'confirmSealed',
        input.contractId,
        {
          expectedVersion: input.expectedVersion,
          sealRecordId: input.sealRecordId,
        },
        tx,
      );
      // Replays never restore a contract which has since changed or terminated.
      if (op.replay) return current;
      if (current.version !== input.expectedVersion)
        fail(
          'VERSION_CONFLICT',
          'The contract changed after this seal request.',
        );
      if (!['activePendingSeal', 'active'].includes(current.status))
        fail(
          'NOT_EFFECTIVE',
          'Only an effective published contract can be sealed.',
        );
      const proof = await verifier(tx);
      const now = input.now ?? new Date();
      if (
        !proof ||
        proof.status !== 'completed' ||
        proof.contractId !== input.contractId ||
        proof.contractVersion !== input.expectedVersion ||
        proof.sealRecordId !== input.sealRecordId ||
        !(proof.sealedAt instanceof Date) ||
        !Number.isFinite(proof.sealedAt.getTime()) ||
        proof.sealedAt > now
      )
        fail(
          'SEAL_EVIDENCE_REQUIRED',
          'Actual completed sealing evidence is required.',
        );
      const links = tx.repository<{
        id: string;
        contractId: string;
        contractVersion: number;
        textVersionId: string;
        sealRecordId: string;
        sealedAt: Date | string;
        confirmedById: string;
        confirmedAt: Date;
      }>('contractSealLinks');
      const existing = await links.findOne({
        filter: { sealRecordId: input.sealRecordId },
      });
      if (existing) {
        if (
          existing.contractId !== current.id ||
          existing.contractVersion !== input.expectedVersion ||
          existing.textVersionId !== current.facts.textVersionId ||
          new Date(existing.sealedAt).getTime() !== proof.sealedAt.getTime()
        )
          fail(
            'SEAL_EVIDENCE_CONFLICT',
            'This seal evidence already belongs to different contract facts.',
          );
        await result(op.id, current, tx);
        return current;
      }
      await links.createOne({
        values: {
          id: randomUUID(),
          contractId: current.id,
          contractVersion: current.version,
          textVersionId: current.facts.textVersionId,
          sealRecordId: input.sealRecordId,
          sealedAt: proof.sealedAt,
          confirmedById: input.actorId,
          confirmedAt: now,
        },
      });
      const updated = await tx.repository('contracts').updateMany({
        filter: {
          id: current.id,
          version: input.expectedVersion,
          status: current.status,
        },
        values: { status: 'active', updatedAt: now },
      });
      if (updated.updatedCount !== 1)
        fail(
          'VERSION_CONFLICT',
          'The contract changed during seal confirmation.',
        );
      await auditWrite(
        input,
        'sealed',
        current.id,
        { status: current.status, version: current.version },
        {
          status: 'active',
          version: current.version,
          sealRecordId: input.sealRecordId,
          sealedAt: proof.sealedAt.toISOString(),
        },
        tx,
      );
      const sealed = (await source(current.id, tx))!;
      await result(op.id, sealed, tx);
      return sealed;
    },
    release: (input, tx) => monetary(input, 'release', tx),
    settle: (input, tx) => monetary(input, 'settle', tx),
  };
}
