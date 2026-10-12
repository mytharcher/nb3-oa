import type { DatabaseConnection } from '@nocobase/db';
import type { InvoiceService } from '../invoices/contract.js';
import type {
  ExpenseAuthorizationService,
  ExpenseCommand,
} from '../expense-authorizations/contract.js';
import type { LoanLedgerService } from '../loan-ledger/contract.js';
import type { ReimbursementRecord } from './contract.js';
import {
  paymentAmounts,
  totalClaimCents,
  ReimbursementAmountError,
} from './amounts.js';

const fail = (code: string, message: string): never => {
  throw new ReimbursementAmountError(code, message);
};
/** Caller is a trusted lifecycle transition. Every reservation is part of the document transaction;
 * this service cannot independently submit, approve, pay or authorize access to a reimbursement. */
export function createReimbursementFunding(d: {
  invoices: InvoiceService;
  authorizations: ExpenseAuthorizationService;
  loans: LoanLedgerService;
}) {
  function checkBinding(record: ReimbursementRecord) {
    if (!Number.isSafeInteger(record.debtHeldCents) || record.debtHeldCents < 0)
      fail(
        'REIMBURSEMENT_LOAN_HOLD_INVALID',
        'The persisted loan hold must be exact nonnegative cents.',
      );
    if (
      record.bindingCaptured &&
      (record.authorizationId !== record.boundAuthorizationId ||
        record.loanId !== record.boundLoanId)
    )
      fail(
        'REIMBURSEMENT_SOURCE_REBIND_FORBIDDEN',
        'An already submitted reimbursement cannot change its authorization or loan source.',
      );
  }
  return {
    async prepareSubmission(
      record: ReimbursementRecord,
      command: ExpenseCommand,
      connection: DatabaseConnection,
    ) {
      return connection.transaction(async (tx) => {
        checkBinding(record);
        const totalCents = totalClaimCents(record.lines);
        paymentAmounts(totalCents, record.offsetCents);
        if (!record.loanId && record.offsetCents)
          fail(
            'REIMBURSEMENT_LOAN_REQUIRED',
            'A positive loan offset requires its original loan.',
          );
        if (record.loanId) {
          const loan = await d.loans.get(record.loanId, tx);
          if (!loan || loan.applicantId !== record.applicantId)
            return fail(
              'REIMBURSEMENT_LOAN_INVALID',
              'The selected issued loan must belong to the applicant.',
            );
          // Submission validates availability but does not reserve debt. It is frozen only on entry to cashier.
          if (record.offsetCents > loan.availableCents + record.debtHeldCents)
            fail(
              'REIMBURSEMENT_LOAN_INSUFFICIENT',
              'The selected loan has insufficient available debt for this offset.',
            );
        }
        await d.invoices.reserveLines(
          {
            ...command,
            documentId: record.id,
            applicantId: record.applicantId,
            lines: record.lines.map((line) => ({
              lineId: line.id,
              invoiceNumber: line.invoiceNumber,
              cents: line.amountCents,
              attachmentIds: line.attachmentIds,
            })),
          },
          tx,
        );
        if (record.authorizationId) {
          const authorization = await d.authorizations.get(
            record.authorizationId,
            tx,
          );
          if (
            !authorization ||
            authorization.applicantId !== record.applicantId
          )
            fail(
              'REIMBURSEMENT_AUTHORIZATION_INVALID',
              'The approved expense allowance must belong to the applicant.',
            );
          const existing = (
            await d.authorizations.claims(record.authorizationId, tx)
          ).find((claim) => claim.reimbursementId === record.id);
          const input = {
            ...command,
            authorizationId: record.authorizationId,
            applicantId: record.applicantId,
            reimbursementId: record.id,
            cents: totalCents,
            overrunReason: record.overrunReason,
          };
          if (existing) await d.authorizations.adjustClaim(input, tx);
          else await d.authorizations.reserveClaim(input, tx);
        }
        return {
          totalCents,
          bindingCaptured: true,
          boundAuthorizationId: record.authorizationId,
          boundLoanId: record.loanId,
        };
      });
    },
    async freezeDebt(
      record: ReimbursementRecord,
      command: ExpenseCommand,
      connection: DatabaseConnection,
    ) {
      return connection.transaction(async (tx) => {
        checkBinding(record);
        paymentAmounts(record.totalCents, record.offsetCents);
        if (!record.loanId && record.offsetCents)
          fail(
            'REIMBURSEMENT_LOAN_REQUIRED',
            'A positive loan offset requires an issued loan.',
          );
        if (
          record.loanId &&
          (record.offsetCents > 0 || record.debtHoldRecorded)
        )
          await d.loans.reserveOffset(
            {
              ...command,
              loanId: record.loanId,
              applicantId: record.applicantId,
              reimbursementId: record.id,
              cents: record.offsetCents,
            },
            tx,
          );
        return {
          debtHeldCents: record.offsetCents,
          debtHoldRecorded: Boolean(
            record.loanId &&
            (record.offsetCents > 0 || record.debtHoldRecorded),
          ),
        };
      });
    },
    async release(
      record: ReimbursementRecord,
      command: ExpenseCommand,
      connection: DatabaseConnection,
    ) {
      return connection.transaction(async (tx) => {
        checkBinding(record);
        await d.invoices.releaseDocument(
          { ...command, documentId: record.id },
          tx,
        );
        if (
          record.authorizationId &&
          (await d.authorizations.claims(record.authorizationId, tx)).some(
            (claim) => claim.reimbursementId === record.id,
          )
        )
          await d.authorizations.cancelClaim(
            {
              ...command,
              authorizationId: record.authorizationId,
              reimbursementId: record.id,
            },
            tx,
          );
        if (record.loanId && record.debtHoldRecorded)
          await d.loans.releaseOffset(
            { ...command, loanId: record.loanId, reimbursementId: record.id },
            tx,
          );
        return { debtHeldCents: 0, debtHoldRecorded: false };
      });
    },
  };
}
