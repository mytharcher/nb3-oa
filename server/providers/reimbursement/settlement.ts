import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { InvoiceService } from '../invoices/contract.js';
import type { ExpenseAuthorizationService } from '../expense-authorizations/contract.js';
import type { LoanLedgerService } from '../loan-ledger/contract.js';
import type { ReimbursementRecord } from './contract.js';
import {
  paymentAmounts,
  totalClaimCents,
  ReimbursementAmountError,
} from './amounts.js';

export interface ReimbursementPayment {
  id: string;
  requestId: string;
  actorId: string;
  grossCents: number;
  offsetCents: number;
  netCents: number;
  voucherNumber: string | null;
  forced: boolean;
  reason: string | null;
  at: Date;
}
type Completion = {
  actorId: string;
  voucherNumber: string | null;
  requestKey: string;
  now: Date;
} & (
  | { forced: false }
  | {
      forced: true;
      reason: string;
      confirmedGrossCents: number;
      confirmedOffsetCents: number;
      confirmedNetCents: number;
    }
);
function refuse(code: string, message: string): never {
  throw new ReimbursementAmountError(code, message);
}
function centsFromStorage(value: unknown): number {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
    return value;
  if (
    (typeof value === 'string' && /^\d+$/.test(value)) ||
    typeof value === 'bigint'
  ) {
    const integer = BigInt(value);
    if (integer >= 0n && integer <= BigInt(Number.MAX_SAFE_INTEGER))
      return Number(integer);
  }
  return refuse(
    'REIMBURSEMENT_PAYMENT_CONTENT_CONFLICT',
    'Stored monetary values must be exact nonnegative safe cents.',
  );
}

/** Trusted final-state hook only. Authentication, the claimed cashier task and approval guards belong to
 * the lifecycle; this coordinator does not expose a shortcut HTTP command for transferring money. */
