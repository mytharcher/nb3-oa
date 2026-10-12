// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { ruleServiceToken } from '../../../server/providers/platform/index.ts';
import {
  expensePlanServiceToken,
  type ExpensePlanService,
} from '../../../server/providers/expense-plan/service.ts';
import type { ExpensePlanInput } from '../../../server/providers/expense-plan/contract.ts';
import { expenseAuthorizationServiceToken } from '../../../server/providers/expense-authorizations/contract.ts';
import { budgetServiceToken } from '../../../server/providers/budgets/contract.ts';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
let app: OrgTestApp;
let service: ExpensePlanService;
const sessions: Record<string, TestSession> = {};
const ids: Record<string, string> = {};
const departmentId = 'expense-department';
const account = (subject = 'office', year = 2026) => ({
  departmentId,
  year,
  subject,
});
const form = (extra: Partial<ExpensePlanInput> = {}): ExpensePlanInput => ({
  matterType: 'teamBuilding',
  reason: 'Team offsite',
  amountCents: 10001,
  subject: 'office',
  participants: 20,
  eventDate: '2026-11-12',
  ...extra,
});
async function draft(input = form(), actor = ids.applicant, applicant = actor) {
  return (await service.create(input, actor, applicant)).record;
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
async function detail(id: string) {
  return service.detail(id, ids.applicant);
}
async function act(
  id: string,
  actor: string,
  action = 'approve',
  extra: Record<string, unknown> = {},
) {
  const d = await service.detail(id, actor);
  const offer = d.taskActions.find((v) =>
    v.actions.some((a) => a.name === action),
  );
  expect(offer).toBeDefined();
  const run = d.runs.find((v) => v.run.id === offer!.task.runId)!;
  return service.action(
    id,
    {
      target: { taskId: offer!.task.id },
      action,
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
      ...(action === 'return'
        ? { input: { to: 'revision' }, comment: 'Correct estimate' }
        : action === 'reject'
          ? { comment: 'Rejected' }
          : {}),
      ...extra,
    },
    actor,
  );
}
async function withdraw(id: string) {
  const d = await detail(id);
  return service.transition(
    id,
    'withdraw',
    ids.applicant,
    d.record.lifecycleVersion,
    randomUUID(),
  );
}
describe('expense plans: exact transactional budget reservation and granted quota', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    service = c.resolve(expensePlanServiceToken);
    const now = new Date().toISOString();
    for (const name of [
      'applicant',
      'head',
      'finance',
      'finance2',
      'executive',
      'gm',
      'proxy',
      'outsider',
      'hr',
    ]) {
      sessions[name] = await app.createUser(`Expense-${name}`);
      ids[name] = sessions[name].user.id;
      await db.repository('employees').createOne({
        values: {
          id: `expense-${name}`,
          code: `EXP-${name}`,
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
        title: 'Applicant primary department',
        managerId: ids.head,
        executiveId: ids.executive,
        active: true,
      },
    });
    await app.organization.addMember(
      { departmentId, userId: ids.applicant, primary: true },
      { actorId: ids.head },
    );
    for (const [name, role] of [
      ['finance', 'finance'],
      ['finance2', 'finance'],
      ['gm', 'gm'],
      ['hr', 'hr'],
    ])
      await db.repository('dutyRoleMembers').createOne({
        values: {
          id: `expense-role-${name}`,
          dutyRoleCode: role,
          userId: ids[name],
          active: true,
        },
      });
    for (const [subject, year] of [
      ['office', 2026],
      ['travel', 2026],
      ['office', 2027],
    ] as const)
      await db.transaction((tx) =>
        c.resolve(budgetServiceToken).allocate(
          {
            ...account(subject, year),
            deltaCents: 1000000000,
            reference: 'initial',
            requestKey: randomUUID(),
            actorId: ids.finance,
            reason: 'Annual budget',
          },
          tx,
        ),
      );
  }, 120000);
  afterAll(async () => app?.close());
  it('final approval issues an idempotent frozen quota, retains hold and never consumes funds', async () => {
    const c = app.testApp.application.container,
      budgets = c.resolve(budgetServiceToken),
      grants = c.resolve(expenseAuthorizationServiceToken);
    const before = await budgets.balance(account());
    const r = await submit(),
      id = String(r.record.id);
    expect(r.record).toMatchObject({
      departmentId,
      year: 2026,
      heldAccount: account(),
      heldCents: 10001,
      status: 'head',
    });
    await act(id, ids.head);
    await act(id, ids.finance2);
    const approved = (await detail(id)).record;
    expect(approved.status).toBe('approved');
    expect(approved.authorizationId).toBeTruthy();
    expect(await grants.get(approved.authorizationId!)).toMatchObject({
      ...account(),
      sourceKind: 'oa.expensePlan',
      sourceId: id,
      sourceReference: `oa.expensePlan:${id}`,
      grantedCents: 10001,
      state: 'open',
    });
    expect(await budgets.balance(account())).toMatchObject({
      heldCents: before!.heldCents + 10001,
      usedCents: before!.usedCents,
    });
    const grant = await grants.get(approved.authorizationId!);
    expect(
      await c.resolve(databaseManagerToken).transaction((tx) =>
        grants.issue(
          {
            ...account(),
            id: approved.authorizationId!,
            sourceKind: 'oa.expensePlan',
            sourceId: id,
            applicantId: ids.applicant,
            grantedCents: 10001,
            actorId: ids.finance2,
            reason: 'Team offsite',
            requestKey: `expense-plan:${id}:authorization`,
          },
          tx,
        ),
      ),
    ).toMatchObject({ id: grant!.id });
    await expect(withdraw(id)).rejects.toBeDefined();
  });
  it('insufficient budget and failed audit roll back numbering, lifecycle and money together', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      budgets = c.resolve(budgetServiceToken);
    const r = await draft(form({ amountCents: 2000000000 })),
      count = await db.repository('oaLifecycleTransitions').count();
    await expect(
      service.transition(
        String(r.id),
        'submit',
        ids.applicant,
        Number(r.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_INSUFFICIENT' });
    expect((await detail(String(r.id))).record).toMatchObject({
      status: 'draft',
      number: null,
      heldCents: 0,
    });
    expect(await db.repository('oaLifecycleTransitions').count()).toBe(count);
    const other = await draft(),
      before = await budgets.balance(account());
    const audit = vi
      .spyOn(c.resolve(auditServiceToken), 'record')
      .mockRejectedValueOnce(new Error('audit down'));
    try {
      await expect(
        service.transition(
          String(other.id),
          'submit',
          ids.applicant,
          Number(other.lifecycleVersion),
          randomUUID(),
        ),
      ).rejects.toThrow('audit down');
    } finally {
      audit.mockRestore();
    }
    expect((await detail(String(other.id))).record).toMatchObject({
      status: 'draft',
      number: null,
      heldCents: 0,
    });
    expect(await budgets.balance(account())).toMatchObject({
      heldCents: before!.heldCents,
    });
  });
  it('return keeps original hold, revising year/subject transfers the actual reservation atomically', async () => {
    const c = app.testApp.application.container,
      budgets = c.resolve(budgetServiceToken);
    const before = await budgets.balance(account()),
      nextBefore = await budgets.balance(account('office', 2027));
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head, 'return');
    const returned = (await detail(id)).record;
    expect(returned.heldCents).toBe(10001);
    const edit = await service.transition(
      id,
      'edit',
      ids.applicant,
      returned.lifecycleVersion,
      randomUUID(),
      form({ eventDate: '2027-01-01', amountCents: 20002 }),
    );
    expect(edit.record.heldAccount).toEqual(account());
    await service.transition(
      id,
      'submit',
      ids.applicant,
      Number(edit.record.lifecycleVersion),
      randomUUID(),
    );
    expect(await budgets.balance(account())).toMatchObject({
      heldCents: before!.heldCents,
    });
    expect(await budgets.balance(account('office', 2027))).toMatchObject({
      heldCents: nextBefore!.heldCents + 20002,
    });
    expect((await detail(id)).record.status).toBe('head');
    await withdraw(id);
    expect(await budgets.balance(account('office', 2027))).toMatchObject({
      heldCents: nextBefore!.heldCents,
    });
  });
  it('uses strict exact spending boundaries and ignores later live rule changes', async () => {
    const c = app.testApp.application.container;
    for (const [amount, stage] of [
      [5000000, 'approved'],
      [5000001, 'executive'],
      [20000000, 'executive'],
      [20000001, 'executive'],
    ] as const) {
      const r = await submit(form({ amountCents: amount })),
        id = String(r.record.id);
      await act(id, ids.head);
      await act(id, ids.finance);
      expect((await detail(id)).record.status).toBe(stage);
      if (stage === 'executive') {
        await act(id, ids.executive);
        expect((await detail(id)).record.status).toBe(
          amount > 20000000 ? 'gm' : 'approved',
        );
      }
      if ((await detail(id)).record.status === 'gm') await act(id, ids.gm);
    }
    const r = await submit(form({ amountCents: 5000001 })),
      id = String(r.record.id);
    await c.resolve(ruleServiceToken).set({
      key: 'spend.vp',
      value: 100000,
      actorId: ids.finance,
      note: 'Later live version',
    });
    try {
      await act(id, ids.head);
      await act(id, ids.finance);
      expect((await detail(id)).record.status).toBe('executive');
    } finally {
      await c.resolve(ruleServiceToken).set({
        key: 'spend.vp',
        value: 50000,
        actorId: ids.finance,
        note: 'Restore',
      });
    }
    await withdraw(id);
  });
  it('retains manager approval reuse on unchanged resubmission but not changed covered fields', async () => {
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    await act(id, ids.finance, 'return');
    const returned = (await detail(id)).record;
    await service.transition(
      id,
      'submit',
      ids.applicant,
      returned.lifecycleVersion,
      randomUUID(),
    );
    expect((await detail(id)).record.status).toBe('finance');
    await act(id, ids.finance, 'return');
    const current = (await detail(id)).record;
    const e = await service.transition(
      id,
      'edit',
      ids.applicant,
      current.lifecycleVersion,
      randomUUID(),
      form({ participants: 21 }),
    );
    await service.transition(
      id,
      'submit',
      ids.applicant,
      Number(e.record.lifecycleVersion),
      randomUUID(),
    );
    expect((await detail(id)).record.status).toBe('head');
    await withdraw(id);
  });
  it('final quota creation failure rolls back the approval answer and retains pending decision', async () => {
    const c = app.testApp.application.container,
      r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    const spy = vi
      .spyOn(c.resolve(expenseAuthorizationServiceToken), 'issue')
      .mockRejectedValueOnce(new Error('quota down'));
    try {
      await expect(act(id, ids.finance)).rejects.toThrow('quota down');
    } finally {
      spy.mockRestore();
    }
    expect((await detail(id)).record).toMatchObject({
      status: 'finance',
      authorizationId: null,
    });
    await act(id, ids.finance);
    expect((await detail(id)).record.status).toBe('approved');
  });
  it('enforces foreign-task, stale hash and HR proxy read scope at HTTP boundary', async () => {
    const a = await submit(),
      b = await submit(),
      id = String(a.record.id),
      otherId = String(b.record.id);
    const d = await service.detail(otherId, ids.head),
      task = d.taskActions.find((x) =>
        x.actions.some((a) => a.name === 'approve'),
      )!.task;
    await expect(
      service.action(
        id,
        {
          target: { taskId: task.id },
          action: 'approve',
          contentHash: d.runs[0].run.contentHash,
          requestId: randomUUID(),
        },
        ids.head,
      ),
    ).rejects.toMatchObject({ code: 'EXPENSE_PLAN_TARGET_MISMATCH' });
    await expect(
      act(id, ids.head, 'approve', { contentHash: 'stale' }),
    ).rejects.toBeDefined();
    expect(
      (
        await app.testApp.fetch(
          new Request(
            `${OA_TEST_ORIGIN}${app.testApp.publicBasePath.replace(/\/$/, '')}/api/expensePlans/${id}`,
          ),
        )
      ).status,
    ).toBe(401);
    expect((await sessions.hr.fetch(`/expensePlans/${id}`)).status).toBe(403);
    const proxy = await draft(form(), ids.hr, ids.applicant);
    expect((await sessions.hr.fetch(`/expensePlans/${proxy.id}`)).status).toBe(
      200,
    );
    expect(
      (
        await sessions.outsider.fetch('/expensePlans', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: OA_TEST_ORIGIN,
          },
          body: JSON.stringify({ ...form(), applicantId: ids.applicant }),
        })
      ).status,
    ).toBe(403);
    const injected = await sessions.applicant.fetch('/expensePlans', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: OA_TEST_ORIGIN },
      body: JSON.stringify({ ...form(), departmentId: 'foreign' }),
    });
    expect(injected.status).toBe(400);
    expect(await injected.json()).toHaveProperty('error');
    await withdraw(id);
    await withdraw(otherId);
  });
  it('rejection and reasoned administrator termination release retained source reservations', async () => {
    const c = app.testApp.application.container,
      budgets = c.resolve(budgetServiceToken),
      before = await budgets.balance(account());
    const rejected = await submit(),
      id = String(rejected.record.id);
    await act(id, ids.head, 'reject');
    expect((await detail(id)).record).toMatchObject({
      status: 'rejected',
      heldCents: 0,
    });
    const terminated = await submit(),
      tid = String(terminated.record.id),
      admin = await app.admin();
    await expect(
      service.transition(
        tid,
        'terminate',
        admin.user.id,
        Number(terminated.record.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toBeDefined();
    await service.transition(
      tid,
      'terminate',
      admin.user.id,
      Number(terminated.record.lifecycleVersion),
      randomUUID(),
      { reason: 'Cancel event' },
    );
    expect((await detail(tid)).record).toMatchObject({
      status: 'terminated',
      heldCents: 0,
    });
    expect(await budgets.balance(account())).toMatchObject({
      heldCents: before!.heldCents,
    });
  });
  it('merges adjacent executive and GM only on that completed member task answered by the same principal', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    await db.repository('departments').updateMany({
      filter: { id: departmentId },
      values: { executiveId: ids.gm },
    });
    try {
      const r = await submit(form({ amountCents: 20000001 })),
        id = String(r.record.id);
      await act(id, ids.head);
      await act(id, ids.finance);
      expect((await detail(id)).record.status).toBe('executive');
      await act(id, ids.gm);
      const d = await detail(id);
      expect(d.record.status).toBe('approved');
      expect(d.record.gmMerged).toMatchObject({
        personId: ids.gm,
        stages: ['executive', 'gm'],
      });
      expect(d.runs.flatMap((r) => r.tasks).some((t) => t.stage === 'gm')).toBe(
        false,
      );
      expect(
        await db.repository('auditLogs').count({
          filter: { targetId: id, action: 'expensePlan.samePersonMerged' },
        }),
      ).toBe(1);
      // A proxy answer keeps the second role's decision distinct.
      const directory = c.resolve(approvalDirectoryServiceToken);
      const delegation = await directory.createManualDelegation(
        {
          principalId: ids.gm,
          delegateId: ids.proxy,
          scope: ['oa.expensePlan'],
          from: new Date(Date.now() - 60000).toISOString(),
          to: new Date(Date.now() + 86400000).toISOString(),
        },
        { actorId: ids.gm },
      );
      try {
        const proxied = await submit(form({ amountCents: 20000001 })),
          pid = String(proxied.record.id);
        await act(pid, ids.head);
        await act(pid, ids.finance);
        await act(pid, ids.proxy);
        expect((await detail(pid)).record).toMatchObject({
          status: 'gm',
          gmMerged: null,
        });
        await act(pid, ids.gm);
        expect((await detail(pid)).record.status).toBe('approved');
      } finally {
        await directory.disableManualDelegation(delegation.id, {
          actorId: ids.gm,
        });
      }
    } finally {
      await db.repository('departments').updateMany({
        filter: { id: departmentId },
        values: { executiveId: ids.executive },
      });
    }
  });
  it('transferred and added proxy opinions cannot manufacture a same-person merge', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    await app.organization.addMember(
      { departmentId, userId: ids.gm },
      { actorId: ids.head },
    );
    await app.organization.addMember(
      { departmentId, userId: ids.proxy },
      { actorId: ids.head },
    );
    await db.repository('departments').updateMany({
      filter: { id: departmentId },
      values: { executiveId: ids.gm },
    });
    try {
      const transferred = await submit(form({ amountCents: 20000001 })),
        tid = String(transferred.record.id);
      await act(tid, ids.head);
      await act(tid, ids.finance);
      await act(tid, ids.gm, 'transfer', {
        input: { to: ids.proxy },
        comment: 'Proxy review',
      });
      await act(tid, ids.proxy);
      expect((await detail(tid)).record).toMatchObject({
        status: 'gm',
        gmMerged: null,
      });
      await withdraw(tid);
      const signed = await submit(form({ amountCents: 20000001 })),
        sid = String(signed.record.id);
      await act(sid, ids.head);
      await act(sid, ids.finance);
      await act(sid, ids.gm, 'addSigner', {
        input: { person: ids.proxy, mode: 'alongside' },
      });
      await act(sid, ids.gm);
      await act(sid, ids.proxy);
      // The principal itself already approved, so a supplementary proxy does not replace that fact.
      expect((await detail(sid)).record).toMatchObject({
        status: 'approved',
        gmMerged: { personId: ids.gm },
      });
    } finally {
      await db.repository('departments').updateMany({
        filter: { id: departmentId },
        values: { executiveId: ids.executive },
      });
    }
  });
  it('holds an unstaffed GM place and applies applicant recusal without automatic approval', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    await db.repository('dutyRoleMembers').updateMany({
      filter: { id: 'expense-role-gm' },
      values: { active: false },
    });
    try {
      const r = await submit(form({ amountCents: 20000001 })),
        id = String(r.record.id);
      await act(id, ids.head);
      await act(id, ids.finance);
      await act(id, ids.executive);
      const d = await detail(id);
      expect(d.record.status).toBe('gm');
      expect(
        d.runs
          .filter((r) => r.run.status === 'open')
          .flatMap((r) => r.tasks)
          .filter((t) => t.status === 'pending'),
      ).toHaveLength(0);
      await withdraw(id);
    } finally {
      await db.repository('dutyRoleMembers').updateMany({
        filter: { id: 'expense-role-gm' },
        values: { active: true },
      });
    }
    await db.repository('departments').updateMany({
      filter: { id: departmentId },
      values: { managerId: ids.applicant },
    });
    try {
      const r = await submit(),
        id = String(r.record.id),
        d = await detail(id);
      expect(d.record.status).toBe('head');
      expect(
        d.taskActions.some((v) => v.actions.some((a) => a.name === 'approve')),
      ).toBe(false);
      await withdraw(id);
    } finally {
      await db.repository('departments').updateMany({
        filter: { id: departmentId },
        values: { managerId: ids.head },
      });
    }
  });
  it('blocks nondefault SLA clocks without reserving money', async () => {
    const rules = app.testApp.application.container.resolve(ruleServiceToken);
    await rules.set({
      key: 'sla.remindHours',
      value: 25,
      actorId: ids.finance,
    });
    try {
      await expect(submit()).rejects.toMatchObject({
        code: 'EXPENSE_PLAN_SLA_CONFIGURATION_UNSUPPORTED',
      });
    } finally {
      await rules.set({
        key: 'sla.remindHours',
        value: 24,
        actorId: ids.finance,
      });
    }
  });
  it('failed revised funding preserves the old reservation and source state; department drift invalidates reuse', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      budgets = c.resolve(budgetServiceToken);
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    await act(id, ids.finance, 'return');
    const before = await budgets.balance(account()),
      revision = (await detail(id)).record;
    const edit = await service.transition(
      id,
      'edit',
      ids.applicant,
      revision.lifecycleVersion,
      randomUUID(),
      form({ amountCents: 2000000000, subject: 'travel' }),
    );
    await expect(
      service.transition(
        id,
        'submit',
        ids.applicant,
        Number(edit.record.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toMatchObject({ code: 'BUDGET_INSUFFICIENT' });
    expect((await detail(id)).record).toMatchObject({
      status: 'revision',
      heldAccount: account(),
      heldCents: 10001,
    });
    expect(await budgets.balance(account())).toMatchObject({
      heldCents: before!.heldCents,
    });
    const d = (await detail(id)).record;
    const restored = await service.transition(
      id,
      'edit',
      ids.applicant,
      d.lifecycleVersion,
      randomUUID(),
      form(),
    );
    const foreign = 'expense-new-primary';
    await db
      .repository('departments')
      .createOne({
        values: {
          id: foreign,
          title: 'New primary department',
          managerId: ids.head,
          executiveId: ids.executive,
          active: true,
        },
      });
    await db.transaction((tx) =>
      budgets.allocate(
        {
          departmentId: foreign,
          year: 2026,
          subject: 'office',
          deltaCents: 100000,
          reference: 'newdept',
          requestKey: randomUUID(),
          actorId: ids.finance,
          reason: 'Budget',
        },
        tx,
      ),
    );
    await app.organization.addMember(
      { departmentId: foreign, userId: ids.applicant, primary: true },
      { actorId: ids.head },
    );
    try {
      await service.transition(
        id,
        'submit',
        ids.applicant,
        Number(restored.record.lifecycleVersion),
        randomUUID(),
      );
      expect((await detail(id)).record).toMatchObject({
        status: 'head',
        departmentId: foreign,
        heldAccount: { departmentId: foreign, year: 2026, subject: 'office' },
      });
      expect(await budgets.balance(account())).toMatchObject({
        heldCents: before!.heldCents - 10001,
      });
      await withdraw(id);
    } finally {
      await app.organization.setPrimary(departmentId, ids.applicant, {
        actorId: ids.head,
      });
    }
  });
});
