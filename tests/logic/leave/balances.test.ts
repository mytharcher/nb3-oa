// @vitest-environment node
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.ts';
import { leaveBalanceServiceToken } from '../../../server/providers/leave-balances/contract.ts';
import {
  leaveServiceToken,
  type LeaveInput,
} from '../../../server/providers/leave/index.ts';
import {
  createEmployee,
  createEmployeesAppTest,
} from '../employees/helpers.ts';

const test = createEmployeesAppTest();
const form: LeaveInput = {
  leaveType: 'annual',
  startDate: '2026-11-02',
  endDate: '2026-11-02',
  startHalf: 'am',
  endHalf: 'pm',
  reason: 'Annual leave',
  attachments: [],
  handoverUserId: null,
  enableDelegation: false,
};
describe('leave lifecycle reservations', () => {
  test('holds on submit, retains and adjusts on return, and deducts once with attendance', async ({
    testApp,
  }) => {
    const c = testApp.application.container;
    const leave = c.resolve(leaveServiceToken);
    const balances = c.resolve(leaveBalanceServiceToken);
    const db = c.resolve(databaseManagerToken);
    const dictionaries = c.resolve(dictionaryServiceToken);
    const kind = await dictionaries.create(
      'leaveType',
      {
        code: 'balanceSnapshot',
        label: { 'en-US': 'Balance snapshot', 'zh-CN': '余额快照' },
        extra: {
          deductsBalance: true,
          requiresAttachment: false,
          attachmentAboveDays: null,
          maxDays: null,
          requiresHr: false,
        },
      },
      null,
    );
    const input = { ...form, leaveType: kind.code };
    const manager = await createEmployee(testApp, 'Balance Manager');
    const person = await createEmployee(testApp, 'Balance Applicant', {
      managerId: manager.employeeId,
    });
    const account = { employeeId: person.employeeId, leaveType: kind.code };
    await db.transaction((tx) =>
      balances.grant(
        { ...account, reference: 'grant', requestKey: randomUUID(), units: 6 },
        tx,
      ),
    );
    const draft = await leave.create(input, person.userId);
    const id = String(draft.record.id);
    const submit = async (key: string) => {
      const { record } = await leave.detail(id, person.userId);
      return leave.transition(
        id,
        'submit',
        person.userId,
        record.lifecycleVersion,
        key,
      );
    };
    const act = async (action: string, key: string) => {
      const detail = await leave.detail(id, manager.userId);
      const run = detail.runs.at(-1)!;
      return leave.action(
        id,
        {
          target: { taskId: run.tasks[0]!.id },
          action,
          requestId: key,
          contentHash: run.run.contentHash,
          comment: action === 'return' ? 'Revise dates' : undefined,
          input: action === 'return' ? { to: 'revision' } : undefined,
        },
        manager.userId,
      );
    };
    await submit('balance-submit');
    expect(await balances.balance(account)).toMatchObject({
      availableUnits: 4,
      heldUnits: 2,
    });
    await act('return', 'balance-return');
    expect(await balances.balance(account)).toMatchObject({
      availableUnits: 4,
      heldUnits: 2,
    });
    const returned = await leave.detail(id, person.userId);
    await leave.transition(
      id,
      'edit',
      person.userId,
      returned.record.lifecycleVersion,
      'balance-edit',
      { ...input, startHalf: 'pm' },
    );
    await submit('balance-resubmit');
    expect(await balances.balance(account)).toMatchObject({
      availableUnits: 5,
      heldUnits: 1,
    });
    await dictionaries.update(
      'leaveType',
      kind.id,
      { extra: { ...kind.extra, deductsBalance: false } },
      null,
    );
    await act('approve', 'balance-approve');
    await act('approve', 'balance-approve');
    expect(await balances.balance(account)).toMatchObject({
      availableUnits: 5,
      heldUnits: 0,
    });
    expect(
      await db
        .repository('leaveAttendance')
        .count({ filter: { applicationId: id } }),
    ).toBe(1);
  });
  test('releases reservations on reject, withdraw and terminate, including a change of leave type', async ({
    testApp,
  }) => {
    const c = testApp.application.container;
    const leave = c.resolve(leaveServiceToken);
    const balances = c.resolve(leaveBalanceServiceToken);
    const db = c.resolve(databaseManagerToken);
    const manager = await createEmployee(testApp, 'Release Manager');
    for (const exit of ['reject', 'withdraw', 'terminate', 'switch'] as const) {
      const person = await createEmployee(testApp, `Release ${exit}`, {
        managerId: manager.employeeId,
      });
      const account = { employeeId: person.employeeId, leaveType: 'annual' };
      await db.transaction((tx) =>
        balances.grant(
          {
            ...account,
            reference: 'grant',
            requestKey: randomUUID(),
            units: 4,
          },
          tx,
        ),
      );
      const draft = await leave.create(form, person.userId);
      const id = String(draft.record.id);
      await leave.transition(
        id,
        'submit',
        person.userId,
        Number(draft.record.lifecycleVersion),
        randomUUID(),
      );
      const detail = await leave.detail(id, manager.userId);
      const run = detail.runs.at(-1)!;
      if (exit === 'reject' || exit === 'switch') {
        await leave.action(
          id,
          {
            target: { taskId: run.tasks[0]!.id },
            action: exit === 'reject' ? 'reject' : 'return',
            input: exit === 'switch' ? { to: 'revision' } : undefined,
            comment: 'Change requested',
            contentHash: run.run.contentHash,
            requestId: randomUUID(),
          },
          manager.userId,
        );
      } else {
        const root =
          exit === 'terminate'
            ? await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS)
            : undefined;
        await leave.transition(
          id,
          exit,
          root?.user.id ?? person.userId,
          detail.record.lifecycleVersion,
          randomUUID(),
          exit === 'terminate' ? { reason: 'Cancel request' } : {},
          root
            ? { read: true, create: false, update: false, delete: false }
            : undefined,
        );
      }
      if (exit === 'switch') {
        const revision = await leave.detail(id, person.userId);
        await leave.transition(
          id,
          'edit',
          person.userId,
          revision.record.lifecycleVersion,
          randomUUID(),
          { ...form, leaveType: 'personal' },
        );
        const edited = await leave.detail(id, person.userId);
        await leave.transition(
          id,
          'submit',
          person.userId,
          edited.record.lifecycleVersion,
          randomUUID(),
        );
      }
      expect(await balances.balance(account)).toMatchObject({
        availableUnits: 4,
        heldUnits: 0,
      });
    }
  });
  test('rolls a final vote, deduction and attendance back when deduction fails', async ({
    testApp,
  }) => {
    const c = testApp.application.container;
    const leave = c.resolve(leaveServiceToken);
    const balances = c.resolve(leaveBalanceServiceToken);
    const db = c.resolve(databaseManagerToken);
    const manager = await createEmployee(testApp, 'Rollback Balance Manager');
    const person = await createEmployee(testApp, 'Rollback Balance Applicant', {
      managerId: manager.employeeId,
    });
    const account = { employeeId: person.employeeId, leaveType: 'annual' };
    await db.transaction((tx) =>
      balances.grant(
        { ...account, reference: 'grant', requestKey: randomUUID(), units: 4 },
        tx,
      ),
    );
    const draft = await leave.create(form, person.userId);
    const id = String(draft.record.id);
    await leave.transition(
      id,
      'submit',
      person.userId,
      Number(draft.record.lifecycleVersion),
      randomUUID(),
    );
    const detail = await leave.detail(id, manager.userId);
    const run = detail.runs.at(-1)!;
    const spy = vi
      .spyOn(balances, 'deduct')
      .mockRejectedValueOnce(new Error('ledger unavailable'));
    try {
      await expect(
        leave.action(
          id,
          {
            target: { taskId: run.tasks[0]!.id },
            action: 'approve',
            contentHash: run.run.contentHash,
            requestId: randomUUID(),
          },
          manager.userId,
        ),
      ).rejects.toThrow('ledger unavailable');
    } finally {
      spy.mockRestore();
    }
    expect((await leave.detail(id, person.userId)).record.status).toBe(
      'manager',
    );
    expect(await balances.balance(account)).toMatchObject({
      availableUnits: 2,
      heldUnits: 2,
    });
    expect(
      await db
        .repository('leaveAttendance')
        .count({ filter: { applicationId: id } }),
    ).toBe(0);
  });
});
