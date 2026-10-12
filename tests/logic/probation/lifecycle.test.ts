// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { APPROVAL_COLLECTIONS } from '@nocobase/app-plugin-approval/server';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  createProbationService,
  type ProbationService,
} from '../../../server/providers/probation/service.js';
import { createDepartureService } from '../../../server/providers/departure/service.js';
import type { ProbationDepartureAdapter } from '../../../server/providers/probation/contract.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import { approvalNotificationServiceToken } from '../../../server/providers/approval-notifications/contract.js';
import {
  calendarServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../../../server/providers/platform/index.js';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
let app: OrgTestApp;
let service: ProbationService;
let linkedDeparture: ProbationDepartureAdapter | undefined;
const ids: Record<string, string> = {};
let serial = 0;
async function employee(endDate = '2026-11-01') {
  const db = app.testApp.application.container.resolve(databaseManagerToken);
  const id = `probation-person-${++serial}`;
  const session = await app.createUser(id);
  const userId = session.user.id;
  await db.repository('employees').createOne({
    values: {
      id,
      code: id,
      name: id,
      userId,
      managerId: 'probation-manager',
      status: 'probation',
      probationEndDate: endDate,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await app.organization.addMember(
    { departmentId: 'probation-department', userId, primary: true },
    { actorId: ids.hr },
  );
  return { id, userId };
}
async function submit() {
  const person = await employee();
  const draft = await service.create(
    { employeeId: person.id, selfEvaluation: 'I completed my goals' },
    ids.hr,
    person.userId,
  );
  const id = String(draft.record.id);
  await service.transition(
    id,
    'submit',
    person.userId,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  return { id, person };
}
async function act(
  id: string,
  actor: string,
  data?: Record<string, unknown>,
  compensation?: { gradeId: string; baseSalary: string },
) {
  const detail = await service.detail(id, actor);
  const offer = detail.taskActions.find((t) =>
    t.actions.some((a) => a.name === 'approve'),
  )!;
  expect(offer).toBeDefined();
  const run = detail.runs.find((r) => r.run.id === offer.task.runId)!;
  return service.action(
    id,
    {
      action: 'approve',
      target: { taskId: offer.task.id },
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
      ...(data ? { input: { data } } : {}),
    },
    actor,
    undefined,
    compensation,
  );
}
async function manager(
  id: string,
  conclusion = 'regular',
  deferredTo: string | null = null,
) {
  return act(id, ids.manager, {
    evaluation: 'Good work',
    conclusion,
    deferredTo,
  });
}
async function toHr(
  id: string,
  conclusion = 'regular',
  deferredTo: string | null = null,
) {
  await manager(id, conclusion, deferredTo);
  await act(id, ids.head);
}
describe('probation actual application transactions', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);
    for (const name of ['hr', 'manager', 'head', 'gm', 'outsider']) {
      const session = await app.createUser(`probation-${name}`);
      ids[name] = session.user.id;
      await db.repository('employees').createOne({
        values: {
          id: `probation-${name}`,
          code: `P-${name}`,
          name,
          userId: ids[name],
          status: 'regular',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    await db.repository('departments').createOne({
      values: {
        id: 'probation-department',
        title: 'Probation department',
        managerId: ids.head,
        active: true,
      },
    });
    for (const role of ['hr', 'gm'])
      await db.repository('dutyRoleMembers').createOne({
        values: {
          id: `probation-role-${role}`,
          dutyRoleCode: role,
          userId: ids[role],
          active: true,
        },
      });
    await db.repository('grades').createOne({
      values: {
        id: 'probation-grade',
        code: 'P-G',
        title: 'Junior',
        rank: 1,
        active: true,
      },
    });
    service = createProbationService({
      db,
      org: c.resolve(orgServiceToken),
      audit: c.resolve(auditServiceToken),
      users: c.resolve(userAdministrationServiceToken),
      employees: c.resolve(employeeServiceToken),
      directory: c.resolve(approvalDirectoryServiceToken),
      calendar: c.resolve(calendarServiceToken),
      rules: c.resolve(ruleServiceToken),
      sequences: c.resolve(sequenceServiceToken),
      notifications: c.resolve(approvalNotificationServiceToken),
      departure: () => linkedDeparture,
    });
    await service.initialize();
  }, 120000);
  afterAll(async () => app?.close());
  it('regularizes and stores compensation without exposing amounts through SDK/history/audit', async () => {
    const { id, person } = await submit();
    await toHr(id);
    await act(id, ids.hr, undefined, {
      gradeId: 'probation-grade',
      baseSalary: '12345.67',
    });
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);
    expect(
      (await c.resolve(employeeServiceToken).getById(person.id))?.status,
    ).toBe('regular');
    expect(
      await db
        .repository('employeeCompensation')
        .findOne({ filter: { employeeId: person.id } }),
    ).toMatchObject({ baseSalary: '12345.67', gradeId: 'probation-grade' });
    const detail = await service.detail(id, ids.manager);
    expect(detail.record.status).toBe('approved');
    expect(JSON.stringify(detail)).not.toContain('12345.67');
    for (const collection of [
      'oaLifecycleTransitions',
      'oaLifecycleEffectRuns',
      'employeeHistory',
      'auditLogs',
      ...Object.values(APPROVAL_COLLECTIONS),
    ]) {
      const rows = await db.repository(collection).findMany();
      expect(JSON.stringify(rows)).not.toContain('12345.67');
    }
    expect(
      await db
        .repository('probationCompensationProposals')
        .findMany({ filter: { recordId: id } }),
    ).toHaveLength(1);
  });
  it('extends probation through the employee contract without issuing compensation', async () => {
    const { id, person } = await submit();
    await toHr(id, 'deferred', '2026-12-01');
    await act(id, ids.hr, undefined, {
      gradeId: 'probation-grade',
      baseSalary: '12345.67',
    });
    const c = app.testApp.application.container;
    expect(
      await c.resolve(employeeServiceToken).getById(person.id),
    ).toMatchObject({ status: 'probation', probationEndDate: '2026-12-01' });
    expect(
      await c
        .resolve(databaseManagerToken)
        .repository('employeeCompensation')
        .findMany({ filter: { employeeId: person.id } }),
    ).toHaveLength(0);
  });
  it('rolls back final HR answer, employee status and private proposal if compensation application fails', async () => {
    const { id, person } = await submit();
    await toHr(id);
    const c = app.testApp.application.container;
    const employeeService = c.resolve(employeeServiceToken);
    const spy = vi
      .spyOn(employeeService, 'appendCompensation')
      .mockRejectedValueOnce(new Error('Compensation unavailable'));
    await expect(
      act(id, ids.hr, undefined, {
        gradeId: 'probation-grade',
        baseSalary: '98765.43',
      }),
    ).rejects.toThrow();
    spy.mockRestore();
    expect((await service.detail(id, ids.hr)).record.status).toBe('hr');
    expect((await employeeService.getById(person.id))?.status).toBe(
      'probation',
    );
    expect(
      await c
        .resolve(databaseManagerToken)
        .repository('probationCompensationProposals')
        .findMany({ filter: { recordId: id } }),
    ).toHaveLength(0);
  });
  it('refuses missing P4 linkage and keeps the actual GM decision pending', async () => {
    const { id, person } = await submit();
    await toHr(id, 'declined');
    await act(id, ids.hr, undefined, {
      gradeId: 'probation-grade',
      baseSalary: '0',
    });
    await expect(act(id, ids.gm)).rejects.toThrow('departure workflow');
    expect((await service.detail(id, ids.gm)).record.status).toBe('gm');
    expect(
      (
        await app.testApp.application.container
          .resolve(employeeServiceToken)
          .getById(person.id)
      )?.status,
    ).toBe('probation');
  });
  it('links a real P4 draft in the GM final transaction without changing the employee status', async () => {
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);
    const departures = createDepartureService({
      db,
      directory: c.resolve(approvalDirectoryServiceToken),
      calendar: c.resolve(calendarServiceToken),
      rules: c.resolve(ruleServiceToken),
      sequences: c.resolve(sequenceServiceToken),
      org: c.resolve(orgServiceToken),
      employees: c.resolve(employeeServiceToken),
      audit: c.resolve(auditServiceToken),
      users: c.resolve(userAdministrationServiceToken),
      dictionaries: c.resolve(dictionaryServiceToken),
    });
    linkedDeparture = departures.adapter;
    try {
      const { id, person } = await submit();
      await toHr(id, 'declined');
      await act(id, ids.hr, undefined, {
        gradeId: 'probation-grade',
        baseSalary: '0',
      });
      await act(id, ids.gm);
      expect((await service.detail(id, ids.gm)).record.status).toBe('approved');
      const drafts = await db
        .repository('departureRequests')
        .findMany({ filter: { sourceProbationId: id } });
      expect(drafts).toHaveLength(1);
      expect(drafts[0]).toMatchObject({
        employeeId: person.id,
        applicantId: person.userId,
        createdById: ids.hr,
        departureType: 'declinedProbation',
        status: 'draft',
      });
      expect(
        (await c.resolve(employeeServiceToken).getById(person.id))?.status,
      ).toBe('probation');
      const history = await db
        .repository('employeeHistory')
        .findMany({ filter: { employeeId: person.id } });
      expect(JSON.stringify(history)).toContain(String(drafts[0].id));
    } finally {
      linkedDeparture = undefined;
    }
  });
  it('rolls back a real departure draft and GM decision when linked audit fails', async () => {
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);
    const actualAudit = c.resolve(auditServiceToken);
    const departures = createDepartureService({
      db,
      directory: c.resolve(approvalDirectoryServiceToken),
      calendar: c.resolve(calendarServiceToken),
      rules: c.resolve(ruleServiceToken),
      sequences: c.resolve(sequenceServiceToken),
      org: c.resolve(orgServiceToken),
      employees: c.resolve(employeeServiceToken),
      audit: {
        ...actualAudit,
        record: async (entry, tx) => {
          await actualAudit.record(entry, tx);
          if (entry.action === 'departure.createFromProbation')
            throw new Error('linked audit failure');
        },
      },
      users: c.resolve(userAdministrationServiceToken),
      dictionaries: c.resolve(dictionaryServiceToken),
    });
    linkedDeparture = departures.adapter;
    try {
      const { id, person } = await submit();
      await toHr(id, 'declined');
      await act(id, ids.hr, undefined, {
        gradeId: 'probation-grade',
        baseSalary: '0',
      });
      await expect(act(id, ids.gm)).rejects.toThrow('linked audit failure');
      expect((await service.detail(id, ids.gm)).record.status).toBe('gm');
      expect(
        await db
          .repository('departureRequests')
          .findMany({ filter: { sourceProbationId: id } }),
      ).toHaveLength(0);
      expect(
        (await c.resolve(employeeServiceToken).getById(person.id))?.status,
      ).toBe('probation');
    } finally {
      linkedDeparture = undefined;
    }
  });
  it('creates at most one scheduled draft per employee/end date and rejects unauthorized manual creation', async () => {
    const person = await employee('2026-10-25');
    await expect(
      service.create(
        { employeeId: person.id, selfEvaluation: '' },
        person.userId,
      ),
    ).rejects.toThrow();
    await service.reconcile(new Date('2026-10-11T01:00:00Z'));
    await service.reconcile(new Date('2026-10-11T01:00:00Z'));
    const rows = await app.testApp.application.container
      .resolve(databaseManagerToken)
      .repository('probationRequests')
      .findMany({ filter: { employeeId: person.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('draft');
  });
  it('enforces private action row and field scopes independently of ordinary viewing', async () => {
    const { id } = await submit();
    await toHr(id);
    await act(id, ids.hr, undefined, {
      gradeId: 'probation-grade',
      baseSalary: '12345.67',
    });
    const all = {
      create: false,
      update: false,
      delete: false,
      read: true as const,
    };
    await expect(
      service.compensation(id, ids.hr, all, {
        record: {
          create: false,
          update: false,
          delete: false,
          read: { scope: { id: randomUUID() }, fields: ['id'] },
        },
        proposal: all,
      }),
    ).rejects.toMatchObject({ kind: 'permission' });
    await expect(
      service.compensation(id, ids.hr, all, {
        record: all,
        proposal: {
          create: false,
          update: false,
          delete: false,
          read: { scope: true as const, fields: ['id', 'recordId', 'gradeId'] },
        },
      }),
    ).rejects.toMatchObject({ kind: 'permission' });
    await expect(
      service.compensation(id, ids.manager, all, {
        record: all,
        proposal: all,
      }),
    ).rejects.toMatchObject({ kind: 'permission' });
    expect(
      await service.compensation(id, ids.hr, all, {
        record: all,
        proposal: all,
      }),
    ).toEqual({ gradeId: 'probation-grade', baseSalary: '12345.67' });
  });
  it('merges manager/head only using the manager original completed opinion', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.repository('departments').updateOne({
      filter: { id: 'probation-department' },
      values: { managerId: ids.manager },
    });
    try {
      const { id } = await submit();
      await manager(id);
      const detail = await service.detail(id, ids.manager);
      expect(detail.record.status).toBe('hr');
      expect(detail.record.headMerged).toMatchObject({
        personId: ids.manager,
        stages: ['manager', 'head'],
      });
    } finally {
      await db.repository('departments').updateOne({
        filter: { id: 'probation-department' },
        values: { managerId: ids.head },
      });
    }
  });
  it('allocates fresh tasks after return and invalidates the preceding stay', async () => {
    const { id, person } = await submit();
    const detail = await service.detail(id, ids.manager);
    const old = detail.taskActions.find((t) =>
      t.actions.some((a) => a.name === 'return'),
    )!;
    const run = detail.runs.find((v) => v.run.id === old.task.runId)!;
    await service.action(
      id,
      {
        action: 'return',
        target: { taskId: old.task.id },
        input: { to: 'revision' },
        comment: 'Clarify evaluation',
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
      },
      ids.manager,
    );
    const revision = await service.detail(id, person.userId);
    await service.transition(
      id,
      'edit',
      person.userId,
      revision.record.lifecycleVersion,
      randomUUID(),
      { selfEvaluation: 'Revised goals' },
    );
    const edited = await service.detail(id, person.userId);
    await service.transition(
      id,
      'submit',
      person.userId,
      edited.record.lifecycleVersion,
      randomUUID(),
    );
    const fresh = await service.detail(id, ids.manager);
    expect(fresh.runs.at(-1)!.run.id).not.toBe(run.run.id);
    await expect(
      service.action(
        id,
        {
          action: 'approve',
          target: { taskId: old.task.id },
          input: {
            data: {
              evaluation: 'Stale',
              conclusion: 'regular',
              deferredTo: null,
            },
          },
          contentHash: run.run.contentHash,
          requestId: randomUUID(),
        },
        ids.manager,
      ),
    ).rejects.toThrow();
  });
  it('commits only one final vote during simultaneous final approvals', async () => {
    const { id, person } = await submit();
    await toHr(id);
    const detail = await service.detail(id, ids.hr);
    const offer = detail.taskActions.find((t) =>
      t.actions.some((a) => a.name === 'approve'),
    )!;
    const run = detail.runs.find((v) => v.run.id === offer.task.runId)!;
    const results = await Promise.allSettled(
      [1, 2].map(() =>
        service.action(
          id,
          {
            action: 'approve',
            target: { taskId: offer.task.id },
            contentHash: run.run.contentHash,
            requestId: randomUUID(),
          },
          ids.hr,
          undefined,
          { gradeId: 'probation-grade', baseSalary: '12345.67' },
        ),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    expect(
      await db
        .repository('employeeCompensation')
        .findMany({ filter: { employeeId: person.id } }),
    ).toHaveLength(1);
    expect(
      await db
        .repository('probationCompensationProposals')
        .findMany({ filter: { recordId: id } }),
    ).toHaveLength(1);
  });
  it('rejects nested private injection and an HR approval without private input before any SDK write', async () => {
    const { id } = await submit();
    await toHr(id);
    const detail = await service.detail(id, ids.hr);
    const offer = detail.taskActions.find((t) =>
      t.actions.some((a) => a.name === 'approve'),
    )!;
    const run = detail.runs.find((v) => v.run.id === offer.task.runId)!;
    const input = {
      action: 'approve',
      target: { taskId: offer.task.id },
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
    };
    await expect(
      service.action(
        id,
        {
          ...input,
          input: {
            data: {
              gradeId: 'probation-grade',
              salaryProposalId: randomUUID(),
            },
          },
        },
        ids.hr,
      ),
    ).rejects.toMatchObject({ code: 'PROBATION_PRIVATE_INPUT_REQUIRED' });
    await expect(
      service.action(
        id,
        { ...input, input: { data: { baseSalary: '99999.99' } } },
        ids.hr,
      ),
    ).rejects.toMatchObject({ code: 'PROBATION_PRIVATE_INPUT_REQUIRED' });
    await expect(service.action(id, input, ids.hr)).rejects.toMatchObject({
      code: 'PROBATION_PRIVATE_INPUT_REQUIRED',
    });
    expect((await service.detail(id, ids.hr)).record.status).toBe('hr');
    expect(JSON.stringify(await service.detail(id, ids.hr))).not.toContain(
      '99999.99',
    );
  });
  it('does not let ownership bypass an ordinary view record scope', async () => {
    const { id, person } = await submit();
    const excluded = {
      create: false,
      update: false,
      delete: false,
      read: { scope: { id: randomUUID() }, fields: ['id'] },
    };
    await expect(
      service.detail(id, person.userId, excluded),
    ).rejects.toMatchObject({ kind: 'permission' });
  });
  it('replays private HR compensation without creating a second proposal or fact', async () => {
    const { id, person } = await submit();
    await toHr(id);
    const detail = await service.detail(id, ids.hr);
    const offer = detail.taskActions.find((t) =>
      t.actions.some((a) => a.name === 'approve'),
    )!;
    const run = detail.runs.find((v) => v.run.id === offer.task.runId)!;
    const input = {
      action: 'approve',
      target: { taskId: offer.task.id },
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
    };
    const compensation = { gradeId: 'probation-grade', baseSalary: '12345.67' };
    await service.action(id, input, ids.hr, undefined, compensation);
    await service.action(id, input, ids.hr, undefined, compensation);
    await expect(
      service.action(id, input, ids.hr, undefined, {
        ...compensation,
        baseSalary: '12346.67',
      }),
    ).rejects.toMatchObject({ code: 'PROBATION_REQUEST_REUSED' });
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    expect(
      await db
        .repository('employeeCompensation')
        .findMany({ filter: { employeeId: person.id } }),
    ).toHaveLength(1);
    expect(
      await db
        .repository('probationCompensationProposals')
        .findMany({ filter: { recordId: id } }),
    ).toHaveLength(1);
  });
  it('keeps compensation and employee facts consistent when final approval races withdrawal', async () => {
    const { id, person } = await submit();
    await toHr(id);
    const detail = await service.detail(id, ids.hr);
    const offer = detail.taskActions.find((t) =>
      t.actions.some((a) => a.name === 'approve'),
    )!;
    const run = detail.runs.find((v) => v.run.id === offer.task.runId)!;
    const results = await Promise.allSettled([
      service.action(
        id,
        {
          action: 'approve',
          target: { taskId: offer.task.id },
          contentHash: run.run.contentHash,
          requestId: randomUUID(),
        },
        ids.hr,
        undefined,
        { gradeId: 'probation-grade', baseSalary: '12345.67' },
      ),
      service.transition(
        id,
        'withdraw',
        person.userId,
        detail.record.lifecycleVersion,
        randomUUID(),
      ),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const current = (await service.detail(id, ids.hr)).record;
    const c = app.testApp.application.container;
    const compensation = await c
      .resolve(databaseManagerToken)
      .repository('employeeCompensation')
      .findMany({ filter: { employeeId: person.id } });
    expect(['approved', 'withdrawn']).toContain(current.status);
    expect(compensation).toHaveLength(current.status === 'approved' ? 1 : 0);
    expect(
      (await c.resolve(employeeServiceToken).getById(person.id))?.status,
    ).toBe(current.status === 'approved' ? 'regular' : 'probation');
  });
  it('sends management grades to GM according to the frozen rank rule', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.repository('grades').createOne({
      values: {
        id: 'probation-manager-grade',
        code: 'P-M',
        title: 'Manager',
        rank: 5,
        active: true,
      },
    });
    const { id } = await submit();
    await toHr(id);
    await act(id, ids.hr, undefined, {
      gradeId: 'probation-manager-grade',
      baseSalary: '12345.67',
    });
    expect((await service.detail(id, ids.gm)).record.status).toBe('gm');
    await act(id, ids.gm);
    expect((await service.detail(id, ids.gm)).record.status).toBe('approved');
  });
});
