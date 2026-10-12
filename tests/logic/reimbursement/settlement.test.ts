import { reimbursementExpenseSummaryToken } from '../../../server/providers/reimbursement/expense-summary.js';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { invoiceServiceToken } from '../../../server/providers/invoices/contract.ts';
import { expenseAuthorizationServiceToken } from '../../../server/providers/expense-authorizations/contract.ts';
import { loanLedgerServiceToken } from '../../../server/providers/loan-ledger/contract.ts';
import { createReimbursementSettlement } from '../../../server/providers/reimbursement/settlement.ts';
import type { ReimbursementRecord } from '../../../server/providers/reimbursement/contract.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();

describe('reimbursement payment conserves invoice, quota and debt in one transaction', () => {
  test('a full loan offset records zero cash and forced completion requires all three exact confirmations', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      audit = app.container.resolve(auditServiceToken),
      invoices = app.container.resolve(invoiceServiceToken),
      authorizations = app.container.resolve(expenseAuthorizationServiceToken),
      loans = app.container.resolve(loanLedgerServiceToken);
    const settle = createReimbursementSettlement({
      audit,
      invoices,
      authorizations,
      loans,
    });
    const now = new Date('2026-10-11T04:00:00Z'),
      id = randomUUID();
    const cmd = () => ({
      actorId: 'root',
      reason: 'Confirmed manually',
      requestKey: randomUUID(),
      now,
    });
    const { record, loan } = await db.transaction(async (tx) => {
      const loan = await loans.issue(
        {
          ...cmd(),
          sourceId: randomUUID(),
          applicantId: 'employee',
          principalCents: 29,
          dueDate: '2026-12-31',
        },
        tx,
      );
      const line = {
        id: randomUUID(),
        category: 'other',
        date: '2026-10-11',
        amountCents: 29,
        invoiceNumber: randomUUID(),
        attachmentIds: [randomUUID()],
        standardExceptionReason: '',
      };
      const result = await tx
        .repository<ReimbursementRecord>('reimbursementRequests')
        .createOne({
          values: {
            id,
            applicantId: 'employee',
            createdById: 'employee',
            reason: 'Expense',
            authorizationId: null,
            loanId: loan.id,
            offsetCents: 29,
            overrunReason: '',
            lines: [line],
            totalCents: 29,
            financeLineFacts: {},
            status: 'cashier',
            statusChangedAt: now,
            lifecycleVersion: 1,
            createdAt: now,
          },
        });
      await invoices.reserveLines(
        {
          ...cmd(),
          documentId: id,
          applicantId: 'employee',
          lines: [
            {
              lineId: line.id,
              invoiceNumber: line.invoiceNumber,
              cents: 29,
              attachmentIds: line.attachmentIds,
            },
          ],
        },
        tx,
      );
      await loans.reserveOffset(
        {
          ...cmd(),
          loanId: loan.id,
          applicantId: 'employee',
          reimbursementId: id,
          cents: 29,
        },
        tx,
      );
      return {
        record: {
          ...result.record,
          totalCents: 29,
          offsetCents: 29,
        } as ReimbursementRecord,
        loan,
      };
    });
    const forced = {
      actorId: 'root',
      requestKey: randomUUID(),
      now,
      voucherNumber: null,
      forced: true as const,
      reason: 'Confirmed full debt offset; no bank cash paid',
      confirmedGrossCents: 29,
      confirmedOffsetCents: 29,
      confirmedNetCents: 0,
    };
    for (const bad of [
      { ...forced, confirmedGrossCents: 28 },
      { ...forced, confirmedOffsetCents: 0 },
      { ...forced, confirmedNetCents: 29 },
      { ...forced, reason: '' },
    ])
      await expect(
        db.transaction((tx) => settle(record, bad, tx)),
      ).rejects.toMatchObject({
        code: 'REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED',
      });
    await expect(
      db.transaction((tx) =>
        settle(
          record,
          {
            actorId: 'cashier',
            requestKey: randomUUID(),
            now,
            voucherNumber: null,
            forced: false,
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_VOUCHER_REQUIRED' });
    expect((await invoices.forDocument(id))[0].state).toBe('held');
    expect(await loans.get(loan.id)).toMatchObject({
      outstandingCents: 29,
      heldCents: 29,
    });
    const payment = await db.transaction((tx) => settle(record, forced, tx));
    expect(payment).toMatchObject({
      grossCents: 29,
      offsetCents: 29,
      netCents: 0,
      voucherNumber: null,
      forced: true,
      reason: forced.reason,
    });
    await db.repository('reimbursementRequests').updateMany({
      filter: { id },
      values: { status: 'forcedPaid', paymentId: payment.id },
    });
    const summary = await app.container
      .resolve(reimbursementExpenseSummaryToken)
      .list(
        { year: 2026, month: 10, page: 1, pageSize: 20 },
        { read: true, create: false, update: false, delete: false },
      );
    expect(summary.data).toMatchObject([
      { settledExpenseCents: 29, settledRequestCount: 1 },
    ]);
    expect(await loans.get(loan.id)).toMatchObject({
      principalCents: 29,
      outstandingCents: 0,
      repaidCents: 29,
      heldCents: 0,
    });
    expect(
      await db
        .repository('reimbursementPayments')
        .count({ filter: { requestId: id } }),
    ).toBe(1);
  });
  test('a failed audit rolls back every ledger, then payment settles gross quota and only offset debt once', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      audit = app.container.resolve(auditServiceToken),
      invoices = app.container.resolve(invoiceServiceToken),
      authorizations = app.container.resolve(expenseAuthorizationServiceToken),
      loans = app.container.resolve(loanLedgerServiceToken);
    const settle = createReimbursementSettlement({
      audit,
      invoices,
      authorizations,
      loans,
    });
    const now = new Date('2026-10-11T04:00:00Z');
    const command = () => ({
      actorId: 'cashier',
      reason: 'Test payment',
      requestKey: randomUUID(),
      now,
    });
    const recordId = randomUUID();
    const amountCents = 10001,
      offsetCents = 2501;
    const { authorization, loan, record } = await db.transaction(async (tx) => {
      const authorization = await authorizations.issue(
        {
          ...command(),
          budgetMode: 'none',
          sourceKind: 'oa.training',
          sourceId: randomUUID(),
          applicantId: 'employee',
          grantedCents: 20000,
        },
        tx,
      );
      const loan = await loans.issue(
        {
          ...command(),
          sourceId: randomUUID(),
          applicantId: 'employee',
          principalCents: 20000,
          dueDate: '2026-12-31',
        },
        tx,
      );
      const line = {
        id: randomUUID(),
        category: 'other',
        date: '2026-10-11',
        amountCents,
        invoiceNumber: randomUUID(),
        attachmentIds: [randomUUID()],
        standardExceptionReason: '',
      };
      const result = await tx
        .repository<ReimbursementRecord>('reimbursementRequests')
        .createOne({
          values: {
            id: recordId,
            applicantId: 'employee',
            createdById: 'employee',
            number: null,
            reason: 'Expense',
            authorizationId: authorization.id,
            loanId: loan.id,
            offsetCents,
            overrunReason: '',
            lines: [line],
            totalCents: amountCents,
            financeLineFacts: {},
            status: 'cashier',
            statusChangedAt: now,
            lifecycleVersion: 3,
            createdAt: now,
          },
        });
      await invoices.reserveLines(
        {
          ...command(),
          documentId: recordId,
          applicantId: 'employee',
          lines: [
            {
              lineId: line.id,
              invoiceNumber: line.invoiceNumber,
              cents: amountCents,
              attachmentIds: line.attachmentIds,
            },
          ],
        },
        tx,
      );
      await authorizations.reserveClaim(
        {
          ...command(),
          authorizationId: authorization.id,
          applicantId: 'employee',
          reimbursementId: recordId,
          cents: amountCents,
        },
        tx,
      );
      await loans.reserveOffset(
        {
          ...command(),
          loanId: loan.id,
          applicantId: 'employee',
          reimbursementId: recordId,
          cents: offsetCents,
        },
        tx,
      );
      return {
        authorization,
        loan,
        record: result.record as ReimbursementRecord,
      };
    });
    const input = {
      actorId: 'cashier',
      voucherNumber: 'VOUCHER-001',
      requestKey: randomUUID(),
      now,
      forced: false as const,
    };
    const originalAudit = audit.record.bind(audit);
    const spy = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, tx) => {
        if (entry.action === 'reimbursement.paid')
          throw new Error('Payment audit failed');
        return originalAudit(entry, tx);
      });
    await expect(
      db.transaction((tx) => settle(record, input, tx)),
    ).rejects.toThrow('Payment audit failed');
    await db.transaction(async (tx) => {
      await expect(settle(record, input, tx)).rejects.toThrow(
        'Payment audit failed',
      );
      expect((await invoices.forDocument(recordId, tx))[0].state).toBe('held');
      expect((await authorizations.claims(authorization.id, tx))[0].state).toBe(
        'pending',
      );
      expect(await loans.get(loan.id, tx)).toMatchObject({
        repaidCents: 0,
        heldCents: offsetCents,
      });
    });
    spy.mockRestore();
    expect((await invoices.forDocument(recordId))[0].state).toBe('held');
    expect((await authorizations.claims(authorization.id))[0].state).toBe(
      'pending',
    );
    expect(await loans.get(loan.id)).toMatchObject({
      principalCents: 20000,
      outstandingCents: 20000,
      heldCents: offsetCents,
    });
    expect(
      await db
        .repository('reimbursementPayments')
        .count({ filter: { requestId: recordId } }),
    ).toBe(0);
    const payment = await db.transaction((tx) => settle(record, input, tx));
    expect(payment).toMatchObject({
      grossCents: amountCents,
      offsetCents,
      netCents: 7500,
      forced: false,
      voucherNumber: 'VOUCHER-001',
    });
    expect((await invoices.forDocument(recordId))[0].state).toBe('used');
    expect((await authorizations.claims(authorization.id))[0]).toMatchObject({
      state: 'paid',
      cents: amountCents,
    });
    expect(await loans.get(loan.id)).toMatchObject({
      principalCents: 20000,
      repaidCents: offsetCents,
      outstandingCents: 17499,
      heldCents: 0,
    });
    expect((await db.transaction((tx) => settle(record, input, tx))).id).toBe(
      payment.id,
    );
    expect(
      await db
        .repository('reimbursementPayments')
        .count({ filter: { requestId: recordId } }),
    ).toBe(1);
    await expect(
      db.transaction((tx) =>
        settle(record, { ...input, voucherNumber: 'OTHER' }, tx),
      ),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_PAYMENT_ALREADY_RECORDED' });
    await expect(
      db.transaction((tx) =>
        settle(record, { ...input, actorId: 'other' }, tx),
      ),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_PAYMENT_ALREADY_RECORDED' });
    await expect(
      db.transaction((tx) =>
        settle(
          record,
          {
            ...input,
            forced: true,
            reason: 'Override',
            confirmedGrossCents: amountCents,
            confirmedOffsetCents: offsetCents,
            confirmedNetCents: 7500,
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_PAYMENT_ALREADY_RECORDED' });
    await expect(
      db.transaction((tx) =>
        settle({ ...record, lifecycleVersion: 2 }, input, tx),
      ),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_PAYMENT_STATE_CONFLICT' });
  });
});
