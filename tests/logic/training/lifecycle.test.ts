// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.ts';
import { attendanceServiceToken } from '../../../server/providers/attendance/contract.ts';
import { ruleServiceToken } from '../../../server/providers/platform/index.ts';
import {
  trainingServiceToken,
  type TrainingService,
} from '../../../server/providers/training/service.ts';
import type { TrainingInput } from '../../../server/providers/training/contract.ts';
import { expenseAuthorizationServiceToken } from '../../../server/providers/expense-authorizations/contract.ts';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
let app: OrgTestApp;
let service: TrainingService;
const sessions: Record<string, TestSession> = {};
const ids: Record<string, string> = {};
const departmentId = 'expense-department';
const form = (extra: Partial<TrainingInput> = {}): TrainingInput => ({
  name: 'Workshop',
  institution: 'Learning Institute',
  reason: 'Team learning',
  amountCents: 0,
  startAt: '2026-11-12T01:00:00Z',
  endAt: '2026-11-12T09:00:00Z',
  usesWorkingTime: true,
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
describe('training: expense staircase and transactional attendance/quota', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    service = c.resolve(trainingServiceToken);
    const now = new Date().toISOString();
    for (const name of [
      'applicant',
      'manager',
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
          managerId: name === 'applicant' ? 'expense-manager' : null,
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await db.repository('employees').updateMany({
      filter: { userId: ids.applicant },
      values: { managerId: 'expense-manager' },
    });
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
  }, 120000);
  afterAll(async () => app?.close());

  it('free working-time training records activity and HR copy without quota or finance stage', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const r = await submit();
    const id = String(r.record.id);
    expect(r.record.status).toBe('manager');
    await act(id, ids.manager);
    const d = await detail(id);
    expect(d.record).toMatchObject({
      status: 'approved',
      attendanceRecorded: true,
      authorizationId: null,
    });
    expect(
      await db
        .repository('attendanceActivities')
        .findMany({ filter: { kind: 'oa.training', applicationId: id } }),
    ).toHaveLength(1);
    expect(
      await db
        .repository('expenseAuthorizations')
        .findMany({ filter: { sourceKind: 'oa.training', sourceId: id } }),
    ).toHaveLength(0);
    expect(await service.readableIds(ids.hr)).toContain(id);
    expect((await service.detail(id, ids.hr)).record.id).toBe(id);
  });
  it('nonworking free training creates neither attendance nor quota and still copies HR', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const r = await submit(form({ usesWorkingTime: false }));
    const id = String(r.record.id);
    await act(id, ids.manager);
    expect((await detail(id)).record).toMatchObject({
      status: 'approved',
      attendanceRecorded: false,
      authorizationId: null,
    });
    expect(
      await db
        .repository('attendanceActivities')
        .findMany({ filter: { applicationId: id } }),
    ).toHaveLength(0);
    expect(await service.readableIds(ids.hr)).toContain(id);
  });
  it('paid training reviews manager then head and finance pool before issuing nonbudget quota', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    const r = await submit(form({ amountCents: 29 }));
    const id = String(r.record.id);
    expect(await service.readableIds(ids.hr)).not.toContain(id);
    await act(id, ids.manager);
    expect((await detail(id)).record.status).toBe('head');
    await act(id, ids.head);
    expect((await detail(id)).record.status).toBe('finance');
    await act(id, ids.finance2);
    const d = await detail(id);
    expect(d.record.status).toBe('approved');
    expect(
      await c
        .resolve(expenseAuthorizationServiceToken)
        .get(d.record.authorizationId!),
    ).toMatchObject({
      budgetMode: 'none',
      departmentId: null,
      year: null,
      subject: null,
      grantedCents: 29,
      sourceKind: 'oa.training',
    });
    expect(
      await db
        .repository('attendanceActivities')
        .findMany({ filter: { applicationId: id } }),
    ).toHaveLength(1);
    expect(await service.readableIds(ids.hr)).toContain(id);
  });
  it('keeps original threshold snapshot after return and restarts manager', async () => {
    const c = app.testApp.application.container;
    const r = await submit(form({ amountCents: 5000000 }));
    const id = String(r.record.id);
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance, 'return');
    const d = await detail(id);
    const snapshot = d.record.ruleSnapshot;
    await c.resolve(ruleServiceToken).set({
      key: 'spend.vp',
      value: 0,
      actorId: ids.finance,
      note: 'changed',
    });
    await service.transition(
      id,
      'edit',
      ids.applicant,
      d.record.lifecycleVersion,
      randomUUID(),
      form({ amountCents: 5000000, reason: 'Updated learning' }),
    );
    const revised = await detail(id);
    await service.transition(
      id,
      'submit',
      ids.applicant,
      revised.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await detail(id)).record.ruleSnapshot).toEqual(snapshot);
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance);
    expect((await detail(id)).record.status).toBe('approved');
    await c.resolve(ruleServiceToken).set({
      key: 'spend.vp',
      value: 50000,
      actorId: ids.finance,
      note: 'Restore threshold',
    });
  });
  it('rolls back quota, attendance and copies if final activity write fails', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    const r = await submit(form({ amountCents: 29 }));
    const id = String(r.record.id);
    await act(id, ids.manager);
    await act(id, ids.head);
    const attendance = c.resolve(attendanceServiceToken);
    const spy = vi
      .spyOn(attendance, 'recordActivity')
      .mockRejectedValueOnce(new Error('activity write failed'));
    await expect(act(id, ids.finance)).rejects.toThrow('activity write failed');
    spy.mockRestore();
    expect((await detail(id)).record).toMatchObject({
      status: 'finance',
      authorizationId: null,
      attendanceRecorded: false,
    });
    expect(
      await db
        .repository('expenseAuthorizations')
        .findMany({ filter: { sourceId: id } }),
    ).toHaveLength(0);
    expect(
      await db
        .repository('attendanceActivities')
        .findMany({ filter: { applicationId: id } }),
    ).toHaveLength(0);
    expect(await service.readableIds(ids.hr)).not.toContain(id);
    await act(id, ids.finance);
    expect((await detail(id)).record.status).toBe('approved');
    expect(
      await db
        .repository('expenseAuthorizations')
        .findMany({ filter: { sourceId: id } }),
    ).toHaveLength(1);
  });
  it('uses exact expense boundaries and preserves the intervening finance stage', async () => {
    for (const amountCents of [5000000, 5000001, 20000000, 20000001]) {
      const r = await submit(form({ amountCents, usesWorkingTime: false })),
        id = String(r.record.id);
      await act(id, ids.manager);
      await act(id, ids.head);
      await act(id, ids.finance2);
      expect((await detail(id)).record.status).toBe(
        amountCents > 5000000 ? 'executive' : 'approved',
      );
      if (amountCents > 5000000) {
        await act(id, ids.executive);
        expect((await detail(id)).record.status).toBe(
          amountCents > 20000000 ? 'gm' : 'approved',
        );
      }
      if (amountCents > 20000000) await act(id, ids.gm);
    }
  });
  it('merges adjacent manager/head using a completed original task and never skips finance', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.repository('departments').updateMany({
      filter: { id: departmentId },
      values: { managerId: ids.manager },
    });
    try {
      const r = await submit(form({ amountCents: 29 })),
        id = String(r.record.id);
      await act(id, ids.manager);
      expect((await detail(id)).record).toMatchObject({
        status: 'finance',
        headMerged: { personId: ids.manager },
      });
      await act(id, ids.finance);
      expect((await detail(id)).record.status).toBe('approved');
    } finally {
      await db.repository('departments').updateMany({
        filter: { id: departmentId },
        values: { managerId: ids.head },
      });
    }
  });
  it('only merges truly adjacent executive/gm when the principal answered personally', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.repository('departments').updateMany({
      filter: { id: departmentId },
      values: { executiveId: ids.gm },
    });
    try {
      const r = await submit(form({ amountCents: 20000001 })),
        id = String(r.record.id);
      await act(id, ids.manager);
      await act(id, ids.head);
      await act(id, ids.finance);
      expect((await detail(id)).record.status).toBe('executive');
      await act(id, ids.gm);
      expect((await detail(id)).record).toMatchObject({
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
  it('a changed primary department invalidates earlier opinions even when the approvers stay the same', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    const nextDepartment = randomUUID();
    await db
      .repository('departments')
      .createOne({
        values: {
          id: nextDepartment,
          title: 'Changed department',
          managerId: ids.head,
          executiveId: ids.executive,
          active: true,
        },
      });
    const r = await submit(form({ amountCents: 29 }));
    const id = String(r.record.id);
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance, 'return');
    await app.organization.addMember(
      { departmentId: nextDepartment, userId: ids.applicant, primary: true },
      { actorId: ids.head },
    );
    try {
      const d = await detail(id);
      await service.transition(
        id,
        'submit',
        ids.applicant,
        d.record.lifecycleVersion,
        randomUUID(),
      );
      expect((await detail(id)).record).toMatchObject({
        status: 'manager',
        departmentId: nextDepartment,
      });
      await act(id, ids.manager);
      expect((await detail(id)).record.status).toBe('head');
      await act(id, ids.head);
      expect((await detail(id)).record.status).toBe('finance');
    } finally {
      await app.organization.setPrimary(departmentId, ids.applicant, {
        actorId: ids.head,
      });
      await app.organization.removeMember(nextDepartment, ids.applicant, {
        actorId: ids.head,
      });
    }
  });
  it('a proxy manager answer cannot merge the original manager and department head', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      directory = c.resolve(approvalDirectoryServiceToken);
    await db.repository('departments').updateMany({
      filter: { id: departmentId },
      values: { managerId: ids.manager },
    });
    const delegation = await directory.createManualDelegation(
      {
        principalId: ids.manager,
        delegateId: ids.proxy,
        scope: ['oa.training'],
        from: new Date(Date.now() - 60000).toISOString(),
        to: new Date(Date.now() + 86400000).toISOString(),
      },
      { actorId: ids.manager },
    );
    try {
      const r = await submit(form({ amountCents: 29 }));
      const id = String(r.record.id);
      await act(id, ids.proxy);
      expect((await detail(id)).record).toMatchObject({
        status: 'head',
        headMerged: null,
      });
      await act(id, ids.manager);
      expect((await detail(id)).record.status).toBe('finance');
    } finally {
      await directory.disableManualDelegation(delegation.id, {
        actorId: ids.manager,
      });
      await db.repository('departments').updateMany({
        filter: { id: departmentId },
        values: { managerId: ids.head },
      });
    }
  });
  it('proxy and transferred executive decisions preserve the separate GM stage', async () => {
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);
    const directory = c.resolve(approvalDirectoryServiceToken);
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
      const delegation = await directory.createManualDelegation(
        {
          principalId: ids.gm,
          delegateId: ids.proxy,
          scope: ['oa.training'],
          from: new Date(Date.now() - 60000).toISOString(),
          to: new Date(Date.now() + 86400000).toISOString(),
        },
        { actorId: ids.gm },
      );
      try {
        const r = await submit(form({ amountCents: 20000001 }));
        const id = String(r.record.id);
        await act(id, ids.manager);
        await act(id, ids.head);
        await act(id, ids.finance);
        await act(id, ids.proxy);
        expect((await detail(id)).record).toMatchObject({
          status: 'gm',
          gmMerged: null,
        });
        await act(id, ids.gm);
      } finally {
        await directory.disableManualDelegation(delegation.id, {
          actorId: ids.gm,
        });
      }
      const r = await submit(form({ amountCents: 20000001 }));
      const id = String(r.record.id);
      await act(id, ids.manager);
      await act(id, ids.head);
      await act(id, ids.finance);
      await act(id, ids.gm, 'transfer', {
        input: { to: ids.proxy },
        comment: 'Proxy review',
      });
      await act(id, ids.proxy);
      expect((await detail(id)).record).toMatchObject({
        status: 'gm',
        gmMerged: null,
      });
      await act(id, ids.gm);
    } finally {
      await db.repository('departments').updateMany({
        filter: { id: departmentId },
        values: { executiveId: ids.executive },
      });
    }
  });
  it('rejects stale content and a foreign document task without changing either stage', async () => {
    const a = await submit(form({ amountCents: 29 }));
    const b = await submit(form({ amountCents: 29 }));
    const aid = String(a.record.id),
      bid = String(b.record.id);
    const d = await service.detail(aid, ids.manager);
    const task = d.taskActions.find((v) =>
      v.actions.some((a) => a.name === 'approve'),
    )!;
    const run = d.runs.find((v) => v.run.id === task.task.runId)!;
    await expect(
      service.action(
        aid,
        {
          target: { taskId: task.task.id },
          action: 'approve',
          contentHash: '0'.repeat(64),
          requestId: randomUUID(),
        },
        ids.manager,
      ),
    ).rejects.toBeDefined();
    await expect(
      service.action(
        bid,
        {
          target: { taskId: task.task.id },
          action: 'approve',
          contentHash: run.run.contentHash,
          requestId: randomUUID(),
        },
        ids.manager,
      ),
    ).rejects.toBeDefined();
    expect((await detail(aid)).record.status).toBe('manager');
    expect((await detail(bid)).record.status).toBe('manager');
    await act(aid, ids.manager);
    await act(bid, ids.manager);
  });
  it('HTTP scopes deny unrelated HR before copy, allow finance and HR after approval, and reject invalid cents/intervals', async () => {
    const r = await submit(form({ amountCents: 29 })),
      id = String(r.record.id);
    expect((await sessions.hr.fetch(`/trainingRequests/${id}`)).status).toBe(
      403,
    );
    expect(
      (await sessions.outsider.fetch(`/trainingRequests/${id}`)).status,
    ).toBe(403);
    expect(
      (await sessions.finance2.fetch(`/trainingRequests/${id}`)).status,
    ).toBe(200);
    const json = (input: unknown) => ({
      method: 'POST',
      headers: { origin: OA_TEST_ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    for (const input of [
      form({ amountCents: -1 }),
      form({ amountCents: 0.29 }),
      form({ endAt: '2026-11-11T00:00:00Z' }),
    ])
      expect(
        (await sessions.applicant.fetch('/trainingRequests', json(input)))
          .status,
      ).toBe(400);
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance);
    expect((await sessions.hr.fetch(`/trainingRequests/${id}`)).status).toBe(
      200,
    );
  });
  it('allows applicant CC through the public active-recipient action and rejects foreign targets', async () => {
    const r = await submit(),
      id = String(r.record.id),
      d = await detail(id),
      run = d.runs[0]!;
    const candidates = await service.candidates(
      id,
      run.run.id,
      'cc',
      ids.applicant,
      { search: '', limit: 50 },
    );
    expect(candidates.people.some((v) => v.id === ids.outsider)).toBe(true);
    await service.action(
      id,
      {
        target: { runId: run.run.id },
        action: 'cc',
        input: { to: ids.outsider },
        requestId: randomUUID(),
      },
      ids.applicant,
    );
    expect(await service.readableIds(ids.outsider)).toContain(id);
    await expect(
      service.candidates(id, 'foreign-run', 'cc', ids.applicant, {}),
    ).rejects.toMatchObject({ code: 'TRAINING_TARGET_MISMATCH' });
    const latest = await detail(id);
    await service.transition(
      id,
      'withdraw',
      ids.applicant,
      latest.record.lifecycleVersion,
      randomUUID(),
    );
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    expect(
      await db
        .repository('attendanceActivities')
        .findMany({ filter: { applicationId: id } }),
    ).toHaveLength(0);
    expect(
      await db
        .repository('expenseAuthorizations')
        .findMany({ filter: { sourceId: id } }),
    ).toHaveLength(0);
  });
});
