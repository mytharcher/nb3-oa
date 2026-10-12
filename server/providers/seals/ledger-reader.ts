import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import type { OrgService } from '../org/contract.js';
import { SealError, fail } from './errors.js';
import { createSealPrintRegistration } from './print-registration.js';
import {
  SEAL_LEDGER_FIELDS,
  SEAL_PRINT_REQUEST_FIELDS,
  SEAL_PRINT_RECEIPT_FIELDS,
  type SealLedger,
  type SealReceipt,
  type SealRequest,
  type SealService,
  type SealRegistrationAccess,
} from './contract.js';
function requireRead(policy: RepositoryPolicy, fields: readonly string[]) {
  const read = policy.read;
  if (read === false) fail('ACCESS_DENIED');
  if (read === true) return;
  const allowed = read.fields;
  if (!Array.isArray(allowed) || !fields.every((f) => allowed.includes(f)))
    fail('ACCESS_DENIED');
}
export function createSealLedgerReader(d: {
  users: UserAdministrationService;
  org: OrgService;
}): Pick<SealService, 'ledgerDetail' | 'ledgerPage'> {
  const print = createSealPrintRegistration(d);
  async function ledgerDetail(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    access: SealRegistrationAccess,
  ) {
    requireRead(access.ledger, SEAL_LEDGER_FIELDS);
    requireRead(access.requests, SEAL_PRINT_REQUEST_FIELDS);
    requireRead(access.receipts, [...SEAL_PRINT_RECEIPT_FIELDS, 'reason']);
    const rawLedger = await tx
      .repository<SealLedger>('sealLedger')
      .withPolicy(access.ledger)
      .findOne({ filter: { id } });
    if (!rawLedger || SEAL_LEDGER_FIELDS.some((f) => !(f in rawLedger)))
      fail('ACCESS_DENIED');
    const ledger = rawLedger as SealLedger;
    const rawRequest = await tx
      .repository<SealRequest>('sealRequests')
      .withPolicy(access.requests)
      .findOne({
        filter: { id: ledger.requestId },
        select: (s) => s.fields(...SEAL_PRINT_REQUEST_FIELDS),
      });
    if (
      !rawRequest ||
      SEAL_PRINT_REQUEST_FIELDS.some((f) => !(f in rawRequest))
    )
      fail('ACCESS_DENIED');
    const request = rawRequest as SealRequest;
    if (
      request.ledgerId !== ledger.id ||
      request.applicantId !== ledger.applicantId ||
      request.departmentId !== ledger.departmentId ||
      request.copies !== ledger.approvedCopies
    )
      fail('SEAL_EVIDENCE_REQUIRED');
    // Detect inaccessible existing receipts without turning absence of scope into a false "unreturned" fact.
    const existing = await tx
      .repository<SealReceipt>('sealReceipts')
      .findOne({ filter: { ledgerId: id }, select: (s) => s.fields('id') });
    const rawReceipt = await tx
      .repository<SealReceipt>('sealReceipts')
      .withPolicy(access.receipts)
      .findOne({ filter: { ledgerId: id } });
    if (
      existing &&
      (!rawReceipt ||
        [...SEAL_PRINT_RECEIPT_FIELDS, 'reason'].some(
          (f) => !(f in rawReceipt),
        ))
    )
      fail('ACCESS_DENIED');
    const receipt = rawReceipt as SealReceipt | null;
    if (
      receipt &&
      (receipt.requestId !== ledger.requestId ||
        receipt.sealId !== ledger.sealId)
    )
      fail('SEAL_EVIDENCE_REQUIRED');
    const person = async (userId: string) => ({
      id: userId,
      name: (await d.users.withConnection(tx).get(userId))?.name ?? userId,
    });
    let printable = false;
    try {
      await print(id, actorId, tx, access);
      printable = true;
    } catch (error) {
      if (
        !(error instanceof SealError) ||
        error.code !== 'SEAL_EVIDENCE_REQUIRED'
      )
        throw error;
    }
    return {
      record: {
        ...ledger,
        applicant: await person(ledger.applicantId),
        registeredBy: await person(ledger.registeredById),
      },
      request: {
        id: request.id,
        number: request.number,
        status: request.status,
      },
      receipt: receipt
        ? { ...receipt, confirmedBy: await person(receipt.confirmedById) }
        : null,
      printable,
    };
  }
  return {
    ledgerDetail,
    async ledgerPage(actorId, tx, access, query) {
      if (
        !Number.isInteger(query.page) ||
        query.page < 1 ||
        ![10, 20, 50, 100].includes(query.pageSize)
      )
        fail('INVALID_COMMAND');
      requireRead(access.ledger, SEAL_LEDGER_FIELDS);
      requireRead(access.requests, SEAL_PRINT_REQUEST_FIELDS);
      requireRead(access.receipts, [...SEAL_PRINT_RECEIPT_FIELDS, 'reason']);
      const candidates = await tx
        .repository<SealLedger>('sealLedger')
        .withPolicy(access.ledger)
        .findMany({
          sort: (s) => [s.field('registeredAt').desc(), s.field('id').desc()],
        });
      const visible = [];
      for (const row of candidates) {
        try {
          visible.push(
            (await ledgerDetail(row.id!, actorId, tx, access)).record,
          );
        } catch (error) {
          if (!(error instanceof SealError) || error.code !== 'ACCESS_DENIED')
            throw error;
        }
      }
      return {
        data: visible.slice(
          (query.page - 1) * query.pageSize,
          query.page * query.pageSize,
        ),
        meta: { total: visible.length, ...query },
      };
    },
  };
}
