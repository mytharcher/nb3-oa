import type { DatabaseConnection } from '@nocobase/db';
import type { LoanLedgerService } from '../loan-ledger/contract.js';
import type { LoanRequestRecord } from './contract.js';
import { LoanRequestError } from './errors.js';
import { exceedsMoneyThreshold } from '../exact-money.js';
export async function lockLoanApplicant(
  applicantId: string,
  tx: DatabaseConnection,
): Promise<void> {
  const repo = tx.repository('loanApplicantLocks');
  let result = await repo.updateMany({
    filter: { applicantId },
    values: { version: { increment: 1 } },
  });
  if (!result.updatedCount) {
    try {
      await tx.transaction((savepoint) =>
        savepoint
          .repository('loanApplicantLocks')
          .createOne({ values: { applicantId, version: 1 } }),
      );
    } catch (error) {
      result = await repo.updateMany({
        filter: { applicantId },
        values: { version: { increment: 1 } },
      });
      if (!result.updatedCount) throw error;
    }
  }
}
/** Requires the applicant lock. Outstanding is debt before pending offsets/cash confirmations, never availableCents. */
export async function checkLoanQuota(
  input: {
    recordId: string;
    applicantId: string;
    amountCents: number;
    maxRule: unknown;
    localDate: string;
  },
  ledger: LoanLedgerService,
  tx: DatabaseConnection,
): Promise<{
  outstandingCents: number;
  inflightCents: number;
  totalCents: number;
}> {
  if (
    !Number.isSafeInteger(input.amountCents) ||
    input.amountCents <= 0 ||
    typeof input.maxRule !== 'number' ||
    !Number.isFinite(input.maxRule) ||
    input.maxRule < 0
  )
    throw new LoanRequestError(
      'LOAN_REQUEST_INVALID_AMOUNT',
      'Use positive safe integer cents and a valid personal limit.',
    );
  const debts = await ledger.listFor(input.applicantId, tx),
    requests = await tx
      .repository<LoanRequestRecord>('loanRequests')
      .findMany({ filter: { applicantId: input.applicantId } });
  const returnDates = new Map(requests.map((r) => [r.id, r.returnDueDate]));
  if (
    debts.some(
      (loan) =>
        loan.outstandingCents > 0 &&
        (returnDates.get(loan.sourceId) &&
        returnDates.get(loan.sourceId)! < loan.dueDate
          ? returnDates.get(loan.sourceId)!
          : loan.dueDate) < input.localDate,
    )
  )
    throw new LoanRequestError(
      'LOAN_REQUEST_OVERDUE',
      'Repay overdue loans before requesting another loan.',
    );
  const outstanding = debts.reduce(
      (sum, row) => sum + BigInt(row.outstandingCents),
      0n,
    ),
    inflight = requests
      .filter((r) => r.id !== input.recordId && r.heldCents > 0)
      .reduce((sum, r) => sum + BigInt(r.heldCents), 0n),
    total = outstanding + inflight + BigInt(input.amountCents);
  if (
    total > BigInt(Number.MAX_SAFE_INTEGER) ||
    exceedsMoneyThreshold(Number(total), input.maxRule)
  )
    throw new LoanRequestError(
      'LOAN_REQUEST_PERSONAL_LIMIT',
      'Outstanding debt and applications exceed the personal loan limit.',
    );
  return {
    outstandingCents: Number(outstanding),
    inflightCents: Number(inflight),
    totalCents: Number(total),
  };
}
