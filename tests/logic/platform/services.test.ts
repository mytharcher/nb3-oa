// @vitest-environment node
import { databaseManagerToken } from '@nocobase/db';
import { describe, expect } from 'vitest';

import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../../../server/providers/platform/index.ts';
import { createPlatformAppTest } from './helpers.ts';

const test = createPlatformAppTest();

const sh = (local: string): Date => new Date(`${local}+08:00`);

describe('seeds', () => {
  test('seed every rule default at the epoch and the dictionary types', async ({
    app,
  }) => {
    const rules = app.container.resolve(ruleServiceToken);
    const snapshot = await rules.snapshot(
      [
        'spend.vp',
        'spend.gm',
        'leave.head',
        'sla.remindHours',
        'calendar.workHours',
        'calendar.timeZone',
      ],
      new Date(0),
    );
    expect(snapshot).toEqual({
      'spend.vp': 50000,
      'spend.gm': 200000,
      'leave.head': 3,
      'sla.remindHours': 24,
      'calendar.workHours': { start: '09:00', end: '18:00' },
      'calendar.timeZone': 'Asia/Shanghai',
    });
    const versions = await rules.versions();
    for (const definition of rules.definitions())
      expect(versions.some((version) => version.key === definition.key)).toBe(
        true,
      );

    const dictionaries = app.container.resolve(dictionaryServiceToken);
    for (const type of dictionaries.types())
      expect((await dictionaries.list(type.type)).length).toBeGreaterThan(0);
    const sick = await dictionaries.get('leaveType', 'sick');
    expect(sick?.extra).toMatchObject({
      requiresAttachment: true,
      attachmentAboveDays: 1,
    });
  });
});

describe('approval rules', () => {
  test('a future version is not in effect yet; a past snapshot keeps the old value', async ({
    app,
  }) => {
    const rules = app.container.resolve(ruleServiceToken);
    const before = new Date();
    const future = new Date(Date.now() + 86_400_000);
    await rules.set({
      key: 'expense.head',
      value: 20000,
      effectiveFrom: future,
      note: 'next year',
      actorId: null,
    });
    expect(await rules.get('expense.head')).toBe(10000);
    expect(
      await rules.get('expense.head', new Date(future.getTime() + 1)),
    ).toBe(20000);

    await rules.set({ key: 'loan.head', value: 15000, actorId: null });
    expect(await rules.get('loan.head')).toBe(15000);
    expect(await rules.snapshot(['loan.head', 'expense.head'], before)).toEqual(
      {
        'loan.head': 10000,
        'expense.head': 10000,
      },
    );

    const audit = app.container.resolve(auditServiceToken);
    const { items } = await audit.list({
      targetType: 'approvalRules',
      targetId: 'loan.head',
      page: 1,
      pageSize: 10,
    });
    expect(items[0]).toMatchObject({
      action: 'rule.set',
      before: { value: 10000 },
      after: { value: 15000 },
    });
  });

  test('validates values, past dates, orderings and immediate-only keys', async ({
    app,
  }) => {
    const rules = app.container.resolve(ruleServiceToken);
    await expect(
      rules.set({ key: 'leave.head', value: 2.3, actorId: null }),
    ).rejects.toMatchObject({
      code: 'RULE_INVALID_VALUE',
    });
    await expect(
      rules.set({ key: 'nope', value: 1, actorId: null }),
    ).rejects.toMatchObject({ code: 'RULE_UNKNOWN' });
    await expect(
      rules.set({
        key: 'spend.vp',
        value: 1,
        effectiveFrom: new Date(Date.now() - 3_600_000),
        actorId: null,
      }),
    ).rejects.toMatchObject({ code: 'RULE_EFFECTIVE_IN_PAST' });
    await expect(
      rules.set({ key: 'spend.vp', value: 300000, actorId: null }),
    ).rejects.toMatchObject({
      code: 'RULE_ORDER_VIOLATED',
    });
    // Lowering the upper bound below a scheduled lower value is caught at that later instant too.
    const later = new Date(Date.now() + 7 * 86_400_000);
    await rules.set({
      key: 'leave.head',
      value: 5,
      effectiveFrom: later,
      actorId: null,
    });
    await expect(
      rules.set({ key: 'leave.hr', value: 4, actorId: null }),
    ).rejects.toMatchObject({
      code: 'RULE_ORDER_VIOLATED',
    });
    await expect(
      rules.set({
        key: 'calendar.timeZone',
        value: 'UTC',
        effectiveFrom: later,
        actorId: null,
      }),
    ).rejects.toMatchObject({ code: 'RULE_FUTURE_NOT_ALLOWED' });
    await expect(
      rules.set({
        key: 'calendar.timeZone',
        value: 'Mars/Base',
        actorId: null,
      }),
    ).rejects.toMatchObject({
      code: 'RULE_INVALID_VALUE',
    });
  });

  test('withdraws a scheduled version but never one in effect', async ({
    app,
  }) => {
    const rules = app.container.resolve(ruleServiceToken);
    const scheduled = await rules.set({
      key: 'committee.min',
      value: 3,
      effectiveFrom: new Date(Date.now() + 86_400_000),
      actorId: null,
    });
    await rules.cancel('committee.min', scheduled.id, null);
    expect(
      (await rules.versions(['committee.min'])).map((version) => version.value),
    ).toEqual([2]);
    const [epoch] = await rules.versions(['committee.min']);
    await expect(
      rules.cancel('committee.min', epoch!.id, null),
    ).rejects.toMatchObject({
      code: 'RULE_VERSION_IN_EFFECT',
    });
  });
});

