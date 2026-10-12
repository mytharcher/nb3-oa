import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import type { OrgService } from '../org/contract.js';
import type {
  SealLedger,
  SealReceipt,
  SealRequest,
  SealRegistrationAccess,
  SealPrintRegistration,
} from './contract.js';
import {
  SEAL_LEDGER_FIELDS,
  SEAL_PRINT_REQUEST_FIELDS,
  SEAL_PRINT_RECEIPT_FIELDS,
} from './contract.js';
import { fail } from './errors.js';
function complete<T extends object>(
  row: Partial<T>,
  fields: readonly (keyof T)[],
): asserts row is T {
  if (fields.some((f) => !(f in row))) fail('ACCESS_DENIED');
}
function instant(value: string | Date | null) {
  if (value === null) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) fail('SEAL_EVIDENCE_REQUIRED');
  return new Date(time).toISOString();
}
function policyRead(policy: RepositoryPolicy, fields: readonly string[]) {
  const read = policy.read;
  if (read === false) fail('ACCESS_DENIED');
  if (read === true) return;
  if (
    !Array.isArray(read.fields) ||
    !fields.every(
      (field) => Array.isArray(read.fields) && read.fields.includes(field),
    )
  )
    fail('ACCESS_DENIED');
}
export function createSealPrintRegistration(dependencies: {
  users: UserAdministrationService;
  org: OrgService;
}) {
  return async (
    ledgerId: string,
    _actorId: string,
    tx: DatabaseConnection,
    access: SealRegistrationAccess,
  ): Promise<SealPrintRegistration> => {
    policyRead(access.ledger, SEAL_LEDGER_FIELDS);
    policyRead(access.requests, SEAL_PRINT_REQUEST_FIELDS);
    const ledger = await tx
      .repository<SealLedger>('sealLedger')
      .withPolicy(access.ledger)
      .findOne({
        filter: { id: ledgerId },
        select: (s) => s.fields(...SEAL_LEDGER_FIELDS),
      });
    if (!ledger) fail('ACCESS_DENIED');
    complete<SealLedger>(ledger, SEAL_LEDGER_FIELDS);
    const request = await tx
      .repository<SealRequest>('sealRequests')
      .withPolicy(access.requests)
      .findOne({
        filter: { id: ledger.requestId },
        select: (s) => s.fields(...SEAL_PRINT_REQUEST_FIELDS),
      });
    if (!request) fail('ACCESS_DENIED');
    complete<Pick<SealRequest, (typeof SEAL_PRINT_REQUEST_FIELDS)[number]>>(
      request,
      SEAL_PRINT_REQUEST_FIELDS,
    );
    if (
      request.ledgerId !== ledger.id ||
      request.applicantId !== ledger.applicantId ||
      request.departmentId !== ledger.departmentId ||
      request.copies !== ledger.approvedCopies ||
      request.status !== 'completed' ||
      !request.number
    )
      fail('SEAL_EVIDENCE_REQUIRED');
    let receipt:
      Pick<SealReceipt, (typeof SEAL_PRINT_RECEIPT_FIELDS)[number]> | undefined;
    if (ledger.external) {
      policyRead(access.receipts, SEAL_PRINT_RECEIPT_FIELDS);
      const row = await tx
        .repository<SealReceipt>('sealReceipts')
        .withPolicy(access.receipts)
        .findOne({
          filter: { ledgerId: ledger.id },
          select: (s) => s.fields(...SEAL_PRINT_RECEIPT_FIELDS),
        });
      if (!row) fail('SEAL_EVIDENCE_REQUIRED');
      complete<Pick<SealReceipt, (typeof SEAL_PRINT_RECEIPT_FIELDS)[number]>>(
        row,
        SEAL_PRINT_RECEIPT_FIELDS,
      );
      receipt = row;
      if (
        receipt.requestId !== ledger.requestId ||
        receipt.sealId !== ledger.sealId ||
        receipt.contractConfirmation === 'unconfirmed'
      )
        fail('SEAL_EVIDENCE_REQUIRED');
    }
    const actual = ledger.external
        ? receipt!.actualCopies
        : ledger.actualCopies,
      sealedAt = instant(ledger.external ? receipt!.sealedAt : ledger.sealedAt),
      borrowedAt = instant(ledger.borrowedAt),
      returnedAt = instant(receipt?.returnedAt ?? null);
    if (
      !sealedAt ||
      !Number.isInteger(actual) ||
      !actual ||
      actual < 1 ||
      actual > ledger.approvedCopies ||
      (ledger.external &&
        (!borrowedAt ||
          !returnedAt ||
          borrowedAt > sealedAt ||
          sealedAt > returnedAt))
    )
      fail('SEAL_EVIDENCE_REQUIRED');
    const people = dependencies.users.withConnection(tx),
      person = async (id: string) => {
        const user = await people.get(id);
        if (!user) fail('SEAL_EVIDENCE_REQUIRED');
        return { id, name: user.name };
      },
      department = (
        await dependencies.org.activeChain(ledger.departmentId, tx)
      )?.[0];
    if (!department) fail('SEAL_EVIDENCE_REQUIRED');
    return {
      number: request.number,
      applicant: await person(ledger.applicantId),
      department: { id: department.id, name: department.title },
      seal: { id: ledger.sealId, type: request.sealType },
      approvedCopies: ledger.approvedCopies,
      actualCopies: actual,
      external: ledger.external,
      borrowedAt,
      sealedAt,
      returnedAt,
      registeredAt: instant(ledger.registeredAt)!,
      registeredBy: await person(ledger.registeredById),
      confirmedBy: receipt ? await person(receipt.confirmedById) : null,
    };
  };
}
