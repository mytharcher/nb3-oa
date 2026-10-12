// @vitest-environment node
import type { Application } from '@nocobase/app-server/application';
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createPlatformAppTest } from '../platform/helpers.ts';
import { budgetServiceToken } from '../../../server/providers/budgets/contract.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { calendarServiceToken } from '../../../server/providers/platform/calendar.ts';
import { createExpenseAuthorizationService } from '../../../server/providers/expense-authorizations/service.ts';
const test = createPlatformAppTest();
const now = new Date('2026-01-01T04:00:00Z');
const cmd = (reason = 'Expense test') => ({
  actorId: 'finance-test',
  reason,
  requestKey: randomUUID(),
  now,
});
function services(app: Application) {
  const db = app.container.resolve(databaseManagerToken),
    budget = app.container.resolve(budgetServiceToken),
    audit = app.container.resolve(auditServiceToken),
    calendar = app.container.resolve(calendarServiceToken);
  return {
    db,
    budget,
    audit,
    service: createExpenseAuthorizationService({ db, budget, audit, calendar }),
  };
}
describe('approved expense allowance and partial cash settlement', () => {
  test('two simultaneous claims share one serialized allowance and overrun uses the exact 120% boundary', async ({
    app,
  }) => {
    const { db, budget, service } = services(app),
      account = { departmentId: randomUUID(), year: 2026, subject: 'office' };
    await db.transaction((tx) =>
      budget.allocate(
        { ...account, ...cmd(), reference: 'annual', deltaCents: 100000 },
        tx,
      ),
    );
    const source = {
      ...account,
      ...cmd(),
      sourceKind: 'oa.expensePlan' as const,
      sourceId: randomUUID(),
      applicantId: 'employee',
      grantedCents: 10000,
    };
    const g = await db.transaction((tx) => service.issue(source, tx));
    const reserve = (cents: number, overrunReason?: string) => ({
      ...cmd(),
      authorizationId: g.id,
      applicantId: 'employee',
      reimbursementId: randomUUID(),
      cents,
      overrunReason,
    });
    const outcomes = await Promise.allSettled([
      db.transaction((tx) => service.reserveClaim(reserve(6000), tx)),
      db.transaction((tx) => service.reserveClaim(reserve(6001), tx)),
    ]);
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      (await service.claims(g.id)).filter((c) => c.state === 'pending'),
    ).toHaveLength(1);
    const first = (await service.claims(g.id))[0];
    const boundary = reserve(12000 - first.cents);
    await db.transaction((tx) => service.reserveClaim(boundary, tx));
    await expect(
      db.transaction((tx) => service.reserveClaim(reserve(1), tx)),
    ).rejects.toMatchObject({ code: 'EXPENSE_AUTHORIZATION_OVERRUN_REASON' });
    await db.transaction((tx) =>
      service.reserveClaim(reserve(1, 'Additional approved event cost'), tx),
    );
    expect((await budget.balance(account))!.heldCents).toBe(12001);
    await expect(
      db.transaction((tx) =>
        service.reserveClaim(
          { ...reserve(1, 'Extra'), applicantId: 'other' },
          tx,
        ),
      ),
    ).rejects.toMatchObject({
      code: 'EXPENSE_AUTHORIZATION_APPLICANT_MISMATCH',
    });
    for (const c of await service.claims(g.id))
      await db.transaction((tx) =>
        service.cancelClaim(
          {
            ...cmd(),
            authorizationId: g.id,
            reimbursementId: c.reimbursementId,
          },
          tx,
        ),
      );
    await db.transaction((tx) =>
      service.close({ ...cmd(), authorizationId: g.id }, tx),
    );
  });
  test('cash completion consumes only one claim; duplicate references, request changes, cash/audit rollback and cancellation preserve balances', async ({
    app,
  }) => {
    const { db, budget, audit, service } = services(app),
      account = { departmentId: randomUUID(), year: 2026, subject: 'office' };
    await db.transaction((tx) =>
      budget.allocate(
        { ...account, ...cmd(), reference: 'annual', deltaCents: 50000 },
        tx,
      ),
    );
    const source = {
      ...account,
      ...cmd(),
      sourceKind: 'oa.travel' as const,
      budgetMode: 'reserved' as const,
      sourceId: randomUUID(),
      applicantId: 'employee',
      grantedCents: 10001,
    };
    const g = await db.transaction((tx) => service.issue(source, tx));
    const input = {
      ...cmd(),
      authorizationId: g.id,
      applicantId: 'employee',
      reimbursementId: randomUUID(),
      cents: 3001,
    };
    await db.transaction((tx) => service.reserveClaim(input, tx));
    await db.transaction((tx) => service.reserveClaim(input, tx));
    await expect(
      db.transaction((tx) =>
        service.reserveClaim(
          { ...input, requestKey: randomUUID(), cents: 4001 },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'EXPENSE_AUTHORIZATION_CLAIM_EXISTS' });
    const pay = {
      ...cmd(),
      authorizationId: g.id,
      reimbursementId: input.reimbursementId,
    };
    await expect(
      db.transaction(async (tx) => {
        await service.settleClaim(pay, tx);
        throw new Error('cash posting failed');
      }),
    ).rejects.toThrow('cash posting failed');
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 10001,
      usedCents: 0,
    });
    expect((await service.claims(g.id))[0].state).toBe('pending');
    const spy = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('audit unavailable'));
    try {
      await expect(
        db.transaction((tx) => service.settleClaim(pay, tx)),
      ).rejects.toThrow('audit unavailable');
    } finally {
      spy.mockRestore();
    }
    expect((await service.claims(g.id))[0].state).toBe('pending');
    await db.transaction((tx) => service.settleClaim(pay, tx));
    await db.transaction((tx) => service.settleClaim(pay, tx));
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 7000,
      usedCents: 3001,
    });
    await expect(
      db.transaction((tx) =>
        service.settleClaim({ ...pay, requestKey: randomUUID() }, tx),
      ),
    ).rejects.toMatchObject({ code: 'EXPENSE_AUTHORIZATION_CLAIM_STATE' });
    await expect(
      db.transaction((tx) =>
        budget.consumeHeld(
          {
            ...account,
            ...cmd(),
            reference: g.sourceReference,
            consumptionReference: `${g.sourceReference}:${input.reimbursementId}`,
            cents: 4000,
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_ALREADY_CONSUMED' });
    const otherAccount = { ...account, departmentId: randomUUID() };
    await db.transaction((tx) =>
      budget.allocate(
        { ...otherAccount, ...cmd(), reference: 'annual', deltaCents: 10000 },
        tx,
      ),
    );
    await db.transaction((tx) =>
      budget.adjustHold(
        {
          ...otherAccount,
          ...cmd(),
          reference: g.sourceReference,
          cents: 10000,
        },
        tx,
      ),
    );
    await expect(
      db.transaction((tx) =>
        budget.consumeHeld(
          {
            ...otherAccount,
            ...cmd(),
            reference: g.sourceReference,
            consumptionReference: `${g.sourceReference}:${input.reimbursementId}`,
            cents: 1,
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_ALREADY_CONSUMED' });
    expect((await budget.balance(otherAccount))!).toMatchObject({
      heldCents: 10000,
      usedCents: 0,
    });
    // Reissuing the original idempotent approval must not restore its already consumed reservation.
    expect((await db.transaction((tx) => service.issue(source, tx))).id).toBe(
      g.id,
    );
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 7000,
      usedCents: 3001,
    });
    const next = {
      ...input,
      requestKey: randomUUID(),
      reimbursementId: randomUUID(),
      cents: 2000,
    };
    await db.transaction((tx) => service.reserveClaim(next, tx));
    const cancel = {
      ...cmd(),
      authorizationId: g.id,
      reimbursementId: next.reimbursementId,
    };
    await db.transaction((tx) => service.cancelClaim(cancel, tx));
    await db.transaction((tx) => service.cancelClaim(cancel, tx));
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 7000,
      usedCents: 3001,
    });
    await db.transaction((tx) =>
      service.close({ ...cmd(), authorizationId: g.id }, tx),
    );
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 0,
      usedCents: 3001,
    });
    expect(await service.get(g.id)).toMatchObject({
      sourceId: source.sourceId,
      grantedCents: 10001,
      applicantId: 'employee',
      state: 'closed',
    });
  });
  test('the company local day90 protects pending cash claims then releases only unused funds after final settlement', async ({
    app,
  }) => {
    const { db, budget, service } = services(app),
      account = { departmentId: randomUUID(), year: 2026, subject: 'office' };
    await db.transaction((tx) =>
      budget.allocate(
        { ...account, ...cmd(), reference: 'annual', deltaCents: 50000 },
        tx,
      ),
    );
    const g = await db.transaction((tx) =>
      service.issue(
        {
          ...account,
          ...cmd(),
          sourceKind: 'oa.training',
          budgetMode: 'reserved',
          sourceId: randomUUID(),
          applicantId: 'employee',
          grantedCents: 10000,
        },
        tx,
      ),
    );
    expect(g.deadline).toBe('2026-04-01');
    const c = {
      ...cmd(),
      authorizationId: g.id,
      applicantId: 'employee',
      reimbursementId: randomUUID(),
      cents: 2000,
    };
    await db.transaction((tx) => service.reserveClaim(c, tx));
    const deadline = new Date('2026-03-31T16:00:00Z');
    expect(await service.expireDue(new Date(deadline.getTime() - 1))).toEqual({
      expired: 0,
      pending: 0,
    });
    expect(await service.expireDue(deadline)).toEqual({
      expired: 0,
      pending: 1,
    });
    await expect(
      db.transaction((tx) =>
        service.reserveClaim(
          {
            ...c,
            requestKey: randomUUID(),
            reimbursementId: randomUUID(),
            now: deadline,
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'EXPENSE_AUTHORIZATION_EXPIRED' });
    await db.transaction((tx) =>
      service.settleClaim(
        {
          ...cmd(),
          authorizationId: g.id,
          reimbursementId: c.reimbursementId,
          now: deadline,
        },
        tx,
      ),
    );
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 0,
      usedCents: 2000,
    });
    expect(await service.get(g.id)).toMatchObject({
      state: 'expired',
      grantedCents: 10000,
      deadline: '2026-04-01',
    });
    expect(await service.expireDue(deadline)).toEqual({
      expired: 0,
      pending: 0,
    });
  });
  test('preassigned ids stay immutable; pending revisions recalculate held funds and expired cancellation releases remaining funds', async ({
    app,
  }) => {
    const { db, budget, service } = services(app),
      account = { departmentId: randomUUID(), year: 2026, subject: 'office' };
    await db.transaction((tx) =>
      budget.allocate(
        { ...account, ...cmd(), reference: 'annual', deltaCents: 50000 },
        tx,
      ),
    );
    const source = {
      ...account,
      ...cmd(),
      id: randomUUID(),
      sourceKind: 'oa.expensePlan' as const,
      sourceId: randomUUID(),
      applicantId: 'employee',
      grantedCents: 10000,
    };
    const g = await db.transaction((tx) => service.issue(source, tx));
    expect(g.id).toBe(source.id);
    await expect(
      db.transaction((tx) =>
        service.issue({ ...source, id: randomUUID() }, tx),
      ),
    ).rejects.toMatchObject({ code: 'EXPENSE_AUTHORIZATION_SOURCE_CONFLICT' });
    const c = {
      ...cmd(),
      authorizationId: g.id,
      applicantId: 'employee',
      reimbursementId: randomUUID(),
      cents: 3000,
    };
    await db.transaction((tx) => service.reserveClaim(c, tx));
    await expect(
      db.transaction((tx) =>
        service.close({ ...cmd(), authorizationId: g.id }, tx),
      ),
    ).rejects.toMatchObject({ code: 'EXPENSE_AUTHORIZATION_PENDING_CLAIMS' });
    const adjust = {
      ...c,
      requestKey: randomUUID(),
      cents: 12001,
      overrunReason: 'Revised event scope',
    };
    await db.transaction((tx) => service.adjustClaim(adjust, tx));
    await db.transaction((tx) => service.adjustClaim(adjust, tx));
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 12001,
    });
    await expect(
      db.transaction((tx) =>
        service.adjustClaim(
          {
            ...adjust,
            requestKey: randomUUID(),
            cents: 12002,
            overrunReason: '',
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'EXPENSE_AUTHORIZATION_OVERRUN_REASON' });
    const afterDeadline = new Date('2026-04-01T02:00:00Z');
    await db.transaction((tx) =>
      service.adjustClaim(
        {
          ...adjust,
          requestKey: randomUUID(),
          cents: 2000,
          overrunReason: '',
          now: afterDeadline,
        },
        tx,
      ),
    );
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 10000,
    });
    await db.transaction((tx) =>
      service.cancelClaim(
        {
          ...cmd(),
          authorizationId: g.id,
          reimbursementId: c.reimbursementId,
          now: afterDeadline,
        },
        tx,
      ),
    );
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 0,
      usedCents: 0,
    });
    await expect(
      db.transaction((tx) =>
        service.adjustClaim({ ...adjust, requestKey: randomUUID() }, tx),
      ),
    ).rejects.toMatchObject({ code: 'EXPENSE_AUTHORIZATION_CLAIM_STATE' });
    const empty = await db.transaction((tx) =>
      service.issue(
        {
          ...source,
          id: randomUUID(),
          sourceId: randomUUID(),
          requestKey: randomUUID(),
        },
        tx,
      ),
    );
    expect((await budget.balance(account))!.heldCents).toBe(10000);
    expect(await service.expireDue(afterDeadline)).toEqual({
      expired: 1,
      pending: 0,
    });
    expect(await service.get(empty.id)).toMatchObject({
      state: 'expired',
      grantedCents: 10000,
      applicantId: 'employee',
      sourceKind: 'oa.expensePlan',
    });
  });
  test('concurrent explained claims cannot reserve more than the real budget availability', async ({
    app,
  }) => {
    const { db, budget, service } = services(app),
      account = { departmentId: randomUUID(), year: 2026, subject: 'office' };
    await db.transaction((tx) =>
      budget.allocate(
        { ...account, ...cmd(), reference: 'annual', deltaCents: 10000 },
        tx,
      ),
    );
    const g = await db.transaction((tx) =>
      service.issue(
        {
          ...account,
          ...cmd(),
          sourceKind: 'oa.training',
          budgetMode: 'reserved',
          sourceId: randomUUID(),
          applicantId: 'employee',
          grantedCents: 10000,
        },
        tx,
      ),
    );
    const reserve = () => ({
      ...cmd(),
      authorizationId: g.id,
      applicantId: 'employee',
      reimbursementId: randomUUID(),
      cents: 7000,
      overrunReason: 'Actual scope increased',
    });
    const results = await Promise.allSettled([
      db.transaction((tx) => service.reserveClaim(reserve(), tx)),
      db.transaction((tx) => service.reserveClaim(reserve(), tx)),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await service.claims(g.id)).toHaveLength(1);
    expect((await budget.balance(account))!).toMatchObject({
      heldCents: 10000,
      availableCents: 0,
    });
  });
  test('nonbudget travel/training retain quota boundaries, transaction rollback and day90 pending protection without budget writes', async ({
    app,
  }) => {
    const { db, service, audit, budget } = services(app);
    const calls = [
      vi.spyOn(budget, 'adjustHold'),
      vi.spyOn(budget, 'release'),
      vi.spyOn(budget, 'consumeHeld'),
    ];
    for (const sourceKind of ['oa.travel', 'oa.training'] as const) {
      const source = {
        ...cmd(),
        id: randomUUID(),
        sourceKind,
        sourceId: randomUUID(),
        applicantId: 'employee',
        grantedCents: 10000,
      };
      const g = await db.transaction((tx) => service.issue(source, tx));
      expect(g).toMatchObject({
        id: source.id,
        budgetMode: 'none',
        departmentId: null,
        year: null,
        subject: null,
      });
      expect((await db.transaction((tx) => service.issue(source, tx))).id).toBe(
        g.id,
      );
      await expect(
        db.transaction((tx) =>
          service.issue({ ...source, id: randomUUID() }, tx),
        ),
      ).rejects.toMatchObject({
        code: 'EXPENSE_AUTHORIZATION_SOURCE_CONFLICT',
      });
      const input = {
        ...cmd(),
        authorizationId: g.id,
        applicantId: 'employee',
        reimbursementId: randomUUID(),
        cents: 12000,
      };
      await db.transaction((tx) => service.reserveClaim(input, tx));
      await expect(
        db.transaction((tx) =>
          service.adjustClaim(
            { ...input, requestKey: randomUUID(), cents: 12001 },
            tx,
          ),
        ),
      ).rejects.toMatchObject({ code: 'EXPENSE_AUTHORIZATION_OVERRUN_REASON' });
      await db.transaction((tx) =>
        service.adjustClaim(
          {
            ...input,
            requestKey: randomUUID(),
            cents: 12001,
            overrunReason: 'Unexpected costs',
          },
          tx,
        ),
      );
      const later = new Date('2026-04-01T04:00:00Z');
      await service.expireDue(later);
      expect((await service.get(g.id))!.state).toBe('open');
      const payment = {
        ...cmd(),
        now: later,
        authorizationId: g.id,
        reimbursementId: input.reimbursementId,
      };
      await expect(
        db.transaction(async (tx) => {
          await service.settleClaim(payment, tx);
          throw new Error('cash rollback');
        }),
      ).rejects.toThrow('cash rollback');
      expect((await service.claims(g.id))[0].state).toBe('pending');
      await db.transaction((tx) => service.settleClaim(payment, tx));
      expect((await service.get(g.id))!).toMatchObject({
        state: 'expired',
        sourceKind,
        grantedCents: 10000,
        budgetMode: 'none',
      });
      expect((await service.claims(g.id))[0].state).toBe('paid');
      expect(
        (await db.transaction((tx) => service.settleClaim(payment, tx))).state,
      ).toBe('paid');
    }
    expect(calls.every((call) => call.mock.calls.length === 0)).toBe(true);
    calls.forEach((call) => call.mockRestore());
    const reject = {
      ...cmd(),
      budgetMode: 'none' as const,
      sourceKind: 'oa.expensePlan' as const,
      sourceId: randomUUID(),
      applicantId: 'employee',
      grantedCents: 100,
    };
    await expect(
      db.transaction((tx) => service.issue(reject, tx)),
    ).rejects.toMatchObject({
      code: 'EXPENSE_AUTHORIZATION_INVALID_BUDGET_MODE',
    });
    expect(audit).toBeDefined();
  });
});
