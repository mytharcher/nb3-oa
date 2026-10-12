import { randomUUID, createHash } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { OrgService } from '../org/contract.js';
import type { DictionaryService } from '../platform/index.js';
import {
  lockUserForAdministration,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import { createSealPrintRegistration } from './print-registration.js';
import type {
  SealService,
  SealInstance,
  SealLedger,
  SealReceipt,
  SealRequest,
  SealProof,
} from './contract.js';
import { SEAL_LEDGER_FIELDS } from './contract.js';
import { fail } from './errors.js';
import { createSealLedgerReader } from './ledger-reader.js';
export const digest = (value: unknown) =>
  createHash('sha256')
    .update(
      JSON.stringify(value, (_k, v: unknown) =>
        v && typeof v === 'object' && !Array.isArray(v)
          ? Object.fromEntries(
              Object.entries(v)
                .filter(([, x]) => x !== undefined)
                .sort(([a], [b]) => a.localeCompare(b)),
            )
          : v,
      ),
    )
    .digest('hex');
export async function existingCommand(
  input: { actorId: string; requestKey: string },
  kind: string,
  payload: unknown,
  tx: DatabaseConnection,
) {
  if (!input.requestKey || input.requestKey.length > 128)
    fail('INVALID_COMMAND');
  const id = digest([input.actorId, input.requestKey]),
    payloadHash = digest({ kind, payload });
  const old = await tx
    .repository<{
      id: string;
      actorId: string;
      payloadHash: string;
      result: unknown;
    }>('sealCommands')
    .findOne({ filter: { id } });
  if (old && (old.actorId !== input.actorId || old.payloadHash !== payloadHash))
    fail('COMMAND_CONFLICT');
  return { id, payloadHash, old };
}
export async function saveCommand(
  command: { id: string; payloadHash: string },
  actorId: string,
  requestId: string | null,
  result: object,
  tx: DatabaseConnection,
) {
  await tx.repository('sealCommands').createOne({
    values: {
      id: command.id,
      payloadHash: command.payloadHash,
      actorId,
      requestId,
      result,
    },
  });
}
export function createSealLedger(d: {
  users: UserAdministrationService;
  audit: AuditService;
  org: OrgService;
  dictionaries: DictionaryService;
}) {
  async function activeType(type: string, tx: DatabaseConnection) {
    if (!(await d.dictionaries.get('sealType', type, tx))?.active)
      fail('INVALID_SEAL_TYPE');
  }
  async function lock(
    id: string,
    tx: DatabaseConnection,
  ): Promise<SealInstance> {
    const r = await tx
      .repository('seals')
      .updateMany({ filter: { id }, values: { version: { increment: 0 } } });
    if (r.updatedCount !== 1) fail('SEAL_NOT_FOUND');
    return (await tx
      .repository<SealInstance>('seals')
      .findOne({ filter: { id } }))!;
  }
  async function outstanding(
    sealId: string | undefined,
    userId: string | undefined,
    tx: DatabaseConnection,
  ) {
    const ledgers = await tx.repository<SealLedger>('sealLedger').findMany({
        filter: {
          external: true,
          ...(sealId ? { sealId } : {}),
          ...(userId ? { applicantId: userId } : {}),
        },
      }),
      rows: SealLedger[] = [];
    for (const ledger of ledgers)
      if (
        !(await tx
          .repository('sealReceipts')
          .exists({ filter: { ledgerId: ledger.id } }))
      )
        rows.push(ledger);
    return rows;
  }
  async function keeper(actorId: string, tx: DatabaseConnection) {
    if (!(await d.org.hasDutyRole(actorId, 'sealKeeper', tx)))
      fail('KEEPER_REQUIRED');
  }
  function time(value: string | null | undefined, now: Date) {
    if (!value || !Number.isFinite(Date.parse(value)) || new Date(value) > now)
      fail('INVALID_TIME');
    return new Date(value).toISOString();
  }
  function copies(value: number | null | undefined, approved: number) {
    if (!Number.isInteger(value) || !value || value < 1 || value > approved)
      fail('INVALID_COPIES');
    return value;
  }
  const publicService: SealService = {
    ...createSealLedgerReader(d),
    printRegistration: createSealPrintRegistration(d),
    async saveInstance(input, tx, policy) {
      if (!(await d.org.hasDutyRole(input.actorId, 'admin', tx)))
        fail('ADMIN_REQUIRED');
      if (
        !input.reason.trim() ||
        !input.code.trim() ||
        input.code.length > 64 ||
        !input.name.trim() ||
        input.name.length > 200
      )
        fail('INVALID_INPUT');
      await activeType(input.sealType, tx);
      const command = await existingCommand(input, 'seal.save', input, tx),
        repo = tx.repository<SealInstance>('seals').withPolicy(policy);
      const values = {
        id:
          input.id ??
          (command.old?.result as SealInstance | undefined)?.id ??
          randomUUID(),
        code: input.code.trim(),
        name: input.name.trim(),
        sealType: input.sealType,
        active: input.active,
        version: input.id ? (input.expectedVersion ?? 0) + 1 : 1,
      };
      const checked = await repo.validateMutation(
        input.id
          ? { operation: 'updateOne', filter: { id: input.id }, values }
          : { operation: 'createOne', values },
      );
      if (!checked.valid) fail('ACCESS_DENIED');
      if (command.old) return command.old.result as SealInstance;
      if (input.id) {
        const current = await lock(input.id, tx);
        if (current.version !== input.expectedVersion) fail('VERSION_CONFLICT');
        if (
          (await outstanding(input.id, undefined, tx)).length &&
          (current.sealType !== input.sealType || !input.active)
        )
          fail('OUTSTANDING_CUSTODY');
      }
      const saved = (
        input.id
          ? await repo.updateOne({
              filter: { id: input.id, version: input.expectedVersion },
              values,
            })
          : await repo.createOne({ values })
      ).record;
      await d.audit.record(
        {
          actorId: input.actorId,
          action: 'seal.instance.save',
          targetType: 'seals',
          targetId: values.id,
          after: values,
          reason: input.reason,
        },
        tx,
      );
      await saveCommand(command, input.actorId, null, saved, tx);
      return saved as SealInstance;
    },
    async listInstances(tx, policy) {
      const rows = await tx
        .repository<SealInstance>('seals')
        .withPolicy(policy)
        .findMany();
      if (
        rows.some((r) =>
          ['id', 'code', 'name', 'sealType', 'active', 'version'].some(
            (k) => !(k in r),
          ),
        )
      )
        fail('ACCESS_DENIED');
      return rows as SealInstance[];
    },
    async listLedger(tx, policy) {
      const rows = await tx
        .repository<SealLedger>('sealLedger')
        .withPolicy(policy)
        .findMany({ sort: (s) => s.field('registeredAt').desc() });
      if (rows.some((r) => SEAL_LEDGER_FIELDS.some((k) => !(k in r))))
        fail('ACCESS_DENIED');
      return rows as SealLedger[];
    },
    async proof(sealRecordId, tx): Promise<SealProof> {
      const ledger = await tx
        .repository<SealLedger>('sealLedger')
        .findOne({ filter: { id: sealRecordId } });
      if (!ledger?.contractId || !ledger.contractVersion)
        fail('SEAL_EVIDENCE_REQUIRED');
      const receipt = ledger.external
        ? await tx
            .repository<SealReceipt>('sealReceipts')
            .findOne({ filter: { ledgerId: ledger.id } })
        : null;
      const sealedAt = ledger.external ? receipt?.sealedAt : ledger.sealedAt;
      if (!sealedAt || receipt?.contractConfirmation === 'unconfirmed')
        fail('SEAL_EVIDENCE_REQUIRED');
      return {
        contractId: ledger.contractId,
        contractVersion: ledger.contractVersion,
        sealRecordId: ledger.id,
        sealedAt: new Date(sealedAt),
        status: 'completed',
      };
    },
    async outstandingFor(userId, tx) {
      return (await outstanding(undefined, userId, tx)).map((l) => ({
        ledgerId: l.id,
        sealId: l.sealId,
        requestId: l.requestId,
      }));
    },
  };
  // Only the application approval owner invokes these hooks after the genuine SDK conclusion.
  // They are not included in the public token and cannot be routed as arbitrary ledger CRUD.
  return {
    publicService,
    lock,
    activeType,
    async register(
      record: SealRequest,
      actorId: string,
      tx: DatabaseConnection,
      now: Date,
    ): Promise<SealLedger> {
      // Serialize new custody with departure's final user lock and recheck the borrower in this transaction.
      await lockUserForAdministration(tx, record.applicantId);
      const borrower = await d.users.withConnection(tx).get(record.applicantId);
      if (!borrower || borrower.disabledAt) fail('ACCESS_DENIED');
      await keeper(actorId, tx);
      if (!record.sealId) fail('SEAL_NOT_FOUND');
      const seal = await lock(record.sealId, tx);
      if (!seal.active || seal.sealType !== record.sealType)
        fail('INVALID_SEAL_TYPE');
      if ((await outstanding(seal.id, undefined, tx)).length)
        fail('SEAL_UNAVAILABLE');
      if (
        await tx
          .repository('sealLedger')
          .exists({ filter: { requestId: record.id } })
      )
        fail('PHYSICAL_ALREADY_REGISTERED');
      const actualCopies = record.external
          ? null
          : copies(record.actualCopies, record.copies),
        sealedAt = record.external ? null : time(record.sealedAt, now),
        borrowedAt = record.external ? time(record.borrowedAt, now) : null;
      if (!record.external && record.borrowedAt) fail('INVALID_OUTPUT');
      const ledger: SealLedger = {
        id: randomUUID(),
        requestId: record.id,
        sealId: seal.id,
        applicantId: record.applicantId,
        departmentId: record.departmentId,
        contractId: record.contractId,
        contractVersion: record.contractVersion,
        contractTextVersionId: record.contractTextVersionId,
        approvedCopies: record.copies,
        actualCopies,
        external: record.external,
        borrowedAt,
        sealedAt,
        registeredById: actorId,
        registeredAt: now.toISOString(),
      };
      await tx
        .repository<SealLedger>('sealLedger')
        .createOne({ values: ledger });
      await d.audit.record(
        {
          actorId,
          action: record.external ? 'seal.checkout' : 'seal.use',
          targetType: 'sealLedger',
          targetId: ledger.id,
          after: {
            requestId: record.id,
            sealId: seal.id,
            external: record.external,
            actualCopies,
            borrowedAt,
            sealedAt,
          },
        },
        tx,
      );
      return ledger;
    },
    async returnSeal(
      record: SealRequest,
      actorId: string,
      reason: string,
      tx: DatabaseConnection,
      now: Date,
      confirmation: SealReceipt['contractConfirmation'] = record.contractId
        ? 'confirmed'
        : 'notApplicable',
    ): Promise<SealReceipt> {
      await keeper(actorId, tx);
      if (!record.sealId || !record.ledgerId) fail('SEAL_EVIDENCE_REQUIRED');
      await lock(record.sealId, tx);
      const ledger = await tx.repository<SealLedger>('sealLedger').findOne({
        filter: {
          id: record.ledgerId,
          requestId: record.id,
          sealId: record.sealId,
          external: true,
        },
      });
      if (!ledger?.borrowedAt) fail('SEAL_EVIDENCE_REQUIRED');
      if (
        await tx
          .repository('sealReceipts')
          .exists({ filter: { ledgerId: ledger.id } })
      )
        fail('PHYSICAL_ALREADY_REGISTERED');
      const returnedAt = time(record.returnedAt, now),
        sealedAt = time(record.sealedAt, now),
        actualCopies = copies(record.actualCopies, ledger.approvedCopies);
      if (
        new Date(returnedAt) < new Date(ledger.borrowedAt) ||
        new Date(sealedAt) < new Date(ledger.borrowedAt) ||
        new Date(sealedAt) > new Date(returnedAt)
      )
        fail('INVALID_TIME');
      const receipt: SealReceipt = {
        id: randomUUID(),
        ledgerId: ledger.id,
        requestId: record.id,
        sealId: record.sealId,
        returnedAt,
        sealedAt,
        actualCopies,
        confirmedById: actorId,
        contractConfirmation: confirmation,
        reason,
      };
      await tx
        .repository<SealReceipt>('sealReceipts')
        .createOne({ values: receipt });
      await d.audit.record(
        {
          actorId,
          action: 'seal.return',
          targetType: 'sealReceipts',
          targetId: receipt.id,
          after: {
            ledgerId: ledger.id,
            sealId: record.sealId,
            returnedAt,
            sealedAt,
            actualCopies,
          },
          reason,
        },
        tx,
      );
      return receipt;
    },
  };
}
