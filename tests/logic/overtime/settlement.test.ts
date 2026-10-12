// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { leaveBalanceServiceToken } from '../../../server/providers/leave-balances/contract.ts';
import { calendarServiceToken } from '../../../server/providers/platform/index.ts';
import {
  expiryDate,
  expiryInstant,
  settleCompensatoryMinutes,
  expireCompensatoryMinutes,
} from '../../../server/providers/overtime/settlement.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();
describe('overtime compensatory settlement', () => {
  test('preserves minute remainders, consumes oldest sources and never extends their expiry', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const balances = app.container.resolve(leaveBalanceServiceToken);
    const calendar = app.container.resolve(calendarServiceToken);
    const employeeId = randomUUID();
    const first = {
      employeeId,
      recordId: randomUUID(),
      date: '2026-01-31',
      minutes: 150,
      now: new Date('2026-02-01T00:00:00Z'),
    };
    const second = {
      employeeId,
      recordId: randomUUID(),
      date: '2026-02-28',
      minutes: 180,
      now: new Date('2026-03-01T00:00:00Z'),
    };
    await db.transaction((tx) =>
      settleCompensatoryMinutes(first, tx, balances, calendar),
    );
    expect(
      (await balances.balance({ employeeId, leaveType: 'compensatory' }))
        .availableUnits,
    ).toBe(0);
    await db.transaction((tx) =>
      settleCompensatoryMinutes(second, tx, balances, calendar),
    );
    await db.transaction((tx) =>
      settleCompensatoryMinutes(second, tx, balances, calendar),
    );
    const lots = await db
      .repository('overtimeMinuteLots')
      .findMany({ filter: { employeeId } });
    expect(lots).toHaveLength(2);
    expect(
      lots.reduce((sum, lot) => sum + Number(lot.remainingMinutes), 0),
    ).toBe(90);
    const ledger = await db
      .repository('leaveLedger')
      .findMany({ filter: { employeeId, kind: 'grant' } });
    expect(ledger).toHaveLength(1);
    expect(new Date(String(ledger[0].expiresAt)).toISOString()).toBe(
      '2026-04-30T16:00:00.000Z',
    );
    const conversion = await db
      .repository('overtimeMinuteConversions')
      .findOne({ filter: { applicationId: second.recordId } });
    expect(conversion!.sources).toHaveLength(2);
  });
  test('expired minute lots cannot contribute at the half-open endpoint, and failed grant rolls all consumption back', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const balances = app.container.resolve(leaveBalanceServiceToken);
    const calendar = app.container.resolve(calendarServiceToken);
    const employeeId = randomUUID();
    await db.transaction((tx) =>
      settleCompensatoryMinutes(
        {
          employeeId,
          recordId: randomUUID(),
          date: '2026-01-31',
          minutes: 200,
          now: new Date('2026-02-01Z'),
        },
        tx,
        balances,
        calendar,
      ),
    );
    await db.transaction((tx) =>
      settleCompensatoryMinutes(
        {
          employeeId,
          recordId: randomUUID(),
          date: '2026-05-01',
          minutes: 100,
          now: new Date('2026-04-30T16:00:00Z'),
        },
        tx,
        balances,
        calendar,
      ),
    );
    expect(
      await db.repository('leaveLedger').findMany({ filter: { employeeId } }),
    ).toHaveLength(0);
    const spy = vi
      .spyOn(balances, 'grant')
      .mockRejectedValueOnce(new Error('balance unavailable'));
    const failing = randomUUID();
    try {
      await expect(
        db.transaction((tx) =>
          settleCompensatoryMinutes(
            {
              employeeId,
              recordId: failing,
              date: '2026-05-02',
              minutes: 140,
              now: new Date('2026-05-02Z'),
            },
            tx,
            balances,
            calendar,
          ),
        ),
      ).rejects.toThrow('balance unavailable');
    } finally {
      spy.mockRestore();
    }
    expect(
      await db
        .repository('overtimeMinuteLots')
        .findOne({ filter: { applicationId: failing } }),
    ).toBeUndefined();
    const lots = await db
      .repository('overtimeMinuteLots')
      .findMany({ filter: { employeeId } });
    expect(
      lots.reduce((sum, lot) => sum + Number(lot.remainingMinutes), 0),
    ).toBe(300);
    await db.transaction((tx) =>
      expireCompensatoryMinutes(
        employeeId,
        new Date('2026-04-30T16:00:00Z'),
        tx,
      ),
    );
    const expired = await db
      .repository('overtimeMinuteLots')
      .findMany({ filter: { employeeId } });
    expect(
      expired.reduce((sum, row) => sum + Number(row.remainingMinutes), 0),
    ).toBe(100);
    expect(
      expired.reduce((sum, row) => sum + Number(row.expiredMinutes), 0),
    ).toBe(200);
  });
});

test('three calendar months clamp month ends and expiry uses the configured time zone through DST', async () => {
  expect(expiryDate('2026-01-31')).toBe('2026-04-30');
  expect(expiryDate('2025-11-30')).toBe('2026-02-28');
  expect(
    expiryInstant('2026-03-08', {
      timeZone: () => 'America/New_York',
    }).toISOString(),
  ).toBe('2026-03-09T04:00:00.000Z');
});