export function createReimbursementSettlement(dependencies: {
  audit: AuditService;
  invoices: InvoiceService;
  authorizations: ExpenseAuthorizationService;
  loans: LoanLedgerService;
}) {
  return async function settle(
    record: ReimbursementRecord,
    input: Completion,
    connection: DatabaseConnection,
  ): Promise<ReimbursementPayment> {
    // The savepoint also protects callers that catch a ledger failure inside their wider transaction.
    return connection.transaction(async (tx) => {
      // A conditional no-op write acquires the row lock through the public Repository API on every dialect.
      const locked = await tx.repository('reimbursementRequests').updateMany({
        filter: {
          id: record.id,
          lifecycleVersion: record.lifecycleVersion,
          status: record.status,
        },
        values: { status: record.status },
      });
      if (!locked.updatedCount)
        refuse(
          'REIMBURSEMENT_PAYMENT_STATE_CONFLICT',
          'The current payment state or version changed.',
        );
      const stored = await tx
        .repository<ReimbursementRecord>('reimbursementRequests')
        .findOne({ filter: { id: record.id } });
      if (
        !stored ||
        stored.lifecycleVersion !== record.lifecycleVersion ||
        !['cashier', 'paid', 'forcedPaid'].includes(stored.status)
      )
        refuse(
          'REIMBURSEMENT_PAYMENT_STATE_CONFLICT',
          'The current payment state or version changed.',
        );
      if (
        centsFromStorage(stored.totalCents) !==
          centsFromStorage(record.totalCents) ||
        centsFromStorage(stored.offsetCents) !==
          centsFromStorage(record.offsetCents) ||
        stored.authorizationId !== record.authorizationId ||
        stored.loanId !== record.loanId
      )
        refuse(
          'REIMBURSEMENT_PAYMENT_CONTENT_CONFLICT',
          'Settlement must match the persisted approved claim.',
        );
      const amounts = paymentAmounts(
        centsFromStorage(stored.totalCents),
        centsFromStorage(stored.offsetCents),
      );
      if (
        (stored.status === 'paid' && input.forced) ||
        (stored.status === 'forcedPaid' && !input.forced)
      )
        refuse(
          'REIMBURSEMENT_PAYMENT_STATE_CONFLICT',
          'Normal and forced payment facts must match their final state.',
        );
      if (
        totalClaimCents(stored.lines) !== amounts.grossCents ||
        (!stored.loanId && amounts.offsetCents !== 0)
      )
        refuse(
          'REIMBURSEMENT_PAYMENT_CONTENT_CONFLICT',
          'Claim totals and loan linkage must agree.',
        );
      if (
        !input.actorId ||
        input.actorId.length > 64 ||
        !input.requestKey ||
        input.requestKey.length > 128 ||
        !Number.isFinite(input.now.getTime())
      )
        refuse(
          'REIMBURSEMENT_PAYMENT_INVALID',
          'An actor, stable command key and valid time are required.',
        );
      if (
        input.voucherNumber !== null &&
        typeof input.voucherNumber !== 'string'
      )
        refuse(
          'REIMBURSEMENT_VOUCHER_REQUIRED',
          'A voucher must be text or null.',
        );
      const voucherNumber = input.voucherNumber?.trim() || null;
      if (
        (!input.forced && !voucherNumber) ||
        (voucherNumber?.length ?? 0) > 128
      )
        refuse(
          'REIMBURSEMENT_VOUCHER_REQUIRED',
          'Normal payment requires its voucher number.',
        );
      const reason =
        input.forced && typeof input.reason === 'string'
          ? input.reason.trim()
          : null;
      if (
        input.forced &&
        (!reason ||
          reason.length > 5000 ||
          input.confirmedGrossCents !== amounts.grossCents ||
          input.confirmedOffsetCents !== amounts.offsetCents ||
          input.confirmedNetCents !== amounts.netCents)
      )
        refuse(
          'REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED',
          'Forced payment requires a reason and exact confirmation of gross, offset and cash amounts.',
        );
      const previous = await tx
        .repository('reimbursementPayments')
        .findOne({ filter: { requestId: record.id } });
      if (previous) {
        if (
          previous.actorId !== input.actorId ||
          centsFromStorage(previous.grossCents) !== amounts.grossCents ||
          centsFromStorage(previous.offsetCents) !== amounts.offsetCents ||
          centsFromStorage(previous.netCents) !== amounts.netCents ||
          previous.voucherNumber !== voucherNumber ||
          previous.forced !== input.forced ||
          previous.reason !== reason
        )
          refuse(
            'REIMBURSEMENT_PAYMENT_ALREADY_RECORDED',
            'This reimbursement already has a different immutable payment fact.',
          );
        return { ...previous, ...amounts } as unknown as ReimbursementPayment;
      }
      const auditReason = reason ?? 'Cashier confirmed reimbursement payment';
      const command = {
        actorId: input.actorId,
        requestKey: input.requestKey,
        reason: auditReason,
        now: input.now,
      };
      const invoices = await dependencies.invoices.forDocument(stored.id, tx);
      if (
        invoices.length !== stored.lines.length ||
        stored.lines.some(
          (line) =>
            !invoices.some(
              (invoice) =>
                invoice.lineId === line.id &&
                invoice.cents === line.amountCents &&
                invoice.state === 'held',
            ),
        )
      )
        refuse(
          'REIMBURSEMENT_INVOICES_CHANGED',
          'Every payable line must retain its held invoice evidence.',
        );
      if (stored.authorizationId) {
        const claim = (
          await dependencies.authorizations.claims(stored.authorizationId, tx)
        ).find((item) => item.reimbursementId === stored.id);
        if (
          !claim ||
          claim.state !== 'pending' ||
          claim.cents !== amounts.grossCents
        )
          refuse(
            'REIMBURSEMENT_AUTHORIZATION_CHANGED',
            'The reserved expense claim must match the gross reimbursement.',
          );
      }
      await dependencies.invoices.useDocument(
        { ...command, documentId: stored.id },
        tx,
      );
      if (stored.authorizationId)
        await dependencies.authorizations.settleClaim(
          {
            ...command,
            authorizationId: stored.authorizationId,
            reimbursementId: stored.id,
          },
          tx,
        );
      if (
        stored.loanId &&
        (amounts.offsetCents > 0 || stored.debtHoldRecorded)
      ) {
        const reservation = await dependencies.loans.settleOffset(
          { ...command, loanId: stored.loanId, reimbursementId: stored.id },
          tx,
        );
        if (reservation.cents !== amounts.offsetCents)
          refuse(
            'REIMBURSEMENT_LOAN_CHANGED',
            'The settled loan offset must match the confirmed amount.',
          );
      }
      const payment: ReimbursementPayment = {
        id: stored.paymentId ?? randomUUID(),
        requestId: stored.id,
        actorId: input.actorId,
        ...amounts,
        voucherNumber,
        forced: input.forced,
        reason,
        at: input.now,
      };
      await tx
        .repository('reimbursementPayments')
        .createOne({ values: { ...payment } });
      await dependencies.audit.record(
        {
          actorId: input.actorId,
          action: input.forced
            ? 'reimbursement.forcePaid'
            : 'reimbursement.paid',
          targetType: 'reimbursementRequests',
          targetId: stored.id,
          reason: auditReason,
          after: {
            ...amounts,
            paymentId: payment.id,
            voucherNumber,
            forced: input.forced,
          },
        },
        tx,
      );
      return payment;
    });
  };
}
