// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { describe, expect } from 'vitest';
import { budgetServiceToken } from '../../../server/providers/budgets/index.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { createBudgetService } from '../../../server/providers/budgets/service.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();
const account = () => ({
  departmentId: randomUUID(),
  year: 2026,
  subject: 'office',
});
const command = (a: ReturnType<typeof account>, reference: string) => ({
  ...a,
  reference,
  requestKey: randomUUID(),
  actorId: 'finance-test',
  reason: 'Budget test',
});
describe('budget ledger in lifecycle transactions', () => {
  test('reservation revisions, cancellation and acceptance retain exact cents and immutable history', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      s = app.container.resolve(budgetServiceToken),
      a = account();
    await db.transaction((tx) =>
      s.allocate({ ...command(a, 'annual'), deltaCents: 10001 }, tx),
    );
    const hold = { ...command(a, 'purchase'), cents: 2501 };
    await db.transaction((tx) => s.adjustHold(hold, tx));
    await db.transaction((tx) => s.adjustHold(hold, tx));
    expect(await s.balance(a)).toMatchObject({
      availableCents: 7500,
      heldCents: 2501,
    });
    await db.transaction((tx) =>
      s.adjustHold({ ...command(a, 'purchase'), cents: 3301 }, tx),
    );
    await db.transaction((tx) =>
      s.adjustHold({ ...command(a, 'cancelled'), cents: 1000 }, tx),
    );
    await db.transaction((tx) => s.release(command(a, 'cancelled'), tx));
    await db.transaction((tx) =>
      s.adjustHold({ ...command(a, 'cancelled'), cents: 500 }, tx),
    );
    await db.transaction((tx) => s.release(command(a, 'cancelled'), tx));
    const settle = command(a, 'purchase');
    await db.transaction((tx) => s.settle(settle, tx));
    await db.transaction((tx) => s.settle(settle, tx));
    expect(await s.balance(a)).toMatchObject({
      allocatedCents: 10001,
      heldCents: 0,
      usedCents: 3301,
      availableCents: 6700,
    });
    await expect(
      db.transaction((tx) =>
        s.adjustHold({ ...command(a, 'purchase'), cents: 1 }, tx),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_ALREADY_SETTLED' });
    await expect(
      db.transaction((tx) => s.release(command(a, 'purchase'), tx)),
    ).rejects.toMatchObject({ code: 'BUDGET_ALREADY_SETTLED' });
    const balance = await s.balance(a);
    expect(
      await db
        .repository('budgetLedger')
        .count({ filter: { budgetId: balance!.id } }),
    ).toBe(8);
    const ledger = await s.ledger(a, {
      page: 1,
      pageSize: 1,
      sort: 'allocatedDelta',
      direction: 'desc',
    });
    expect(ledger.total).toBe(8);
    expect(ledger.items).toHaveLength(1);
    expect(ledger.items[0].allocatedDelta).toBe(10001);
    expect(ledger.items[0].at).toBeInstanceOf(Date);
    await expect(s.ledger(a, { page: 0, pageSize: 1 })).rejects.toMatchObject({
      code: 'BUDGET_INVALID_PAGE',
    });
  });
  test('insufficient funds, changed idempotency and unsafe values reject without ledger or audit mutation', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      s = app.container.resolve(budgetServiceToken),
      a = account();
    const allocation = { ...command(a, 'annual'), deltaCents: 100 };
    await db.transaction((tx) => s.allocate(allocation, tx));
    await expect(
      db.transaction((tx) =>
        s.allocate({ ...allocation, deltaCents: 101 }, tx),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_IDEMPOTENCY_CONFLICT' });
    await expect(
      db.transaction((tx) =>
        s.adjustHold({ ...command(a, 'purchase'), cents: 101 }, tx),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_INSUFFICIENT' });
    await db.transaction((tx) =>
      s.adjustHold({ ...command(a, 'purchase'), cents: 80 }, tx),
    );
    await expect(
      db.transaction((tx) =>
        s.allocate({ ...command(a, 'decrease'), deltaCents: -21 }, tx),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_INSUFFICIENT' });
    for (const value of [-1, 0.1, NaN, Number.MAX_SAFE_INTEGER + 1])
      await expect(
        db.transaction((tx) =>
          s.adjustHold({ ...command(a, 'bad'), cents: value }, tx),
        ),
      ).rejects.toMatchObject({ code: 'BUDGET_INVALID_AMOUNT' });
    expect(await s.balance(a)).toMatchObject({
      allocatedCents: 100,
      heldCents: 80,
      availableCents: 20,
    });
    const id = (await s.balance(a))!.id;
    expect(
      await db.repository('budgetLedger').count({ filter: { budgetId: id } }),
    ).toBe(2);
    expect(
      await db
        .repository('auditLogs')
        .count({ filter: { targetType: 'budgets', targetId: id } }),
    ).toBe(2);
  });
  test('caller rollback and audit failure roll back account, reservation and operation key together', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      s = app.container.resolve(budgetServiceToken),
      a = account();
    await expect(
      db.transaction(async (tx) => {
        await s.allocate({ ...command(a, 'annual'), deltaCents: 100 }, tx);
        throw new Error('caller rollback');
      }),
    ).rejects.toThrow('caller rollback');
    expect(await s.balance(a)).toBeNull();
    await db.transaction((tx) =>
      s.allocate({ ...command(a, 'annual'), deltaCents: 100 }, tx),
    );
    const audit = app.container.resolve(auditServiceToken);
    const failing = createBudgetService(db, {
      ...audit,
      record: async () => {
        throw new Error('audit failed');
      },
    });
    const hold = { ...command(a, 'purchase'), cents: 50 };
    await expect(
      db.transaction((tx) => failing.adjustHold(hold, tx)),
    ).rejects.toThrow('audit failed');
    expect(await s.balance(a)).toMatchObject({
      heldCents: 0,
      availableCents: 100,
    });
    await db.transaction((tx) => s.adjustHold(hold, tx));
    expect(await s.balance(a)).toMatchObject({
      heldCents: 50,
      availableCents: 50,
    });
  });
  test('large budgets retain cents and competing holds cannot overspend', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const s = app.container.resolve(budgetServiceToken);
    const a = account();
    await db.transaction((tx) =>
      s.allocate({ ...command(a, 'annual'), deltaCents: 5_000_000_001 }, tx),
    );
    const results = await Promise.allSettled([
      db.transaction((tx) =>
        s.adjustHold({ ...command(a, 'purchase-a'), cents: 3_000_000_000 }, tx),
      ),
      db.transaction((tx) =>
        s.adjustHold({ ...command(a, 'purchase-b'), cents: 3_000_000_000 }, tx),
      ),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejection = results.find((r) => r.status === 'rejected');
    expect(
      rejection?.status === 'rejected' ? rejection.reason : null,
    ).toMatchObject({ code: 'BUDGET_INSUFFICIENT' });
    expect(await s.balance(a)).toMatchObject({
      allocatedCents: 5_000_000_001,
      heldCents: 3_000_000_000,
      availableCents: 2_000_000_001,
    });
  });
  test('subject adjustment transfers the held allocation without reporting expense', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      s = app.container.resolve(budgetServiceToken),
      a = account();
    await db.transaction((tx) =>
      s.allocate({ ...command(a, 'annual'), deltaCents: 1001 }, tx),
    );
    await db.transaction((tx) =>
      s.adjustHold({ ...command(a, 'adjustment'), cents: 301 }, tx),
    );
    const transfer = { ...command(a, 'adjustment'), targetSubject: 'travel' };
    const failing = createBudgetService(db, {
      ...app.container.resolve(auditServiceToken),
      record: async () => {
        throw new Error('transfer audit failed');
      },
    });
    await expect(
      db.transaction((tx) => failing.transferHeld(transfer, tx)),
    ).rejects.toThrow('transfer audit failed');
    expect(await s.balance(a)).toMatchObject({
      allocatedCents: 1001,
      heldCents: 301,
    });
    expect(await s.balance({ ...a, subject: 'travel' })).toBeNull();
    await db.transaction((tx) => s.transferHeld(transfer, tx));
    await db.transaction((tx) => s.transferHeld(transfer, tx));
    expect(await s.balance(a)).toMatchObject({
      allocatedCents: 700,
      heldCents: 0,
      usedCents: 0,
      availableCents: 700,
    });
    expect(await s.balance({ ...a, subject: 'travel' })).toMatchObject({
      allocatedCents: 301,
      heldCents: 0,
      usedCents: 0,
      availableCents: 301,
    });
    await expect(
      db.transaction((tx) => s.release(command(a, 'adjustment'), tx)),
    ).rejects.toMatchObject({ code: 'BUDGET_ALREADY_SETTLED' });
    await expect(
      db.transaction((tx) =>
        s.transferHeld({ ...transfer, targetSubject: 'other' }, tx),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_IDEMPOTENCY_CONFLICT' });
    expect(await s.balance({ ...a, subject: 'other' })).toBeNull();
  });
});
