// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { describe, expect } from 'vitest';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { leaveBalanceServiceToken } from '../../../server/providers/leave-balances/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/calendar.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/dictionaries.js';
import { createAnnualLeaveService } from '../../../server/providers/annual-leave/service.js';
import { annualLeaveServiceToken } from '../../../server/providers/annual-leave/contract.js';
import { ruleServiceToken } from '../../../server/providers/platform/rules.js';
import type { AnnualLeavePolicy } from '../../../server/providers/annual-leave/calculation.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
const at = new Date('2026-10-11T05:00:00Z');
const policy: AnnualLeavePolicy = {
  enabled: true,
  seniorityBasis: 'careerStartDate',
  hireMonth: 'includeHireMonth',
  rounding: 'floorHalfDay',
  expiryMonth: 3,
  expiryDay: 31,
};
describe('annual leave accrual transaction on SQLite', () => {
  test('registered provider uses verified career date and respects the platform enable rule', async ({
    app,
  }) => {
    const c = app.container;
    const db = c.resolve(databaseManagerToken);
    const id = randomUUID();
    await db.repository('employees').createOne({
      values: {
        id,
        userId: randomUUID(),
        code: id,
        name: 'Provider accrual',
        hireDate: '2026-08-01',
        careerStartDate: '2010-01-01',
        active: true,
        status: 'regular',
        createdAt: at,
        updatedAt: at,
      },
    });
    const service = c.resolve(annualLeaveServiceToken);
    const instant = new Date();
    const year = Number(
      c.resolve(calendarServiceToken).localDate(instant).slice(0, 4),
    );
    expect(
      (await db.transaction((tx) => service.accrue(id, year, instant, tx)))
        .status,
    ).toBe('skipped');
    const rules = c.resolve(ruleServiceToken);
    await rules.set({
      key: 'leave.annualAccrualEnabled',
      value: 1,
      actorId: null,
    });
    try {
      const result = await db.transaction((tx) =>
        service.accrue(id, year, new Date(), tx),
      );
      expect(result).toMatchObject({
        status: 'granted',
        record: {
          snapshot: {
            seniorityStartDate: '2010-01-01',
            policy: {
              seniorityBasis: 'careerStartDate',
              hireMonth: 'includeHireMonth',
              rounding: 'floorHalfDay',
            },
          },
        },
      });
    } finally {
      await rules.set({
        key: 'leave.annualAccrualEnabled',
        value: 0,
        actorId: null,
      });
    }
  });
  test('reconciles a missed January 1 once and preserves its rule snapshot on repeat', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const id = randomUUID();
    await db.repository('employees').createOne({
      values: {
        id,
        userId: randomUUID(),
        code: id,
        name: 'Accrual',
        hireDate: '2020-02-01',
        active: true,
        status: 'regular',
        createdAt: at,
        updatedAt: at,
      },
    });
    const balances = app.container.resolve(leaveBalanceServiceToken);
    const service = createAnnualLeaveService({
      db,
      audit: app.container.resolve(auditServiceToken),
      balances,
      calendar: app.container.resolve(calendarServiceToken),
      dictionaries: app.container.resolve(dictionaryServiceToken),
      resolver: {
        policy: async () => policy,
        seniorityStartDate: async () => '2010-01-01',
      },
    });
    const first = await db.transaction((tx) =>
      service.accrue(id, 2026, at, tx),
    );
    expect(first).toMatchObject({ status: 'granted', record: { units: 20 } });
    policy.expiryMonth = 4;
    const second = await db.transaction((tx) =>
      service.accrue(id, 2026, new Date('2026-11-01T05:00:00Z'), tx),
    );
    expect(second).toMatchObject({
      status: 'existing',
      record: { units: 20, snapshot: { policy: { expiryMonth: 3 } } },
    });
    policy.expiryMonth = 3;
    expect(
      await balances.balance({ employeeId: id, leaveType: 'annual' }),
    ).toMatchObject({ availableUnits: 20 });
    expect(
      await db
        .repository('leaveLedger')
        .count({ filter: { employeeId: id, kind: 'grant' } }),
    ).toBe(1);
    expect(
      await db.repository('auditLogs').count({
        filter: { action: 'annualLeave.accrue', targetId: `${id}:2026` },
      }),
    ).toBe(1);
    const row = await db
      .repository('leaveLedger')
      .findOne({ filter: { employeeId: id, kind: 'grant' } });
    expect(new Date(row!.at as string).toISOString()).toBe(
      '2025-12-31T16:00:00.000Z',
    );
  });
  test('rolls back the annual claim and grant if transaction audit fails', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const id = randomUUID();
    await db.repository('employees').createOne({
      values: {
        id,
        userId: randomUUID(),
        code: id,
        name: 'Rollback',
        hireDate: '2026-08-31',
        active: true,
        status: 'regular',
        createdAt: at,
        updatedAt: at,
      },
    });
    const audit = app.container.resolve(auditServiceToken);
    const service = createAnnualLeaveService({
      db,
      audit: {
        ...audit,
        record: async () => {
          throw new Error('audit-failure');
        },
      },
      balances: app.container.resolve(leaveBalanceServiceToken),
      calendar: app.container.resolve(calendarServiceToken),
      dictionaries: app.container.resolve(dictionaryServiceToken),
      resolver: {
        policy: async () => policy,
        seniorityStartDate: async () => '2010-01-01',
      },
    });
    await expect(
      db.transaction((tx) => service.accrue(id, 2026, at, tx)),
    ).rejects.toThrow('audit-failure');
    expect(
      await db
        .repository('annualLeaveAccruals')
        .count({ filter: { employeeId: id } }),
    ).toBe(0);
    expect(
      await db.repository('leaveLedger').count({ filter: { employeeId: id } }),
    ).toBe(0);
  });
  test('does not claim any entitlement while the administrator rule is disabled', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const id = randomUUID();
    await db.repository('employees').createOne({
      values: {
        id,
        userId: randomUUID(),
        code: id,
        name: 'Disabled policy',
        active: true,
        status: 'regular',
        createdAt: at,
        updatedAt: at,
      },
    });
    const service = createAnnualLeaveService({
      db,
      audit: app.container.resolve(auditServiceToken),
      balances: app.container.resolve(leaveBalanceServiceToken),
      calendar: app.container.resolve(calendarServiceToken),
      dictionaries: app.container.resolve(dictionaryServiceToken),
      resolver: {
        policy: async () => ({ ...policy, enabled: false }),
        seniorityStartDate: async () => {
          throw new Error('must-not-read-seniority');
        },
      },
    });
    expect(
      await db.transaction((tx) => service.accrue(id, 2026, at, tx)),
    ).toEqual({ status: 'skipped' });
    expect(
      await db
        .repository('annualLeaveAccruals')
        .count({ filter: { employeeId: id } }),
    ).toBe(0);
  });
  test('records a zero entitlement once without creating fake balance credits', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const id = randomUUID();
    await db.repository('employees').createOne({
      values: {
        id,
        userId: randomUUID(),
        code: id,
        name: 'New to work',
        hireDate: '2026-08-01',
        active: true,
        status: 'probation',
        createdAt: at,
        updatedAt: at,
      },
    });
    const service = createAnnualLeaveService({
      db,
      audit: app.container.resolve(auditServiceToken),
      balances: app.container.resolve(leaveBalanceServiceToken),
      calendar: app.container.resolve(calendarServiceToken),
      dictionaries: app.container.resolve(dictionaryServiceToken),
      resolver: {
        policy: async () => policy,
        seniorityStartDate: async () => '2026-01-01',
      },
    });
    expect(
      await db.transaction((tx) => service.accrue(id, 2026, at, tx)),
    ).toMatchObject({ status: 'granted', record: { units: 0 } });
    expect(
      await db
        .repository('annualLeaveAccruals')
        .count({ filter: { employeeId: id } }),
    ).toBe(1);
    expect(
      await db.repository('leaveLedger').count({ filter: { employeeId: id } }),
    ).toBe(0);
  });
  test('blocks unknown seniority, skips inactive employees and rejects historical backfill', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken);
    const id = randomUUID();
    await db.repository('employees').createOne({
      values: {
        id,
        userId: randomUUID(),
        code: id,
        name: 'Missing seniority',
        hireDate: '2020-02-01',
        active: true,
        status: 'regular',
        createdAt: at,
        updatedAt: at,
      },
    });
    const service = createAnnualLeaveService({
      db,
      audit: app.container.resolve(auditServiceToken),
      balances: app.container.resolve(leaveBalanceServiceToken),
      calendar: app.container.resolve(calendarServiceToken),
      dictionaries: app.container.resolve(dictionaryServiceToken),
      resolver: {
        policy: async () => policy,
        seniorityStartDate: async () => null,
      },
    });
    await expect(
      db.transaction((tx) => service.accrue(id, 2026, at, tx)),
    ).rejects.toMatchObject({ code: 'ANNUAL_LEAVE_SENIORITY_MISSING' });
    const sweep = await service.reconcile(at);
    expect(sweep.blocked).toContainEqual({
      employeeId: id,
      year: 2026,
      code: 'ANNUAL_LEAVE_SENIORITY_MISSING',
    });
    await db
      .repository('employees')
      .updateOne({ filter: { id }, values: { active: false } });
    expect(
      await db.transaction((tx) => service.accrue(id, 2026, at, tx)),
    ).toEqual({ status: 'skipped' });
    await expect(
      db.transaction((tx) => service.accrue(id, 2025, at, tx)),
    ).rejects.toMatchObject({ code: 'ANNUAL_LEAVE_YEAR_INVALID' });
    expect(
      await db
        .repository('annualLeaveAccruals')
        .count({ filter: { employeeId: id } }),
    ).toBe(0);
  });
});
