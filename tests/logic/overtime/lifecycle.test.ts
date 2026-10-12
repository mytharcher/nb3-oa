// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import {
  overtimeServiceToken,
  OVERTIME_LIFECYCLE,
  type OvertimeService,
  type OvertimeInput,
} from '../../../server/providers/overtime/index.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { startOrgTestApp, json, type OrgTestApp } from '../org/helpers.ts';
let app: OrgTestApp;
let service: OvertimeService;
const people: Record<string, string> = {};
const form = (
  date: string,
  minutes = 120,
  settlement: OvertimeInput['settlement'] = 'pay',
): OvertimeInput => ({ date, minutes, settlement, reason: 'Overtime fixture' });
async function submit(input: OvertimeInput) {
  const draft = await service.create(input, people.applicant);
  const id = String(draft.record.id);
  await service.transition(
    id,
    'submit',
    people.applicant,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  return id;
}
async function act(id: string, actor: string, action = 'approve') {
  const detail = await service.detail(id, actor);
  const offered = detail.taskActions.find((a) =>
    a.actions.some((item) => item.name === action),
  )!;
  expect(offered).toBeDefined();
  const run = detail.runs.find((r) => r.run.id === offered.task.runId)!;
  return service.action(
    id,
    {
      target: { taskId: offered.task.id },
      action,
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
      ...(action === 'return'
        ? { input: { to: 'revision' }, comment: 'Revise duration' }
        : action === 'reject'
          ? { comment: 'Declined' }
          : {}),
    },
    actor,
  );
}
describe('overtime lifecycle and production security', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    service = c.resolve(overtimeServiceToken);
    const db = c.resolve(databaseManagerToken);
    const now = new Date().toISOString();
    for (const name of ['applicant', 'manager', 'head', 'hr', 'stranger']) {
      people[name] = (await app.createUser(`Overtime-${name}`)).user.id;
      await db.repository('employees').createOne({
        values: {
          id: `overtime-${name}`,
          code: `OT-${name}`,
          name,
          userId: people[name],
          managerId: name === 'applicant' ? 'overtime-manager' : null,
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await db.repository('departments').createOne({
      values: {
        id: 'overtime-department',
        title: 'Overtime department',
        managerId: people.head,
        active: true,
      },
    });
    await db.repository('departmentMembers').createOne({
      values: {
        id: 'overtime-membership',
        departmentId: 'overtime-department',
        userId: people.applicant,
        primary: true,
        active: true,
      },
    });
    await db.repository('dutyRoleMembers').createOne({
      values: {
        id: 'overtime-hr',
        dutyRoleCode: 'hr',
        userId: people.hr,
        active: true,
      },
    });
  }, 120000);
  afterAll(async () => app?.close());
  it('requires manager, conditionally head above 36 monthly hours and HR for late submissions', async () => {
    const first = await submit(form('2027-01-01', 1440));
    await act(first, people.manager);
    expect((await service.detail(first, people.applicant)).record.status).toBe(
      'approved',
    );
    const second = await submit(form('2027-01-02', 780));
    await act(second, people.manager);
    const headed = await service.detail(second, people.head);
    expect(headed.record.status).toBe('head');
    expect(headed.record.monthlyMinutes).toBe(2220);
    expect(headed.record.ruleSnapshot?.['overtime.monthlyHead']).toBe(36);
    await act(second, people.head);
    expect((await service.detail(second, people.applicant)).record.status).toBe(
      'approved',
    );
    const late = await submit(form('2020-01-01'));
    await act(late, people.manager);
    expect((await service.detail(late, people.hr)).record.status).toBe('hr');
    await act(late, people.hr);
    expect((await service.detail(late, people.applicant)).record.status).toBe(
      'approved',
    );
  });
  it('protects direct outcomes, actors and stale hashes, and final approval facts are idempotent', async () => {
    const id = await submit(form('2027-02-01', 240, 'compensatory'));
    const detail = await service.detail(id, people.manager);
    const run = detail.runs.at(-1)!;
    const task = run.tasks.find((t) => t.assigneeId === people.manager)!;
    await expect(
      service.runtime.fire(OVERTIME_LIFECYCLE, id, 'managerApproved', {
        actor: { id: people.manager },
      }),
    ).rejects.toThrow();
    await expect(
      service.action(
        id,
        {
          target: { taskId: task.id },
          action: 'approve',
          contentHash: run.run.contentHash,
          requestId: 'stranger',
        },
        people.stranger,
      ),
    ).rejects.toThrow();
    await expect(
      service.action(
        id,
        {
          target: { taskId: task.id },
          action: 'approve',
          contentHash: 'stale',
          requestId: 'stale',
        },
        people.manager,
      ),
    ).rejects.toThrow();
    const input = {
      target: { taskId: task.id },
      action: 'approve',
      contentHash: run.run.contentHash,
      requestId: 'same-final-vote',
    };
    await service.action(id, input, people.manager);
    await service.action(id, input, people.manager);
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    expect(
      await db
        .repository('overtimeMinuteLots')
        .findMany({ filter: { applicationId: id } }),
    ).toHaveLength(1);
    expect(
      await db.repository('leaveLedger').findMany({
        filter: { employeeId: 'overtime-applicant', kind: 'grant' },
      }),
    ).toHaveLength(1);
  });
  it('returns with fresh tasks on resubmission, releases same-day exclusivity on rejection and withdrawal', async () => {
    const id = await submit(form('2027-03-01'));
    const first = await service.detail(id, people.manager);
    await act(id, people.manager, 'return');
    const returned = await service.detail(id, people.applicant);
    expect(returned.record.status).toBe('revision');
    const duplicate = await service.create(
      form('2027-03-01'),
      people.applicant,
    );
    await expect(
      service.transition(
        String(duplicate.record.id),
        'submit',
        people.applicant,
        Number(duplicate.record.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toMatchObject({ code: 'OVERTIME_DUPLICATE_DATE' });
    await service.transition(
      id,
      'edit',
      people.applicant,
      returned.record.lifecycleVersion,
      randomUUID(),
      form('2027-03-01', 180),
    );
    const edited = await service.detail(id, people.applicant);
    await service.transition(
      id,
      'submit',
      people.applicant,
      edited.record.lifecycleVersion,
      randomUUID(),
    );
    const second = await service.detail(id, people.manager);
    expect(second.runs.at(-1)!.run.id).not.toBe(first.runs.at(-1)!.run.id);
    expect(second.record.number).toBe(first.record.number);
    await act(id, people.manager, 'reject');
    expect((await service.detail(id, people.applicant)).record.status).toBe(
      'rejected',
    );
    const replacement = await submit(form('2027-03-01'));
    const active = await service.detail(replacement, people.applicant);
    await service.transition(
      replacement,
      'withdraw',
      people.applicant,
      active.record.lifecycleVersion,
      randomUUID(),
    );
    expect(
      (await service.detail(replacement, people.applicant)).record.status,
    ).toBe('withdrawn');
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    expect(
      await db
        .repository('overtimeAttendance')
        .findMany({ filter: { applicationId: replacement } }),
    ).toHaveLength(0);
  });
  it('serializes simultaneous same-day submissions and final vote versus withdrawal', async () => {
    const drafts = await Promise.all([
      service.create(form('2027-04-01'), people.applicant),
      service.create(form('2027-04-01'), people.applicant),
    ]);
    const results = await Promise.allSettled(
      drafts.map((d) =>
        service.transition(
          String(d.record.id),
          'submit',
          people.applicant,
          Number(d.record.lifecycleVersion),
          randomUUID(),
        ),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const rows = (
      await db.repository('overtimeRequests').findMany({
        filter: { applicantId: people.applicant, status: 'manager' },
      })
    ).filter((r) => r.date === '2027-04-01');
    expect(rows).toHaveLength(1);
    const id = String(rows[0].id);
    const detail = await service.detail(id, people.manager);
    const run = detail.runs.at(-1)!;
    const task = run.tasks.find((t) => t.assigneeId === people.manager)!;
    await Promise.allSettled([
      service.action(
        id,
        {
          target: { taskId: task.id },
          action: 'approve',
          contentHash: run.run.contentHash,
          requestId: randomUUID(),
        },
        people.manager,
      ),
      service.transition(
        id,
        'withdraw',
        people.applicant,
        detail.record.lifecycleVersion,
        randomUUID(),
      ),
    ]);
    const final = await service.detail(id, people.applicant);
    expect(['approved', 'withdrawn']).toContain(final.record.status);
    expect(
      await db
        .repository('overtimeAttendance')
        .findMany({ filter: { applicationId: id } }),
    ).toHaveLength(final.record.status === 'approved' ? 1 : 0);
  });
  it('audits administrator termination transactionally and grants no stranger API access', async () => {
    const id = await submit(form('2027-05-01'));
    const pending = await service.detail(id, people.applicant);
    const admin = await app.admin();
    const c = app.testApp.application.container;
    const spy = vi
      .spyOn(c.resolve(auditServiceToken), 'record')
      .mockRejectedValueOnce(new Error('audit unavailable'));
    try {
      await expect(
        service.transition(
          id,
          'terminate',
          admin.user.id,
          pending.record.lifecycleVersion,
          'terminate-failed',
          { reason: 'Correction' },
          { read: true, create: false, update: false, delete: false },
        ),
      ).rejects.toThrow('audit unavailable');
    } finally {
      spy.mockRestore();
    }
    expect((await service.detail(id, people.applicant)).record.status).toBe(
      'manager',
    );
    await service.transition(
      id,
      'terminate',
      admin.user.id,
      pending.record.lifecycleVersion,
      'terminate',
      { reason: 'Correction' },
      { read: true, create: false, update: false, delete: false },
    );
    expect(
      await c
        .resolve(databaseManagerToken)
        .repository('auditLogs')
        .findMany({ filter: { targetId: id, action: 'overtime.terminate' } }),
    ).toHaveLength(1);
    expect((await app.testApp.request('/overtimeRequests')).status).toBe(401);
    const stranger = await app.createUser('OvertimeApiStranger');
    expect((await stranger.fetch(`/overtimeRequests/${id}`)).status).toBe(403);
    expect(
      (
        await stranger.fetch(
          `/overtimeRequests/${id}/transition`,
          json({
            transition: 'withdraw',
            version: pending.record.lifecycleVersion,
            requestId: randomUUID(),
          }),
        )
      ).status,
    ).toBe(403);
  });
});
