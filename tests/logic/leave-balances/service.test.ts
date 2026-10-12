// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { describe, expect } from 'vitest';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { leaveBalanceServiceToken } from '../../../server/providers/leave-balances/index.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();
const now = new Date();
const later = new Date(now.getTime() + 86400_000);
function account() {
  return { employeeId: randomUUID(), leaveType: 'annual' };
}
function command(
  a: ReturnType<typeof account>,
  reference: string,
  key = randomUUID(),
) {
  return { ...a, reference, requestKey: key, at: now };
}
describe('immutable leave balance ledger on SQLite', () => {
  test('ledger sorts the complete account before paging and retains stable ties', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const service = app.container.resolve(leaveBalanceServiceToken);
    const a = account();
    for (const [index, units] of [2, 6, 4].entries())
      await db.transaction((tx) =>
        service.grant(
          {
            ...command(a, `sort-${index}`),
            units,
            at: new Date(now.getTime() + index * 1000),
          },
          tx,
        ),
      );
    const numeric = await service.ledger(a, 1, 1, {
      field: 'availableDelta',
      direction: 'desc',
    });
    expect(numeric.total).toBe(3);
    expect(numeric.items[0].availableDelta).toBe(6);
    expect(
      (
        await service.ledger(a, 2, 1, {
          field: 'availableDelta',
          direction: 'asc',
        })
      ).items[0].availableDelta,
    ).toBe(4);
    expect(
      (
        await service.ledger(a, 1, 1, {
          field: 'at',
          direction: 'asc',
        })
      ).items[0].reference,
    ).toBe('sort-0');
    const ties = await service.ledger(a, 1, 10, {
      field: 'heldDelta',
      direction: 'asc',
    });
    expect(ties.items.map((item) => item.id)).toEqual(
      ties.items
        .map((item) => item.id)
        .sort()
        .reverse(),
    );
  });
  test('half-day holds, revision adjustment, deduction and refunds are precise and idempotent', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const s = app.container.resolve(leaveBalanceServiceToken);
    const a = account();
    const grant = { ...command(a, 'annual-grant'), units: 9 };
    await db.transaction(async (tx) => {
      await s.grant(grant, tx);
      await s.grant(grant, tx);
    });
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 9,
      heldUnits: 0,
    });
    const hold = { ...command(a, 'leave-a'), units: 3 };
    await db.transaction((tx) => s.hold(hold, tx));
    await db.transaction((tx) =>
      s.adjustHold({ ...command(a, 'leave-a'), units: 1 }, tx),
    );
    await db.transaction((tx) =>
      s.adjustHold({ ...command(a, 'leave-a'), units: 4 }, tx),
    );
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 5,
      heldUnits: 4,
    });
    const deduct = command(a, 'leave-a');
    await db.transaction(async (tx) => {
      await s.deduct(deduct, tx);
      await s.deduct(deduct, tx);
    });
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 5,
      heldUnits: 0,
    });
    const refund = { ...command(a, 'leave-a'), units: 3 };
    await db.transaction(async (tx) => {
      await s.refund(refund, tx);
      await s.refund(refund, tx);
    });
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 8,
      heldUnits: 0,
    });
    await expect(
      db.transaction((tx) =>
        s.refund({ ...command(a, 'leave-a'), units: 2 }, tx),
      ),
    ).rejects.toMatchObject({ code: 'LEAVE_BALANCE_REFUND_EXCEEDS_DEDUCTED' });
    await expect(
      db.transaction((tx) => s.grant({ ...grant, units: 5 }, tx)),
    ).rejects.toMatchObject({ code: 'LEAVE_BALANCE_IDEMPOTENCY_CONFLICT' });
    await expect(
      db.transaction((tx) =>
        s.hold({ ...command(a, 'fractional'), units: 0.5 }, tx),
      ),
    ).rejects.toMatchObject({ code: 'LEAVE_BALANCE_INVALID_UNITS' });
    await expect(
      db.transaction((tx) =>
        s.adjustHold({ ...command(a, 'leave-a'), units: 2 }, tx),
      ),
    ).rejects.toMatchObject({ code: 'LEAVE_BALANCE_REFERENCE_CLOSED' });
  });
  test('expiry retains holds; release expires them and deduct/refund never resurrects expired leave', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const s = app.container.resolve(leaveBalanceServiceToken);
    const a = account();
    await db.transaction((tx) =>
      s.grant({ ...command(a, 'expiring'), units: 10, expiresAt: later }, tx),
    );
    await db.transaction((tx) =>
      s.hold({ ...command(a, 'release-after-expiry'), units: 3 }, tx),
    );
    await db.transaction((tx) =>
      s.hold({ ...command(a, 'deduct-after-expiry'), units: 4 }, tx),
    );
    expect(await s.expireDue(later)).toBeGreaterThan(0);
    const afterSweep = await s.ledger(a, 1, 100);
    await s.expireDue(later);
    expect(await s.ledger(a, 1, 100)).toEqual(afterSweep);
    expect(
      await db.transaction((tx) => s.expire({ ...a, at: later }, tx)),
    ).toMatchObject({ availableUnits: 0, heldUnits: 7 });
    expect(
      await db.transaction((tx) => s.expire({ ...a, at: later }, tx)),
    ).toMatchObject({ availableUnits: 0, heldUnits: 7 });
    expect(
      await db.transaction((tx) =>
        s.release({ ...command(a, 'release-after-expiry'), at: later }, tx),
      ),
    ).toMatchObject({ availableUnits: 0, heldUnits: 4 });
    expect(
      await db.transaction((tx) =>
        s.deduct({ ...command(a, 'deduct-after-expiry'), at: later }, tx),
      ),
    ).toMatchObject({ availableUnits: 0, heldUnits: 0 });
    expect(
      await db.transaction((tx) =>
        s.refund(
          { ...command(a, 'deduct-after-expiry'), units: 4, at: later },
          tx,
        ),
      ),
    ).toMatchObject({ availableUnits: 0, heldUnits: 0 });
    const ledger = await s.ledger(a, 1, 100);
    expect(ledger.items.reduce((sum, row) => sum + row.availableDelta, 0)).toBe(
      0,
    );
    expect(ledger.items.reduce((sum, row) => sum + row.heldDelta, 0)).toBe(0);
  });
  test('releaseReference cleans previous types; revisions reopen released references and rollback preserves ledger', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const s = app.container.resolve(leaveBalanceServiceToken);
    const a = account();
    const b = { ...a, leaveType: 'compensatory' };
    await db.transaction(async (tx) => {
      await s.grant({ ...command(a, 'annual'), units: 8 }, tx);
      await s.grant({ ...command(b, 'overtime'), units: 6 }, tx);
      await s.hold({ ...command(a, 'leave-a'), units: 4 }, tx);
    });
    await db.transaction(async (tx) => {
      await s.releaseReference(
        {
          employeeId: a.employeeId,
          reference: 'leave-a',
          requestKey: 'change-kind',
          exceptLeaveType: b.leaveType,
        },
        tx,
      );
      await s.adjustHold({ ...command(b, 'leave-a'), units: 2 }, tx);
    });
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 8,
      heldUnits: 0,
    });
    await db.transaction(async (tx) => {
      await s.releaseReference(
        {
          employeeId: a.employeeId,
          reference: 'leave-a',
          requestKey: 'return-to-annual',
          exceptLeaveType: a.leaveType,
        },
        tx,
      );
      await s.adjustHold({ ...command(a, 'leave-a'), units: 3 }, tx);
    });
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 5,
      heldUnits: 3,
    });
    // Replaying an earlier cross-type release must not release reservations created by a later revision.
    await db.transaction((tx) =>
      s.releaseReference(
        {
          employeeId: a.employeeId,
          reference: 'leave-a',
          requestKey: 'change-kind',
          exceptLeaveType: b.leaveType,
        },
        tx,
      ),
    );
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 5,
      heldUnits: 3,
    });
    const before = await s.ledger(a, 1, 100);
    await expect(
      db.transaction(async (tx) => {
        await s.release(command(a, 'leave-a'), tx);
        throw new Error('rollback-flow');
      }),
    ).rejects.toThrow('rollback-flow');
    expect(await s.ledger(a, 1, 100)).toEqual(before);
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 5,
      heldUnits: 3,
    });
  });
  test('competing holds cannot spend the same units and failed adjustments roll back their audit', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const s = app.container.resolve(leaveBalanceServiceToken);
    const a = account();
    await db.transaction((tx) =>
      s.grant({ ...command(a, 'annual'), units: 4 }, tx),
    );
    const results = await Promise.allSettled(
      ['one', 'two'].map((reference) =>
        db.transaction((tx) =>
          s.hold({ ...command(a, reference), units: 3 }, tx),
        ),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected')).toMatchObject({
      reason: { code: 'LEAVE_BALANCE_INSUFFICIENT' },
    });
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 1,
      heldUnits: 3,
    });
    const adjust = {
      ...command(a, 'hr-correction'),
      units: 2,
      actorId: 'hr',
      reason: 'Correct prior entitlement',
    };
    await db.transaction(async (tx) => {
      await s.adjust(adjust, tx);
      await s.adjust(adjust, tx);
    });
    expect(
      (
        await app.container.resolve(auditServiceToken).list({
          targetType: 'leaveLedger',
          targetId: a.employeeId,
          page: 1,
          pageSize: 20,
        })
      ).total,
    ).toBe(1);
    await expect(
      db.transaction(async (tx) => {
        await s.adjust(
          { ...adjust, requestKey: 'rollback-adjust', units: -1 },
          tx,
        );
        throw new Error('rollback-audit');
      }),
    ).rejects.toThrow('rollback-audit');
    expect(await s.balance(a)).toMatchObject({
      availableUnits: 3,
      heldUnits: 3,
    });
    expect(
      (
        await app.container.resolve(auditServiceToken).list({
          targetType: 'leaveLedger',
          targetId: a.employeeId,
          page: 1,
          pageSize: 20,
        })
      ).total,
    ).toBe(1);
    await expect(
      db.transaction((tx) =>
        s.adjust({ ...adjust, requestKey: 'overspend-adjust', units: -4 }, tx),
      ),
    ).rejects.toMatchObject({ code: 'LEAVE_BALANCE_INSUFFICIENT' });
  });
});
