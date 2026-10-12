// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { invoiceServiceToken } from '../../../server/providers/invoices/contract.ts';
import { expenseAuthorizationServiceToken } from '../../../server/providers/expense-authorizations/contract.ts';
import { loanLedgerServiceToken } from '../../../server/providers/loan-ledger/contract.ts';
import { createReimbursementFunding } from '../../../server/providers/reimbursement/funding.ts';
import type { ReimbursementRecord } from '../../../server/providers/reimbursement/contract.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();
describe('reimbursement submission and cashier reservation boundaries', () => {
  test('a corrected zero offset keeps its reservation identity and cancels it without leaving an open debt hold', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      invoices = app.container.resolve(invoiceServiceToken),
      authorizations = app.container.resolve(expenseAuthorizationServiceToken),
      loans = app.container.resolve(loanLedgerServiceToken);
    const funding = createReimbursementFunding({
      invoices,
      authorizations,
      loans,
    });
    const command = () => ({
      actorId: 'employee',
      reason: 'Corrected offset',
      requestKey: randomUUID(),
    });
    const loan = await db.transaction((tx) =>
      loans.issue(
        {
          ...command(),
          sourceId: randomUUID(),
          applicantId: 'employee',
          principalCents: 29,
          dueDate: '2026-12-31',
        },
        tx,
      ),
    );
    let record = {
      id: randomUUID(),
      applicantId: 'employee',
      authorizationId: null,
      loanId: loan.id,
      debtHeldCents: 0,
      debtHoldRecorded: false,
      bindingCaptured: false,
      boundAuthorizationId: null,
      boundLoanId: null,
      totalCents: 29,
      offsetCents: 29,
      overrunReason: '',
      lines: [
        {
          id: randomUUID(),
          category: 'other',
          date: '2026-10-11',
          amountCents: 29,
          invoiceNumber: randomUUID(),
          attachmentIds: [randomUUID()],
          standardExceptionReason: '',
        },
      ],
    } as ReimbursementRecord;
    record = {
      ...record,
      ...(await db.transaction((tx) =>
        funding.prepareSubmission(record, command(), tx),
      )),
    };
    record = {
      ...record,
      ...(await db.transaction((tx) =>
        funding.freezeDebt(record, command(), tx),
      )),
    };
    expect(await loans.get(loan.id)).toMatchObject({ heldCents: 29 });
    record = { ...record, offsetCents: 0 };
    record = {
      ...record,
      ...(await db.transaction((tx) =>
        funding.freezeDebt(record, command(), tx),
      )),
    };
    expect(record).toMatchObject({ debtHoldRecorded: true, debtHeldCents: 0 });
    expect(await loans.get(loan.id)).toMatchObject({
      heldCents: 0,
      repaidCents: 0,
    });
    await db.transaction((tx) => funding.release(record, command(), tx));
    expect(
      await db
        .repository('loanReservations')
        .count({
          filter: {
            reference: `reimbursement:${record.id}`,
            state: 'cancelled',
            cents: 0,
          },
        }),
    ).toBe(1);
  });
  test('submission holds gross allowance and invoice but reserves loan debt only at cashier; cancelling releases all', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      invoices = app.container.resolve(invoiceServiceToken),
      authorizations = app.container.resolve(expenseAuthorizationServiceToken),
      loans = app.container.resolve(loanLedgerServiceToken);
    const funding = createReimbursementFunding({
      invoices,
      authorizations,
      loans,
    });
    const command = () => ({
      actorId: 'employee',
      reason: 'Reimbursement test',
      requestKey: randomUUID(),
      now: new Date('2026-10-11T01:00:00Z'),
    });
    const { allowance, loan } = await db.transaction(async (tx) => ({
      allowance: await authorizations.issue(
        {
          ...command(),
          sourceKind: 'oa.training',
          sourceId: randomUUID(),
          applicantId: 'employee',
          grantedCents: 20000,
        },
        tx,
      ),
      loan: await loans.issue(
        {
          ...command(),
          sourceId: randomUUID(),
          applicantId: 'employee',
          principalCents: 20000,
          dueDate: '2026-12-31',
        },
        tx,
      ),
    }));
    let record = {
      id: randomUUID(),
      applicantId: 'employee',
      authorizationId: allowance.id,
      loanId: loan.id,
      debtHeldCents: 0,
      bindingCaptured: false,
      boundAuthorizationId: null,
      boundLoanId: null,
      totalCents: 10001,
      offsetCents: 2501,
      overrunReason: '',
      lines: [
        {
          id: randomUUID(),
          category: 'other',
          date: '2026-10-11',
          amountCents: 10001,
          invoiceNumber: randomUUID(),
          attachmentIds: [randomUUID()],
          standardExceptionReason: '',
        },
      ],
    } as ReimbursementRecord;
    record = {
      ...record,
      ...(await db.transaction((tx) =>
        funding.prepareSubmission(record, command(), tx),
      )),
    };
    expect(record.bindingCaptured).toBe(true);
    expect((await invoices.forDocument(record.id))[0].state).toBe('held');
    expect((await authorizations.claims(allowance.id))[0]).toMatchObject({
      cents: 10001,
      state: 'pending',
    });
    expect(await loans.get(loan.id)).toMatchObject({
      heldCents: 0,
      availableCents: 20000,
    });
    for (const proposal of [
      { ...record, authorizationId: null },
      { ...record, loanId: null },
    ])
      await expect(
        db.transaction((tx) =>
          funding.prepareSubmission(proposal, command(), tx),
        ),
      ).rejects.toMatchObject({
        code: 'REIMBURSEMENT_SOURCE_REBIND_FORBIDDEN',
      });
    const revised = {
      ...record,
      totalCents: 8000,
      lines: [{ ...record.lines[0], amountCents: 8000 }],
    };
    record = {
      ...revised,
      ...(await db.transaction((tx) =>
        funding.prepareSubmission(revised, command(), tx),
      )),
    };
    expect((await authorizations.claims(allowance.id))[0].cents).toBe(8000);
    record = {
      ...record,
      ...(await db.transaction((tx) =>
        funding.freezeDebt(record, command(), tx),
      )),
    };
    expect(await loans.get(loan.id)).toMatchObject({
      outstandingCents: 20000,
      heldCents: 2501,
    });
    await db.transaction((tx) => funding.release(record, command(), tx));
    expect(await invoices.forDocument(record.id)).toHaveLength(0);
    expect(
      await db.repository('invoices').count({
        filter: {
          number: record.lines[0].invoiceNumber.toUpperCase(),
          state: 'available',
        },
      }),
    ).toBe(1);
    expect((await authorizations.claims(allowance.id))[0].state).toBe(
      'cancelled',
    );
    expect(await loans.get(loan.id)).toMatchObject({
      principalCents: 20000,
      outstandingCents: 20000,
      heldCents: 0,
    });
  });
});