describe('work calendar', () => {
  test('reloads after an edit, an import and a working hours change', async ({
    app,
  }) => {
    const calendar = app.container.resolve(calendarServiceToken);
    expect(calendar.timeZone()).toBe('Asia/Shanghai');
    expect(calendar.isWorkday('2030-01-07')).toBe(true);

    await calendar.setDay(
      { date: '2030-01-07', kind: 'holiday', note: 'Test' },
      null,
    );
    expect(calendar.isWorkday('2030-01-07')).toBe(false);

    const result = await calendar.importYear(
      2030,
      [
        { date: '2030-01-07', kind: 'holiday', note: 'Test' },
        { date: '2030-01-05', kind: 'adjustedWorkday' },
      ],
      { replace: true },
      null,
    );
    expect(result).toEqual({
      created: 1,
      updated: 0,
      unchanged: 1,
      removed: 0,
    });
    expect(calendar.isWorkday('2030-01-05')).toBe(true);

    await calendar.importYear(
      2030,
      [{ date: '2030-01-05', kind: 'adjustedWorkday' }],
      { replace: true },
      null,
    );
    expect(calendar.isWorkday('2030-01-07')).toBe(true);

    await calendar.removeDay('2030-01-05', null);
    expect(calendar.isWorkday('2030-01-05')).toBe(false);
    await expect(calendar.removeDay('2030-01-05', null)).rejects.toMatchObject({
      code: 'CALENDAR_DAY_NOT_FOUND',
    });

    // Working hours are a rule; a new version applies at once.
    const rules = app.container.resolve(ruleServiceToken);
    await rules.set({
      key: 'calendar.workHours',
      value: { start: '08:00', end: '17:00' },
      actorId: null,
    });
    await calendar.reload();
    expect(calendar.addWorkingHours(sh('2030-01-08T16:00:00'), 2)).toEqual(
      sh('2030-01-09T09:00:00'),
    );
    expect(
      calendar.approvalCalendar().addWorkingHours(sh('2030-01-08T16:00:00'), 2),
    ).toEqual(sh('2030-01-09T09:00:00'));
  });

  test('rejects an import date outside the year', async ({ app }) => {
    const calendar = app.container.resolve(calendarServiceToken);
    await expect(
      calendar.importYear(
        2031,
        [{ date: '2032-01-01', kind: 'holiday' }],
        { replace: false },
        null,
      ),
    ).rejects.toMatchObject({ code: 'CALENDAR_DATE_OUTSIDE_YEAR' });
  });
});

