// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { loanLedgerServiceToken } from '../../../server/providers/loan-ledger/contract.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';

const test = createPlatformAppTest();
const cmd = (actorId = 'cashier') => ({
  actorId,
  reason: 'Loan ledger test',
  requestKey: randomUUID(),
});
const source = (principalCents = 10001) => ({
  ...cmd(),
  sourceId: randomUUID(),
  applicantId: 'employee',
  principalCents,
  dueDate: '2026-12-31',
});
describe('loan ledger transactional repayments', () => {
  test('holds reductions and cash confirmation preserve debt facts and require the applicant', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      service = app.container.resolve(loanLedgerServiceToken);
    const input = source(),
      loan = await db.transaction((tx) => service.issue(input, tx));
    expect((await db.transaction((tx) => service.issue(input, tx))).id).toBe(
      loan.id,
    );
    const reimbursementId = randomUUID();
    await db.transaction((tx) =>
      service.reserveOffset(
        {
          ...cmd(),
          loanId: loan.id,
          applicantId: 'employee',
          reimbursementId,
          cents: 2501,
        },
        tx,
      ),
    );
    expect(await service.get(loan.id)).toMatchObject({
      outstandingCents: 10001,
      heldCents: 2501,
      availableCents: 7500,
    });
    await db.transaction((tx) =>
      service.reserveOffset(
        {
          ...cmd(),
          loanId: loan.id,
          applicantId: 'employee',
          reimbursementId,
          cents: 2001,
        },
        tx,
      ),
    );
    await db.transaction((tx) =>
      service.settleOffset({ ...cmd(), loanId: loan.id, reimbursementId }, tx),
    );
    expect(await service.get(loan.id)).toMatchObject({
      outstandingCents: 8000,
      heldCents: 0,
      repaidCents: 2001,
    });
    await expect(
      db.transaction((tx) =>
        service.releaseOffset(
          { ...cmd(), loanId: loan.id, reimbursementId },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'LOAN_RESERVATION_CLOSED' });
    const receiptId = randomUUID();
    await db.transaction((tx) =>
      service.recordCashRepayment(
        { ...cmd(), loanId: loan.id, receiptId, cents: 5000 },
        tx,
      ),
    );
    expect(await service.get(loan.id)).toMatchObject({
      outstandingCents: 8000,
      heldCents: 5000,
    });
    await expect(
      db.transaction((tx) =>
        service.confirmCashRepayment(
          { ...cmd(), loanId: loan.id, receiptId },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'LOAN_CONFIRMATION_DENIED' });
    const confirmation = { ...cmd('employee'), loanId: loan.id, receiptId };
    await db.transaction((tx) =>
      service.confirmCashRepayment(confirmation, tx),
    );
    await db.transaction((tx) =>
      service.confirmCashRepayment(confirmation, tx),
    );
    await db.transaction((tx) =>
      service.confirmCashRepayment(
        { ...confirmation, requestKey: randomUUID() },
        tx,
      ),
    );
    expect(await service.get(loan.id)).toMatchObject({
      principalCents: 10001,
      outstandingCents: 3000,
      repaidCents: 7001,
      heldCents: 0,
    });
    expect(
      await db
        .repository('loanLedger')
        .count({ filter: { loanId: loan.id, kind: 'settled.cash' } }),
    ).toBe(1);
  });
  test('parallel repayments cannot overspend and global source keys cannot bind two loans', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      service = app.container.resolve(loanLedgerServiceToken);
    const loan = await db.transaction((tx) => service.issue(source(), tx));
    const results = await Promise.allSettled([
      db.transaction((tx) =>
        service.reserveOffset(
          {
            ...cmd(),
            loanId: loan.id,
            applicantId: 'employee',
            reimbursementId: randomUUID(),
            cents: 6000,
          },
          tx,
        ),
      ),
      db.transaction((tx) =>
        service.recordCashRepayment(
          { ...cmd(), loanId: loan.id, receiptId: randomUUID(), cents: 6000 },
          tx,
        ),
      ),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await service.get(loan.id)).toMatchObject({
      heldCents: 6000,
      availableCents: 4001,
    });
    const second = await db.transaction((tx) => service.issue(source(), tx));
    const reimbursementId = randomUUID();
    const twoLoans = await Promise.allSettled(
      [loan, second].map((current) =>
        db.transaction((tx) =>
          service.reserveOffset(
            {
              ...cmd(),
              loanId: current.id,
              applicantId: 'employee',
              reimbursementId,
              cents: 1000,
            },
            tx,
          ),
        ),
      ),
    );
    expect(twoLoans.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(twoLoans.find((r) => r.status === 'rejected')).toMatchObject({
      status: 'rejected',
      reason: { code: 'LOAN_SOURCE_CONFLICT' },
    });
    expect(
      await db
        .repository('loanReservations')
        .count({ filter: { reference: `reimbursement:${reimbursementId}` } }),
    ).toBe(1);
    const winner = twoLoans.find((r) => r.status === 'fulfilled');
    const third = await db.transaction((tx) => service.issue(source(), tx));
    if (winner?.status === 'fulfilled')
      await expect(
        db.transaction((tx) =>
          service.reserveOffset(
            {
              ...cmd(),
              loanId: third.id,
              applicantId: 'employee',
              reimbursementId,
              cents: 1,
            },
            tx,
          ),
        ),
      ).rejects.toMatchObject({ code: 'LOAN_SOURCE_CONFLICT' });
  });
  test('caller rollback and failing audit roll back balances, receipts and idempotency writes', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      service = app.container.resolve(loanLedgerServiceToken),
      audit = app.container.resolve(auditServiceToken);
    const loan = await db.transaction((tx) => service.issue(source(), tx));
    const receipt = {
      ...cmd(),
      loanId: loan.id,
      receiptId: randomUUID(),
      cents: 4000,
    };
    await expect(
      db.transaction(async (tx) => {
        await service.recordCashRepayment(receipt, tx);
        throw new Error('cash transaction failed');
      }),
    ).rejects.toThrow('cash transaction failed');
    expect(await service.get(loan.id)).toMatchObject({
      heldCents: 0,
      outstandingCents: 10001,
    });
    const spy = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('audit failed'));
    await expect(
      db.transaction((tx) => service.recordCashRepayment(receipt, tx)),
    ).rejects.toThrow('audit failed');
    spy.mockRestore();
    expect(
      await db
        .repository('loanReservations')
        .count({ filter: { loanId: loan.id } }),
    ).toBe(0);
    expect(
      await db
        .repository('loanOperations')
        .count({ filter: { loanId: loan.id, requestKey: receipt.requestKey } }),
    ).toBe(0);
    await db.transaction((tx) => service.recordCashRepayment(receipt, tx));
    await db.transaction((tx) =>
      service.cancelCashRepayment(
        { ...cmd(), loanId: loan.id, receiptId: receipt.receiptId },
        tx,
      ),
    );
    expect(await service.get(loan.id)).toMatchObject({
      heldCents: 0,
      outstandingCents: 10001,
    });
  });
  test('exact safe cents, idempotency conflicts, invalid dates and wrong borrowers are rejected atomically', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      service = app.container.resolve(loanLedgerServiceToken);
    const input = source(Number.MAX_SAFE_INTEGER),
      loan = await db.transaction((tx) => service.issue(input, tx));
    expect(loan.principalCents).toBe(Number.MAX_SAFE_INTEGER);
    await expect(
      db.transaction((tx) =>
        service.issue(
          { ...input, principalCents: Number.MAX_SAFE_INTEGER - 1 },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'LOAN_SOURCE_CONFLICT' });
    await expect(
      db.transaction((tx) =>
        service.issue({ ...source(), dueDate: '2026-02-30' }, tx),
      ),
    ).rejects.toMatchObject({ code: 'LOAN_INVALID_DATE' });
    const repayment = {
      ...cmd(),
      loanId: loan.id,
      applicantId: 'employee',
      reimbursementId: randomUUID(),
      cents: Number.MAX_SAFE_INTEGER,
    };
    await expect(
      db.transaction((tx) =>
        service.reserveOffset({ ...repayment, applicantId: 'stranger' }, tx),
      ),
    ).rejects.toMatchObject({ code: 'LOAN_APPLICANT_MISMATCH' });
    await db.transaction((tx) => service.reserveOffset(repayment, tx));
    await expect(
      db.transaction((tx) =>
        service.reserveOffset({ ...repayment, cents: 1 }, tx),
      ),
    ).rejects.toMatchObject({ code: 'LOAN_IDEMPOTENCY_CONFLICT' });
    await db.transaction((tx) =>
      service.settleOffset(
        {
          ...cmd(),
          loanId: loan.id,
          reimbursementId: repayment.reimbursementId,
        },
        tx,
      ),
    );
    expect(await service.get(loan.id)).toMatchObject({
      outstandingCents: 0,
      heldCents: 0,
      repaidCents: Number.MAX_SAFE_INTEGER,
    });
  });
});
