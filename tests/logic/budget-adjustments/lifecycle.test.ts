import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import { ruleServiceToken } from '../../../server/providers/platform/index.ts';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  budgetAdjustmentServiceToken,
  type BudgetAdjustmentService,
  type BudgetAdjustmentInput,
} from '../../../server/providers/budget-adjustments/index.ts';
import { budgetServiceToken } from '../../../server/providers/budgets/contract.ts';
import { startOrgTestApp, type OrgTestApp, json } from '../org/helpers.ts';
let app: OrgTestApp;
let service: BudgetAdjustmentService;
const ids: Record<string, string> = {};
const sessions: Record<string, TestSession> = {};
const departmentId = 'adjustment-department';
const account = (subject: string) => ({ departmentId, year: 2026, subject });
const form = (
  extra: Partial<BudgetAdjustmentInput> = {},
): BudgetAdjustmentInput => ({
  departmentId,
  year: 2026,
  subject: 'travel',
  adjustmentType: 'transfer',
  sourceSubject: 'office',
  amountCents: 10001,
  reason: 'Budget reallocation',
  ...extra,
});
async function draft(input = form()) {
  return (await service.create(input, ids.applicant)).record;
}
async function submit(input = form()) {
  const r = await draft(input);
  return service.transition(
    String(r.id),
    'submit',
    ids.applicant,
    Number(r.lifecycleVersion),
    randomUUID(),
  );
}
async function act(
  id: string,
  actor: string,
  action = 'approve',
  hash?: string,
) {
  const detail = await service.detail(id, actor);
  const offer = detail.taskActions.find((v) =>
    v.actions.some((a) => a.name === action),
  );
  expect(offer).toBeDefined();
  const run = detail.runs.find((r) => r.run.id === offer!.task.runId)!;
  return service.action(
    id,
    {
      target: { taskId: offer!.task.id },
      action,
      contentHash: hash ?? run.run.contentHash,
      requestId: randomUUID(),
      ...(action === 'return'
        ? { input: { to: 'revision' }, comment: 'Change funding source' }
        : action === 'reject'
          ? { comment: 'Rejected' }
          : {}),
    },
    actor,
  );
}
describe('budget adjustments and transactional funds', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);
    service = c.resolve(budgetAdjustmentServiceToken);
    const now = new Date().toISOString();
    for (const name of [
      'applicant',
      'head',
      'finance',
      'finance2',
      'cfo',
      'gm',
      'outsider',
      'hr',
    ]) {
      sessions[name] = await app.createUser(`Adjustment-${name}`);
      ids[name] = sessions[name].user.id;
      await db.repository('employees').createOne({
        values: {
          id: `adjustment-${name}`,
          code: `ADJ-${name}`,
          name,
          userId: ids[name],
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await db.repository('departments').createOne({
      values: {
        id: departmentId,
        title: 'Selected budget department',
        managerId: ids.head,
        active: true,
      },
    });
    for (const [person, role] of [
      ['finance', 'financeManager'],
      ['finance2', 'financeManager'],
      ['cfo', 'cfo'],
      ['gm', 'gm'],
      ['hr', 'hr'],
    ])
      await db.repository('dutyRoleMembers').createOne({
        values: {
          id: `adjustment-role-${person}`,
          dutyRoleCode: role,
          userId: ids[person],
          active: true,
        },
      });
    for (const subject of ['office', 'equipment'])
      await db.transaction((tx) =>
        c.resolve(budgetServiceToken).allocate(
          {
            ...account(subject),
            deltaCents: 20000000,
            reference: `initial-${subject}`,
            requestKey: randomUUID(),
            actorId: ids.finance,
            reason: 'Initial budget',
          },
          tx,
        ),
      );
  }, 120000);
  afterAll(async () => app?.close());
  it('reserves then transfers exact cents across two subjects after head, any finance and CFO', async () => {
    const budgets =
      app.testApp.application.container.resolve(budgetServiceToken);
    const before = await budgets.balance(account('office'));
    const submitted = await submit();
    const id = String(submitted.record.id);
    expect(submitted.record.status).toBe('head');
    expect(await budgets.balance(account('office'))).toMatchObject({
      heldCents: 10001,
    });
    await act(id, ids.head);
    expect(
      (await service.detail(id, ids.finance2)).taskActions.some((v) =>
        v.actions.some((a) => a.name === 'approve'),
      ),
    ).toBe(true);
    await act(id, ids.finance2);
    expect((await service.detail(id, ids.applicant)).record.status).toBe('cfo');
    await act(id, ids.cfo);
    expect((await service.detail(id, ids.applicant)).record.status).toBe(
      'approved',
    );
    expect((await service.detail(id, ids.applicant)).record.heldCents).toBe(0);
    expect(await budgets.balance(account('office'))).toMatchObject({
      allocatedCents: before!.allocatedCents - 10001,
      heldCents: 0,
    });
    expect(await budgets.balance(account('travel'))).toMatchObject({
      allocatedCents: 10001,
      heldCents: 0,
    });
  });
  it('rolls back insufficient submission without transition or reservation', async () => {
    const r = await draft(form({ amountCents: 30000000 }));
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const count = await db.repository('oaLifecycleTransitions').count();
    await expect(
      service.transition(
        String(r.id),
        'submit',
        ids.applicant,
        Number(r.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_INSUFFICIENT' });
    expect(
      (await service.detail(String(r.id), ids.applicant)).record.status,
    ).toBe('draft');
    expect(await db.repository('oaLifecycleTransitions').count()).toBe(count);
  });
  it('requires GM only strictly above the snapshotted increase threshold', async () => {
    for (const [amount, expected] of [
      [5000000, 'approved'],
      [5000001, 'gm'],
    ] as const) {
      const submitted = await submit(
        form({
          adjustmentType: 'increase',
          sourceSubject: null,
          amountCents: amount,
        }),
      );
      const id = String(submitted.record.id);
      expect(submitted.record.ruleSnapshot?.['budget.increaseGm']).toBe(50000);
      await act(id, ids.head);
      await act(id, ids.finance);
      await act(id, ids.cfo);
      expect((await service.detail(id, ids.applicant)).record.status).toBe(
        expected,
      );
      if (expected === 'gm') await act(id, ids.gm);
    }
  });
  it('keeps a submitted threshold snapshot when the live rule changes', async () => {
    const result = await submit(
      form({
        adjustmentType: 'increase',
        sourceSubject: null,
        amountCents: 1000,
      }),
    );
    const id = String(result.record.id);
    const rules = app.testApp.application.container.resolve(ruleServiceToken);
    await rules.set({
      key: 'budget.increaseGm',
      value: 1,
      actorId: ids.finance,
      note: 'Snapshot test',
    });
    try {
      await act(id, ids.head);
      await act(id, ids.finance);
      await act(id, ids.cfo);
      expect((await service.detail(id, ids.applicant)).record.status).toBe(
        'approved',
      );
    } finally {
      await rules.set({
        key: 'budget.increaseGm',
        value: 50000,
        actorId: ids.finance,
        note: 'Restore threshold',
      });
    }
  });
  it('return retains the hold and resubmitting a changed source releases the old account', async () => {
    const budgets =
      app.testApp.application.container.resolve(budgetServiceToken);
    const submitted = await submit();
    const id = String(submitted.record.id);
    await act(id, ids.head, 'return');
    expect(await budgets.balance(account('office'))).toMatchObject({
      heldCents: 10001,
    });
    const revision = (await service.detail(id, ids.applicant)).record;
    const edited = await service.transition(
      id,
      'edit',
      ids.applicant,
      revision.lifecycleVersion,
      randomUUID(),
      form({ sourceSubject: 'equipment', amountCents: 20002 }),
    );
    expect(edited.record.heldCents).toBe(10001);
    expect(edited.record.amountCents).toBe(20002);
    const resubmitted = await service.transition(
      id,
      'submit',
      ids.applicant,
      Number(edited.record.lifecycleVersion),
      randomUUID(),
    );
    expect(resubmitted.record.heldCents).toBe(20002);
    expect(await budgets.balance(account('office'))).toMatchObject({
      heldCents: 0,
    });
    expect(await budgets.balance(account('equipment'))).toMatchObject({
      heldCents: 20002,
    });
    const head = (await service.detail(id, ids.applicant)).record;
    await service.transition(
      id,
      'withdraw',
      ids.applicant,
      head.lifecycleVersion,
      randomUUID(),
    );
    expect(await budgets.balance(account('equipment'))).toMatchObject({
      heldCents: 0,
    });
  });
  it('rejects expired reviewed hashes and enforces own task authorization', async () => {
    const submitted = await submit();
    const id = String(submitted.record.id);
    await expect(act(id, ids.head, 'approve', 'expired')).rejects.toBeDefined();
    const d = await service.detail(id, ids.head);
    const task = d.taskActions[0].task;
    await expect(
      service.action(
        id,
        {
          target: { taskId: task.id },
          action: 'approve',
          contentHash: d.runs[0].run.contentHash,
          requestId: randomUUID(),
        },
        ids.outsider,
      ),
    ).rejects.toBeDefined();
    await act(id, ids.head, 'reject');
    expect((await service.detail(id, ids.applicant)).record.status).toBe(
      'rejected',
    );
    expect((await service.detail(id, ids.applicant)).record.heldCents).toBe(0);
    expect(
      await app.testApp.application.container
        .resolve(budgetServiceToken)
        .balance(account('office')),
    ).toMatchObject({ heldCents: 0 });
  });
  it('requires an administrator reason and atomically releases terminated reservations', async () => {
    const result = await submit();
    const id = String(result.record.id);
    const admin = await app.admin();
    await expect(
      service.transition(
        id,
        'terminate',
        admin.user.id,
        Number(result.record.lifecycleVersion),
        randomUUID(),
        {},
        { read: true, create: false, update: false, delete: false },
      ),
    ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
    await service.transition(
      id,
      'terminate',
      admin.user.id,
      Number(result.record.lifecycleVersion),
      randomUUID(),
      { reason: 'Withdraw obsolete budget adjustment' },
      { read: true, create: false, update: false, delete: false },
    );
    expect((await service.detail(id, ids.applicant)).record.status).toBe(
      'terminated',
    );
    expect((await service.detail(id, ids.applicant)).record.heldCents).toBe(0);
    expect(
      await app.testApp.application.container
        .resolve(budgetServiceToken)
        .balance(account('office')),
    ).toMatchObject({ heldCents: 0 });
    expect(
      await app.testApp.database.repository('auditLogs').count({
        filter: { targetId: id, action: 'budgetAdjustment.terminate' },
      }),
    ).toBe(1);
  });
  it('keeps HR outside unrelated financial records and grants finance and the target department head visibility', async () => {
    const r = await draft();
    const id = String(r.id);
    expect(await service.readableIds(ids.hr)).not.toContain(id);
    expect(await service.readableIds(ids.finance2)).toContain(id);
    expect(await service.readableIds(ids.head)).toContain(id);
    expect((await sessions.hr.fetch(`/budgetAdjustments/${id}`)).status).toBe(
      403,
    );
    expect(
      (await sessions.finance2.fetch(`/budgetAdjustments/${id}`)).status,
    ).toBe(200);
    expect((await sessions.head.fetch(`/budgetAdjustments/${id}`)).status).toBe(
      200,
    );
  });
  it('HTTP validates cents and transfer accounts before creating and refuses anonymous access', async () => {
    const owner = await app.createUser('Adjustment-API');
    const session = owner;
    for (const input of [
      form({ amountCents: 0.1 }),
      form({ amountCents: Number.MAX_SAFE_INTEGER + 1 }),
      form({ sourceSubject: 'travel' }),
      form({ adjustmentType: 'increase', sourceSubject: 'office' }),
    ])
      expect(
        (await session.fetch('/budgetAdjustments', json(input))).status,
      ).toBe(400);
    expect(
      (
        await app.testApp.fetch(
          new Request(
            `${OA_TEST_ORIGIN}${app.testApp.publicBasePath.replace(/\/$/, '')}/api/budgetAdjustments`,
          ),
        )
      ).status,
    ).toBe(401);
  });
});