describe('dictionaries', () => {
  test('creates, disables and validates entries; disabled ones leave the active list', async ({
    app,
  }) => {
    const dictionaries = app.container.resolve(dictionaryServiceToken);
    const entry = await dictionaries.create(
      'vehicleType',
      {
        code: 'bus',
        label: { 'zh-CN': '大巴', 'en-US': 'Bus' },
        sortOrder: 99,
      },
      null,
    );
    expect(
      (await dictionaries.list('vehicleType')).map((item) => item.code),
    ).toContain('bus');
    await dictionaries.update('vehicleType', entry.id, { active: false }, null);
    expect(
      (await dictionaries.list('vehicleType')).map((item) => item.code),
    ).not.toContain('bus');
    expect(
      (await dictionaries.list('vehicleType', { includeInactive: true })).map(
        (item) => item.code,
      ),
    ).toContain('bus');

    await expect(
      dictionaries.create(
        'vehicleType',
        { code: 'bus', label: { 'en-US': 'Bus' } },
        null,
      ),
    ).rejects.toMatchObject({ code: 'DICTIONARY_CODE_EXISTS' });
    await expect(
      dictionaries.create(
        'leaveType',
        { code: 'study', label: { 'en-US': 'Study' }, extra: { maxDays: 3 } },
        null,
      ),
    ).rejects.toMatchObject({ code: 'DICTIONARY_INVALID_EXTRA' });
    await expect(
      dictionaries.create('vehicleType', { code: 'x', label: {} }, null),
    ).rejects.toMatchObject({ code: 'DICTIONARY_INVALID_LABEL' });

    const audit = app.container.resolve(auditServiceToken);
    const { items } = await audit.list({
      targetId: 'vehicleType:bus',
      page: 1,
      pageSize: 10,
    });
    expect(items.map((item) => item.action)).toEqual([
      'dictionary.disable',
      'dictionary.create',
    ]);
  });
});

describe('sequences', () => {
  test('numbers per prefix and month in the calendar time zone', async ({
    app,
  }) => {
    const database = app.container.resolve(databaseManagerToken);
    const sequences = app.container.resolve(sequenceServiceToken);
    const at = new Date('2026-10-31T17:00:00Z'); // 1 November in Shanghai
    const first = await database.transaction((connection) =>
      sequences.next('TST', connection, at),
    );
    const second = await database.transaction((connection) =>
      sequences.next('TST', connection, at),
    );
    expect([first, second]).toEqual(['TST-202611-0001', 'TST-202611-0002']);
    await expect(
      database.transaction((connection) =>
        sequences.next('bad-prefix', connection),
      ),
    ).rejects.toMatchObject({ code: 'SEQUENCE_INVALID_PREFIX' });
  });

  test('parallel transactions get distinct numbers, including the first of a period', async ({
    app,
  }) => {
    const database = app.container.resolve(databaseManagerToken);
    const sequences = app.container.resolve(sequenceServiceToken);
    const at = new Date('2027-03-15T04:00:00Z');
    const numbers = await Promise.all(
      Array.from({ length: 12 }, () =>
        database.transaction((connection) =>
          sequences.next('PAR', connection, at),
        ),
      ),
    );
    expect(new Set(numbers).size).toBe(12);
    expect([...numbers].sort()).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `PAR-202703-${String(index + 1).padStart(4, '0')}`,
      ),
    );
  });

  test('a rolled-back transaction returns its number', async ({ app }) => {
    const database = app.container.resolve(databaseManagerToken);
    const sequences = app.container.resolve(sequenceServiceToken);
    const at = new Date('2027-04-15T04:00:00Z');
    await database.transaction((connection) =>
      sequences.next('RB', connection, at),
    );
    await expect(
      database.transaction(async (connection) => {
        expect(await sequences.next('RB', connection, at)).toBe(
          'RB-202704-0002',
        );
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(
      await database.transaction((connection) =>
        sequences.next('RB', connection, at),
      ),
    ).toBe('RB-202704-0002');
  });
});
