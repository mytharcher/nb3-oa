import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type {
  Loan,
  LoanBalance,
  LoanCommand,
  LoanReservation,
  LoanLedgerService,
} from './contract.js';

export class LoanLedgerError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'LoanLedgerError';
  }
}
const fail = (code: string, message: string): never => {
  throw new LoanLedgerError(`LOAN_${code}`, message);
};
function amount(cents: number, zero = false) {
  if (!Number.isSafeInteger(cents) || cents < (zero ? 0 : 1))
    fail('INVALID_AMOUNT', 'Loan amounts must be safe integer cents.');
}
function command(input: LoanCommand) {
  if (
    !input.actorId ||
    input.actorId.length > 64 ||
    !input.reason.trim() ||
    input.reason.length > 5000 ||
    !input.requestKey ||
    input.requestKey.length > 128
  )
    fail(
      'INVALID_COMMAND',
      'An actor, reason and bounded idempotency key are required.',
    );
  if (input.now && !Number.isFinite(input.now.getTime()))
    fail('INVALID_TIME', 'A valid timestamp is required.');
}
function identity(value: string) {
  if (!value || value.length > 64)
    fail('INVALID_ID', 'A bounded record identifier is required.');
}
function reservation(row: LoanReservation): LoanReservation {
  return {
    ...row,
    cents: Number(row.cents),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
export function createLoanLedgerService(
  db: DatabaseManager,
  audit: AuditService,
): LoanLedgerService {
  async function balance(
    row: Loan,
    tx: DatabaseConnection,
  ): Promise<LoanBalance> {
    const entries = await tx
      .repository<{ loanId: string; heldDelta: number; repaidDelta: number }>(
        'loanLedger',
      )
      .findMany({ filter: { loanId: row.id } });
    let held = 0n,
      repaid = 0n;
    for (const entry of entries) {
      held += BigInt(entry.heldDelta);
      repaid += BigInt(entry.repaidDelta);
    }
    const principal = BigInt(row.principalCents),
      outstanding = principal - repaid,
      available = outstanding - held;
    if (
      principal < 1n ||
      principal > BigInt(Number.MAX_SAFE_INTEGER) ||
      held < 0n ||
      repaid < 0n ||
      available < 0n
    )
      fail('CORRUPT_BALANCE', 'Loan ledger quantities are inconsistent.');
    return {
      ...row,
      principalCents: Number(principal),
      issuedAt: new Date(row.issuedAt),
      heldCents: Number(held),
      repaidCents: Number(repaid),
      outstandingCents: Number(outstanding),
      availableCents: Number(available),
    };
  }
  async function get(id: string, tx: DatabaseConnection) {
    const row = await tx.repository<Loan>('loans').findOne({ filter: { id } });
    return row ? balance(row, tx) : null;
  }
  async function lock(id: string, tx: DatabaseConnection) {
    identity(id);
    const result = await tx
      .repository('loans')
      .updateMany({ filter: { id }, values: { version: { increment: 1 } } });
    if (!result.updatedCount) fail('NOT_FOUND', 'The loan does not exist.');
    return (await get(id, tx))!;
  }
  async function operation(
    loanId: string,
    input: LoanCommand,
    kind: string,
    payload: unknown,
    tx: DatabaseConnection,
  ) {
    const repo = tx.repository('loanOperations'),
      fingerprint = JSON.stringify({
        kind,
        actorId: input.actorId,
        reason: input.reason,
        payload,
      });
    const old = await repo.findOne({
      filter: { loanId, requestKey: input.requestKey },
    });
    if (old) {
      if (old.fingerprint !== fingerprint)
        fail(
          'IDEMPOTENCY_CONFLICT',
          'This request key identifies another loan operation.',
        );
      return true;
    }
    await repo.createOne({
      values: {
        id: randomUUID(),
        loanId,
        requestKey: input.requestKey,
        fingerprint,
      },
    });
    return false;
  }
  async function entry(
    loan: LoanBalance,
    current: LoanReservation | null,
    input: LoanCommand,
    kind: string,
    heldDelta: number,
    repaidDelta: number,
    tx: DatabaseConnection,
  ) {
    const values = {
      id: randomUUID(),
      loanId: loan.id,
      reservationId: current?.id ?? null,
      reference: current?.reference ?? `loan:${loan.sourceId}`,
      kind,
      heldDelta,
      repaidDelta,
      actorId: input.actorId,
      reason: input.reason,
      at: input.now ?? new Date(),
    };
    await tx.repository('loanLedger').createOne({ values });
    await audit.record(
      {
        actorId: input.actorId,
        action: `loan.${kind}`,
        targetType: 'loans',
        targetId: loan.id,
        before:
          kind === 'issue'
            ? null
            : {
                outstandingCents: loan.outstandingCents,
                heldCents: loan.heldCents,
              },
        after: {
          sourceId: loan.sourceId,
          applicantId: loan.applicantId,
          principalCents: loan.principalCents,
          dueDate: loan.dueDate,
          outstandingCents: loan.outstandingCents - repaidDelta,
          heldCents: loan.heldCents + heldDelta,
          reservation: current,
        },
        reason: input.reason,
      },
      tx,
    );
  }
  async function reserve(
    input: LoanCommand & {
      loanId: string;
      applicantId?: string;
      referenceId: string;
      cents: number;
    },
    kind: 'cash' | 'reimbursement',
    connection: DatabaseConnection,
  ): Promise<LoanReservation> {
    command(input);
    identity(input.referenceId);
    amount(input.cents, kind === 'reimbursement');
    return connection.transaction(async (tx) => {
      const loan = await lock(input.loanId, tx),
        reference = `${kind}:${input.referenceId}`;
      if (kind === 'reimbursement' && input.applicantId !== loan.applicantId)
        fail(
          'APPLICANT_MISMATCH',
          'The reimbursement must belong to the loan applicant.',
        );
      const repo = tx.repository<LoanReservation>('loanReservations');
      let current = await repo.findOne({ filter: { reference } });
      if (current && current.loanId !== loan.id)
        fail(
          'SOURCE_CONFLICT',
          'This repayment is already linked to another loan.',
        );
      const oldAmount = current ? Number(current.cents) : 0;
      const replay = await operation(
        loan.id,
        input,
        `reserve.${kind}`,
        {
          reference,
          cents: input.cents,
          applicantId: input.applicantId ?? null,
        },
        tx,
      );
      if (replay) {
        if (!current) fail('NOT_FOUND', 'The replayed repayment is missing.');
        return reservation(current!);
      }
      if (current && current.state !== 'pending')
        fail('RESERVATION_CLOSED', 'A completed repayment cannot be changed.');
      if (kind === 'cash' && current)
        fail('SOURCE_CONFLICT', 'A recorded cash receipt is immutable.');
      const delta = input.cents - oldAmount;
      if (delta > loan.availableCents)
        fail(
          'INSUFFICIENT',
          'Pending repayments exceed the remaining loan balance.',
        );
      const at = input.now ?? new Date();
      if (current) {
        current = (
          await repo.updateOne({
            filter: { id: current.id },
            values: { cents: input.cents, updatedAt: at },
          })
        ).record;
      } else {
        // A receipt is global, while debt locks are per loan. A savepoint preserves the caller transaction after a
        // competing loan wins the unique receipt; the loser reports a business conflict without exposing SQL errors.
        try {
          current = await tx.transaction(
            async (savepoint) =>
              (
                await savepoint
                  .repository<LoanReservation>('loanReservations')
                  .createOne({
                    values: {
                      id: randomUUID(),
                      loanId: loan.id,
                      reference,
                      kind,
                      cents: input.cents,
                      state: 'pending',
                      createdAt: at,
                      updatedAt: at,
                    },
                  })
              ).record,
          );
        } catch (error) {
          const winner = await repo.findOne({ filter: { reference } });
          if (winner)
            fail(
              'SOURCE_CONFLICT',
              'This repayment is already linked to a loan.',
            );
          throw error;
        }
      }
      await entry(
        loan,
        reservation(current),
        input,
        `reserve.${kind}`,
        delta,
        0,
        tx,
      );
      return reservation(current);
    });
  }
  async function finish(
    input: LoanCommand & { loanId: string; referenceId: string },
    kind: 'cash' | 'reimbursement',
    state: 'settled' | 'cancelled',
    connection: DatabaseConnection,
  ): Promise<LoanReservation> {
    command(input);
    identity(input.referenceId);
    return connection.transaction(async (tx) => {
      const loan = await lock(input.loanId, tx),
        reference = `${kind}:${input.referenceId}`;
      if (
        kind === 'cash' &&
        state === 'settled' &&
        input.actorId !== loan.applicantId
      )
        fail(
          'CONFIRMATION_DENIED',
          'Only the loan applicant may confirm a cash repayment.',
        );
      const repo = tx.repository<LoanReservation>('loanReservations');
      const current = await repo.findOne({
        filter: { reference, loanId: loan.id },
      });
      if (!current)
        fail(
          'RESERVATION_NOT_FOUND',
          'The repayment reservation does not exist.',
        );
      if (
        await operation(loan.id, input, `${state}.${kind}`, { reference }, tx)
      )
        return reservation(current!);
      if (current!.state === state) return reservation(current!);
      if (current!.state !== 'pending')
        fail('RESERVATION_CLOSED', 'A completed repayment cannot be reversed.');
      const after = reservation(
        (
          await repo.updateOne({
            filter: { id: current!.id },
            values: { state, updatedAt: input.now ?? new Date() },
          })
        ).record,
      );
      await entry(
        loan,
        after,
        input,
        `${state}.${kind}`,
        -Number(current!.cents),
        state === 'settled' ? Number(current!.cents) : 0,
        tx,
      );
      return after;
    });
  }
  return {
    async issue(input, connection) {
      command(input);
      identity(input.sourceId);
      identity(input.applicantId);
      amount(input.principalCents);
      const date = new Date(`${input.dueDate}T00:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ||
        !Number.isFinite(date.getTime()) ||
        date.toISOString().slice(0, 10) !== input.dueDate
      )
        fail('INVALID_DATE', 'A valid local repayment date is required.');
      return connection.transaction(async (tx) => {
        const repo = tx.repository<Loan>('loans');
        let row = await repo.findOne({ filter: { sourceId: input.sourceId } });
        let fresh = false;
        if (!row) {
          try {
            row = await tx.transaction(
              async (savepoint) =>
                (
                  await savepoint.repository<Loan>('loans').createOne({
                    values: {
                      id: randomUUID(),
                      sourceId: input.sourceId,
                      applicantId: input.applicantId,
                      principalCents: input.principalCents,
                      dueDate: input.dueDate,
                      issuedAt: input.now ?? new Date(),
                      version: 0,
                    },
                  })
                ).record,
            );
            fresh = true;
          } catch (error) {
            row = await repo.findOne({ filter: { sourceId: input.sourceId } });
            if (!row) throw error;
          }
        }
        const loan = await lock(row.id, tx);
        if (
          loan.applicantId !== input.applicantId ||
          loan.principalCents !== input.principalCents ||
          loan.dueDate !== input.dueDate
        )
          fail(
            'SOURCE_CONFLICT',
            'The approved source already created a different loan.',
          );
        const replay = await operation(
          loan.id,
          input,
          'issue',
          {
            sourceId: input.sourceId,
            applicantId: input.applicantId,
            principalCents: input.principalCents,
            dueDate: input.dueDate,
          },
          tx,
        );
        if (fresh && !replay) await entry(loan, null, input, 'issue', 0, 0, tx);
        return (await get(loan.id, tx))!;
      });
    },
    get: (id, tx = db.connection()) => get(id, tx),
    async listFor(applicantId, tx = db.connection()) {
      identity(applicantId);
      return Promise.all(
        (
          await tx.repository<Loan>('loans').findMany({
            filter: { applicantId },
            sort: (s) => [s.field('issuedAt').desc()],
          })
        ).map((row) => balance(row, tx)),
      );
    },
    reserveOffset: (input, tx) =>
      reserve(
        { ...input, referenceId: input.reimbursementId },
        'reimbursement',
        tx,
      ),
    settleOffset: (input, tx) =>
      finish(
        { ...input, referenceId: input.reimbursementId },
        'reimbursement',
        'settled',
        tx,
      ),
    releaseOffset: (input, tx) =>
      finish(
        { ...input, referenceId: input.reimbursementId },
        'reimbursement',
        'cancelled',
        tx,
      ),
    recordCashRepayment: (input, tx) =>
      reserve({ ...input, referenceId: input.receiptId }, 'cash', tx),
    confirmCashRepayment: (input, tx) =>
      finish({ ...input, referenceId: input.receiptId }, 'cash', 'settled', tx),
    cancelCashRepayment: (input, tx) =>
      finish(
        { ...input, referenceId: input.receiptId },
        'cash',
        'cancelled',
        tx,
      ),
  };
}
