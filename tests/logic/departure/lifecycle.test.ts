import { replacementSource } from '../headcounts/replacement-source.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { workItemServiceToken } from '../../../server/providers/work-items/contract.js';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import {
  createDepartureService,
  type DepartureDependencies,
} from '../../../server/providers/departure/service.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import {
  calendarServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
  dictionaryServiceToken,
} from '../../../server/providers/platform/index.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { reimbursementServiceToken } from '../../../server/providers/reimbursement/index.js';
import {
  departureApprovalReassignmentToken,
  type DepartureApprovalReassignment,
} from '../../../server/providers/departure/contract.js';
import { loanLedgerServiceToken } from '../../../server/providers/loan-ledger/contract.js';
let app: OrgTestApp;
let service: ReturnType<typeof createDepartureService>;
let d: DepartureDependencies;
const ids: Record<string, string> = {};
let serial = 0;
let now = new Date('2026-10-11T01:00:00Z');
let reassignment: DepartureApprovalReassignment | undefined;
async function create(gradeId = 'departure-junior') {
  const user = (await app.createUser(`departure-worker-${++serial}`)).user;
  const employeeId = randomUUID();
  await d.db.repository('employees').createOne({
    values: {
      id: employeeId,
      code: employeeId,
      name: 'Departing worker',
      userId: user.id,
      managerId: 'departure-manager',
      gradeId,
      status: 'regular',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await app.organization.addMember(
    { departmentId: 'departure-department', userId: user.id, primary: true },
    { actorId: ids.hr },
  );
  const draft = await service.create(
    {
      departureType: 'resignation',
      reason: 'Career change',
      expectedLastWorkingDay: '2026-12-01',
      handoverUserId: ids.receiver,
    },
    user.id,
  );
  const id = String(draft.record.id);
  await service.transition(
    id,
    'submit',
    user.id,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  return { id, employeeId, applicantId: user.id };
}
async function approve(
  id: string,
  actor: string,
  input?: Record<string, unknown>,
) {
  const detail = await service.detail(id, actor);
  const offer = detail.taskActions.find((t) =>
    t.actions.some((action) => action.name === 'approve'),
  )!;
  expect(offer).toBeDefined();
  const run = detail.runs.find((run) => run.run.id === offer.task.runId)!;
  return service.action(
    id,
    {
      action: 'approve',
      target: { taskId: offer.task.id },
      requestId: randomUUID(),
      contentHash: run.run.contentHash,
      ...(input ? { input: { data: input } } : {}),
    },
    actor,
  );
}
async function toHandover() {
  const record = await create();
  await approve(record.id, ids.manager);
  await approve(record.id, ids.head);
  await approve(record.id, ids.hr, { lastWorkingDay: '2026-12-03' });
  return record;
}
async function work(
  id: string,
  kind: string,
  action: string,
  actor: string,
  input: Record<string, unknown> = {},
) {
  const item = (await service.detail(id, actor)).workItems.find(
    (row) => row.kind === kind,
  )!;
  return service.workAction(
    id,
    String(item.id),
    action,
    actor,
    Number(item.lifecycleVersion),
    randomUUID(),
    input,
  );
}
describe('departure actual approval and independent handover lifecycle', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    d = {
      db: c.resolve(databaseManagerToken),
      clock: () => now,
      organization: c.resolve(organizationServiceToken),
      reassignment: () => reassignment,
      org: c.resolve(orgServiceToken),
      employees: c.resolve(employeeServiceToken),
      audit: c.resolve(auditServiceToken),
      users: c.resolve(userAdministrationServiceToken),
      directory: c.resolve(approvalDirectoryServiceToken),
      calendar: c.resolve(calendarServiceToken),
      rules: c.resolve(ruleServiceToken),
      sequences: c.resolve(sequenceServiceToken),
      dictionaries: c.resolve(dictionaryServiceToken),
      loans: c.resolve(loanLedgerServiceToken),
    };
    for (const name of [
      'manager',
      'head',
      'hr',
      'gm',
      'receiver',
      'it',
      'admin',
      'finance',
      'financeOther',
      'outsider',
    ]) {
      ids[name] = (await app.createUser(`departure-${name}`)).user.id;
      await d.db.repository('employees').createOne({
        values: {
          id: `departure-${name}`,
          code: `D-${name}`,
          name,
          userId: ids[name],
          status: 'regular',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    await d.db.repository('departments').createOne({
      values: {
        id: 'departure-department',
        title: 'Departure department',
        managerId: ids.head,
        active: true,
      },
    });
    await d.db.repository('grades').createOne({
      values: {
        id: 'departure-junior',
        code: 'D-J',
        title: 'Junior',
        rank: 1,
        active: true,
      },
    });
    await d.db.repository('grades').createOne({
      values: {
        id: 'departure-high',
        code: 'D-H',
        title: 'Manager',
        rank: 9,
        active: true,
      },
    });
    for (const role of ['hr', 'gm', 'it', 'admin', 'finance']) {
      await d.db.repository('dutyRoleMembers').createOne({
        values: {
          id: randomUUID(),
          dutyRoleCode: role,
          userId: ids[role],
          active: true,
        },
      });
    }
    await d.db.repository('dutyRoleMembers').createOne({
      values: {
        id: randomUUID(),
        dutyRoleCode: 'finance',
        userId: ids.financeOther,
        active: true,
      },
    });
    service = createDepartureService(d);
    await service.initialize();
  }, 120000);
  afterAll(async () => app?.close());
  it('requires real HR lastWorkingDay and applies leaving with four independent work items in one transaction', async () => {
    const r = await create();
    await approve(r.id, ids.manager);
    await approve(r.id, ids.head);
    await expect(approve(r.id, ids.hr)).rejects.toThrow();
    expect((await service.detail(r.id, ids.hr)).record.status).toBe('hr');
    await approve(r.id, ids.hr, { lastWorkingDay: '2026-12-03' });
    expect(await d.employees.getById(r.employeeId)).toMatchObject({
      status: 'leaving',
      lastWorkingDay: '2026-12-03',
    });
    const detail = await service.detail(r.id, ids.hr);
    expect(detail.record).toMatchObject({
      status: 'handover',
      hrInterviewCompleted: true,
      lastWorkingDay: '2026-12-03',
    });
    expect(detail.workItems.map((item) => item.kind).sort()).toEqual([
      'admin',
      'finance',
      'it',
      'work',
    ]);
    expect(detail.workItems.every((item) => item.status === 'open')).toBe(true);
    await expect(
      service.transition(
        r.id,
        'withdraw',
        r.applicantId,
        Number(detail.record.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toThrow();
  });
  it('rolls the employee status and all work-item creation back when a handover audit fails', async () => {
    const r = await create();
    await approve(r.id, ids.manager);
    await approve(r.id, ids.head);
    const actual = d.audit;
    const failing = createDepartureService({
      ...d,
      audit: {
        ...actual,
        record: async (entry, tx) => {
          await actual.record(entry, tx);
          if (entry.targetType === 'departureWorkItems')
            throw new Error('handover audit failure');
        },
      },
    });
    await failing.initialize();
    const previous = service;
    service = failing;
    try {
      await expect(
        approve(r.id, ids.hr, { lastWorkingDay: '2026-12-03' }),
      ).rejects.toThrow('handover audit failure');
    } finally {
      service = previous;
    }
    expect((await d.employees.getById(r.employeeId))?.status).toBe('regular');
    expect((await service.detail(r.id, ids.hr)).record.status).toBe('hr');
    expect(
      await d.db
        .repository('departureWorkItems')
        .findMany({ filter: { departureId: r.id } }),
    ).toHaveLength(0);
  });
  it('allows only one eligible pool claimant under a concurrent attempt', async () => {
    const r = await toHandover();
    const item = (await service.detail(r.id, ids.hr)).workItems.find(
      (row) => row.kind === 'finance',
    )!;
    const outcomes = await Promise.allSettled(
      [ids.finance, ids.financeOther].map((actor) =>
        service.workAction(
          r.id,
          String(item.id),
          'claim',
          actor,
          Number(item.lifecycleVersion),
          randomUUID(),
        ),
      ),
    );
    expect(
      outcomes.filter((outcome) => outcome.status === 'fulfilled'),
    ).toHaveLength(1);
    const fresh = (await service.detail(r.id, ids.hr)).workItems.find(
      (row) => row.kind === 'finance',
    )!;
    expect([ids.finance, ids.financeOther]).toContain(fresh.claimedById);
    expect(fresh.status).toBe('claimed');
  });
  it('requires manager checklist and independent recipient receipt before work completion', async () => {
    const r = await toHandover();
    await work(r.id, 'work', 'claim', ids.manager);
    await work(r.id, 'work', 'confirmChecklist', ids.manager, {
      confirmed: true,
    });
    await expect(
      work(r.id, 'work', 'complete', ids.manager),
    ).rejects.toMatchObject({ code: 'DEPARTURE_RECEIPT_REQUIRED' });
    await expect(
      work(r.id, 'work', 'acknowledgeReceipt', r.applicantId, {
        received: true,
      }),
    ).rejects.toThrow();
    await work(r.id, 'work', 'acknowledgeReceipt', ids.receiver, {
      received: true,
    });
    await work(r.id, 'work', 'complete', ids.manager);
    expect(
      (await service.detail(r.id, ids.hr)).workItems.find(
        (row) => row.kind === 'work',
      )?.status,
    ).toBe('completed');
  });
  it('blocks missing asset and reimbursement adapters; HR force records an exemption without false clearance', async () => {
    const r = await toHandover();
    for (const [kind, actor, reason] of [
      ['admin', ids.admin, 'DEPARTURE_ASSET_SERVICE_UNAVAILABLE'],
      ['finance', ids.finance, 'DEPARTURE_REIMBURSEMENT_SERVICE_UNAVAILABLE'],
    ]) {
      await work(r.id, kind, 'claim', actor);
      await work(r.id, kind, 'confirmChecklist', actor, { confirmed: true });
      await expect(work(r.id, kind, 'complete', actor)).rejects.toMatchObject({
        code: reason,
      });
      await expect(work(r.id, kind, 'forceComplete', ids.hr)).rejects.toThrow();
      await work(r.id, kind, 'forceComplete', ids.hr, {
        reason:
          'Documented manual exemption; underlying clearance remains unresolved',
      });
      expect(
        (await service.detail(r.id, ids.hr)).workItems.find(
          (row) => row.kind === kind,
        ),
      ).toMatchObject({
        status: 'completed',
        forcedById: ids.hr,
        forceReason:
          'Documented manual exemption; underlying clearance remains unresolved',
      });
    }
  });

  it('freezes employee grade rank and requires GM despite a later grade edit', async () => {
    const r = await create('departure-high');
    await approve(r.id, ids.manager);
    await approve(r.id, ids.head);
    await app.organization.updateGrade(
      'departure-high',
      { rank: 1 },
      { actorId: ids.hr },
    );
    await approve(r.id, ids.hr, { lastWorkingDay: '2026-12-03' });
    const waiting = await service.detail(r.id, ids.gm);
    expect(waiting.record).toMatchObject({
      status: 'gm',
      gradeRank: 9,
      hrInterviewCompleted: true,
    });
    expect((await d.employees.getById(r.employeeId))?.status).toBe('regular');
    await expect(
      service.transition(
        r.id,
        'withdraw',
        r.applicantId,
        Number(waiting.record.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toThrow();
    await approve(r.id, ids.gm);
    expect((await d.employees.getById(r.employeeId))?.status).toBe('leaving');
  });
  it('merges only the actual original manager decision when manager and head are identical', async () => {
    await app.organization.updateDepartment(
      'departure-department',
      { managerId: ids.manager },
      { actorId: ids.hr },
    );
    try {
      const r = await create();
      await approve(r.id, ids.manager);
      const detail = await service.detail(r.id, ids.hr);
      expect(detail.record).toMatchObject({
        status: 'hr',
        headMerged: { personId: ids.manager, stages: ['manager', 'head'] },
      });
      expect(
        detail.runs
          .flatMap((run) => run.tasks)
          .some((task) => task.stage === 'head'),
      ).toBe(false);
    } finally {
      await app.organization.updateDepartment(
        'departure-department',
        { managerId: ids.head },
        { actorId: ids.hr },
      );
    }
  });
  it('does not allow a direct approval outcome or foreign approval target', async () => {
    const first = await create(),
      second = await create();
    const detail = await service.detail(second.id, ids.manager),
      offer = detail.taskActions.find((row) =>
        row.actions.some((action) => action.name === 'approve'),
      )!;
    await expect(
      service.runtime.fire('oa.departure', first.id, 'managerApproved', {
        manual: true,
        actor: { id: ids.manager },
        requestId: randomUUID(),
      }),
    ).rejects.toThrow();
    await expect(
      service.action(
        first.id,
        {
          action: 'approve',
          target: { taskId: offer.task.id },
          requestId: randomUUID(),
        },
        ids.manager,
      ),
    ).rejects.toMatchObject({ code: 'DEPARTURE_TARGET_MISMATCH' });
    expect((await service.detail(first.id, ids.manager)).record.status).toBe(
      'manager',
    );
  });
  it('does not settle while any handover is unfinished and stores HR settlement after explicit exemptions', async () => {
    const r = await toHandover();
    const detail = await service.detail(r.id, ids.hr);
    expect(
      detail.view.available.find((offer) => offer.name === 'settle'),
    ).toMatchObject({ allowed: false });
    await expect(
      service.transition(
        r.id,
        'settle',
        ids.hr,
        Number(detail.record.lifecycleVersion),
        randomUUID(),
        { settlementDate: '2026-12-03', settlementNote: 'Final settlement' },
      ),
    ).rejects.toMatchObject({ code: 'DEPARTURE_HANDOVER_INCOMPLETE' });
    for (const kind of ['work', 'it', 'admin', 'finance'])
      await work(r.id, kind, 'forceComplete', ids.hr, {
        reason: 'Authorized exception with remaining obligations documented',
      });
    const fresh = await service.detail(r.id, ids.hr);
    expect(
      fresh.view.available.find((offer) => offer.name === 'settle'),
    ).toMatchObject({ allowed: true });
    expect(
      (await service.detail(r.id, r.applicantId)).view.available.find(
        (offer) => offer.name === 'settle',
      ),
    ).toMatchObject({ allowed: false });
    await service.transition(
      r.id,
      'settle',
      ids.hr,
      Number(fresh.record.lifecycleVersion),
      randomUUID(),
      {
        settlementDate: '2026-12-03',
        settlementNote: 'Final settlement with documented exceptions',
      },
    );
    expect((await service.detail(r.id, ids.hr)).record).toMatchObject({
      status: 'completed',
      settlementDate: '2026-12-03',
      settlementNote: 'Final settlement with documented exceptions',
    });
    expect((await d.employees.getById(r.employeeId))?.status).toBe('leaving');
  });
  it('clears finance only with the real reimbursement public contract and refuses newly drafted claims', async () => {
    const r = await toHandover();
    await work(r.id, 'finance', 'claim', ids.finance);
    await work(r.id, 'finance', 'confirmChecklist', ids.finance, {
      confirmed: true,
    });
    const c = app.testApp.application.container;
    const clearing = createDepartureService({
      ...d,
      finances: () => ({
        assertReimbursementsCleared: (applicantId, connection) =>
          c
            .resolve(reimbursementServiceToken)
            .assertDepartureCleared(applicantId, connection),
      }),
    });
    await clearing.initialize();
    const reimbursement = c.resolve(reimbursementServiceToken);
    const claim = (
      await reimbursement.create(
        {
          reason: 'Final expense',
          authorizationId: null,
          loanId: null,
          offsetCents: 0,
          overrunReason: '',
          lines: [
            {
              id: randomUUID(),
              category: 'other',
              date: '2026-10-11',
              amountCents: 100,
              invoiceNumber: randomUUID(),
              attachmentIds: [randomUUID()],
              standardExceptionReason: '',
            },
          ],
        },
        r.applicantId,
      )
    ).record;
    const previous = service;
    service = clearing;
    try {
      await expect(
        work(r.id, 'finance', 'complete', ids.finance),
      ).rejects.toMatchObject({ code: 'REIMBURSEMENT_DEPARTURE_NOT_CLEARED' });
      await reimbursement.transition(
        String(claim.id),
        'withdraw',
        r.applicantId,
        Number(claim.lifecycleVersion),
        randomUUID(),
      );
      await work(r.id, 'finance', 'complete', ids.finance);
      expect(
        (await service.detail(r.id, ids.hr)).workItems.find(
          (item) => item.kind === 'finance',
        )?.status,
      ).toBe('completed');
    } finally {
      service = previous;
    }
  });
  it('executes through the registered real reassignment adapter before disabling the departing user', async () => {
    const departing = await toHandover();
    const maintenanceAdmin = (await app.admin()).user.id;
    const maintenanceEmployee = randomUUID();
    await d.db.repository('employees').createOne({
      values: {
        id: maintenanceEmployee,
        code: maintenanceEmployee,
        userId: maintenanceAdmin,
        name: 'Actual approval administrator',
        status: 'regular',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const ordinary =
      app.testApp.application.container.resolve(workItemServiceToken);
    const unrestricted = {
      read: true,
      create: true,
      update: true,
      delete: true,
    };
    const draft = await d.db.transaction((tx) =>
      ordinary.save(
        {
          actorId: departing.applicantId,
          requestId: randomUUID(),
          title: 'Departing creator confirmation obligation',
          description: 'Preserve actual completed result',
          targetUserId: ids.receiver,
          dutyRoleCode: null,
          requiresConfirmation: true,
          dueAt: '2026-12-04T00:00:00Z',
          attachments: [],
        },
        tx,
        unrestricted,
      ),
    );
    const assigned = await d.db.transaction((tx) =>
      ordinary.act(
        {
          id: draft.id,
          actorId: departing.applicantId,
          requestId: randomUUID(),
          expectedVersion: draft.version,
          action: 'dispatch',
        },
        tx,
        unrestricted,
      ),
    );
    const awaiting = await d.db.transaction((tx) =>
      ordinary.act(
        {
          id: draft.id,
          actorId: ids.receiver,
          requestId: randomUUID(),
          expectedVersion: assigned.version,
          action: 'complete',
          result: 'Actual handover result',
        },
        tx,
        unrestricted,
      ),
    );
    const subordinate = await create();
    await d.db.repository('employees').updateOne({
      filter: { id: subordinate.employeeId },
      values: { managerId: departing.employeeId },
    });
    // Return and resubmit through the public lifecycle so the pending manager is genuinely the departing person.
    const offered = (
      await service.detail(subordinate.id, ids.manager)
    ).taskActions.find((row) =>
      row.actions.some((action) => action.name === 'return'),
    )!;
    await service.action(
      subordinate.id,
      {
        target: { taskId: offered.task.id },
        action: 'return',
        requestId: randomUUID(),
        comment: 'Refresh reporting line',
        input: { to: 'revision' },
      },
      ids.manager,
    );
    const revision = (
      await service.detail(subordinate.id, subordinate.applicantId)
    ).record;
    await service.transition(
      subordinate.id,
      'submit',
      subordinate.applicantId,
      revision.lifecycleVersion,
      randomUUID(),
    );
    expect(
      (
        await service.detail(subordinate.id, departing.applicantId)
      ).taskActions.some(
        (row) => row.task.assigneeId === departing.applicantId,
      ),
    ).toBe(true);
    reassignment = app.testApp.application.container.resolve(
      departureApprovalReassignmentToken,
    );
    now = new Date('2026-12-03T01:00:00Z');
    // approval.admin alone cannot move ordinary confirmation rights.
    await service.reconcile(now);
    expect((await service.detail(departing.id, ids.hr)).execution?.status).toBe(
      'blocked',
    );
    expect((await d.users.get(departing.applicantId))?.disabledAt).toBeNull();
    expect(
      (await d.db.repository('workItems').findOne({ filter: { id: draft.id } }))
        ?.confirmationOwnerUserId,
    ).toBe(departing.applicantId);
    await app.organization.addDutyRoleMember('admin', maintenanceAdmin, {
      actorId: ids.hr,
    });
    await service.reconcile(now);
    expect(
      (await service.detail(departing.id, ids.hr)).execution,
    ).toMatchObject({ status: 'executed', failureCode: null });
    expect(
      (await d.users.get(departing.applicantId))?.disabledAt,
    ).not.toBeNull();
    const moved = await ordinary.get(
      draft.id,
      ids.manager,
      d.db.connection(),
      unrestricted,
    );
    expect(moved).toMatchObject({
      creatorUserId: departing.applicantId,
      confirmationOwnerUserId: ids.manager,
      status: 'awaitingConfirmation',
      result: 'Actual handover result',
      assigneeUserId: ids.receiver,
      version: awaiting.version + 1,
    });
    const confirmed = await d.db.transaction((tx) =>
      ordinary.act(
        {
          id: draft.id,
          actorId: ids.manager,
          requestId: randomUUID(),
          expectedVersion: moved!.version,
          action: 'confirm',
        },
        tx,
        unrestricted,
      ),
    );
    expect(confirmed.status).toBe('completed');
    expect(
      (await service.detail(subordinate.id, ids.manager)).taskActions.some(
        (row) =>
          row.task.assigneeId === ids.manager &&
          row.actions.some((action) => action.name === 'approve'),
      ),
    ).toBe(true);
    reassignment = undefined;
    now = new Date('2026-10-11T01:00:00Z');
  });
  it('keeps the account and memberships active while real ordinary work remains', async () => {
    const r = await toHandover();
    const work =
      app.testApp.application.container.resolve(workItemServiceToken);
    const draft = await d.db.connection().transaction((tx) =>
      work.save(
        {
          actorId: ids.hr,
          requestId: randomUUID(),
          title: 'Outstanding departure work',
          description: 'Real ordinary work owner',
          targetUserId: r.applicantId,
          dutyRoleCode: null,
          dueAt: '2026-12-10T00:00:00Z',
          requiresConfirmation: true,
          attachments: [],
        },
        tx,
      ),
    );
    const assigned = await d.db.connection().transaction((tx) =>
      work.act(
        {
          actorId: ids.hr,
          requestId: randomUUID(),
          id: draft.id,
          expectedVersion: draft.version,
          action: 'dispatch',
        },
        tx,
      ),
    );
    reassignment = { reassign: async () => ({ remaining: 0 }) };
    const guarded = createDepartureService({
      ...d,
      ordinaryWork: {
        async assertCleared(userId, tx) {
          if ((await work.departureBlockers(userId, tx)).remaining !== 0)
            throw new Error('DEPARTURE_ORDINARY_WORK_INCOMPLETE');
        },
      },
    });
    await guarded.initialize();
    now = new Date('2026-12-03T01:00:00Z');
    await guarded.reconcile(now);
    expect((await guarded.detail(r.id, ids.hr)).execution).toMatchObject({
      status: 'blocked',
      failureCode: 'DEPARTURE_ORDINARY_WORK_INCOMPLETE',
    });
    expect((await d.users.get(r.applicantId))?.disabledAt).toBeNull();
    expect((await d.employees.getById(r.employeeId))?.status).toBe('leaving');
    expect(
      await app.organization.membershipsOf(r.applicantId),
    ).not.toHaveLength(0);
    await d.db.connection().transaction((tx) =>
      work.act(
        {
          actorId: ids.hr,
          requestId: randomUUID(),
          id: assigned.id,
          expectedVersion: assigned.version,
          action: 'cancel',
          reason: 'Work handed over outside this assignment',
        },
        tx,
      ),
    );
    await guarded.reconcile(now);
    expect((await guarded.detail(r.id, ids.hr)).execution?.status).toBe(
      'executed',
    );
    expect((await d.users.get(r.applicantId))?.disabledAt).not.toBeNull();
    reassignment = undefined;
    now = new Date('2026-10-11T01:00:00Z');
  });
  it('blocks missing reassignment, rolls back account/member/status on finalization failure, then retries idempotently', async () => {
    const r = await toHandover();
    const execution = (await service.detail(r.id, ids.hr)).execution!;
    expect(execution.status).toBe('ready');
    expect(await service.reconcile(now)).toMatchObject({ executed: 0 });
    now = new Date('2026-12-03T01:00:00Z');
    await service.reconcile(now);
    expect((await service.detail(r.id, ids.hr)).execution).toMatchObject({
      status: 'blocked',
      failureCode: 'DEPARTURE_REASSIGNMENT_UNAVAILABLE',
    });
    expect((await d.users.get(r.applicantId))?.disabledAt).toBeNull();
    reassignment = { reassign: async () => ({ remaining: 0 }) };
    const actual = d.employees;
    const failing = createDepartureService({
      ...d,
      employees: {
        ...actual,
        applyStatusChange: async (...args) => {
          await actual.applyStatusChange(...args);
          throw new Error('fail after status');
        },
      },
    });
    await failing.initialize();
    await failing.reconcile(now);
    expect((await d.users.get(r.applicantId))?.disabledAt).toBeNull();
    expect((await actual.getById(r.employeeId))?.status).toBe('leaving');
    expect(
      (await app.organization.membershipsOf(r.applicantId)).length,
    ).toBeGreaterThan(0);
    await service.reconcile(now);
    expect((await d.users.get(r.applicantId))?.disabledAt).not.toBeNull();
    expect(await actual.getById(r.employeeId)).toMatchObject({
      status: 'left',
      active: false,
    });
    expect(await app.organization.membershipsOf(r.applicantId)).toHaveLength(0);
    expect((await service.detail(r.id, ids.hr)).execution?.status).toBe(
      'executed',
    );
    const auditsBefore = await d.db
      .repository('auditLogs')
      .count({ filter: { action: 'departure.execute', targetId: r.id } });
    await service.reconcile(now);
    expect(
      await d.db
        .repository('auditLogs')
        .count({ filter: { action: 'departure.execute', targetId: r.id } }),
    ).toBe(auditsBefore);
    now = new Date('2026-10-11T01:00:00Z');
    reassignment = undefined;
  });
  it('actual departure releases real occupancy only after left, rolls back on audit failure, and replays once', async () => {
    const r = await toHandover();
    const headcounts = app.testApp.application.container.resolve(
      headcountServiceToken,
    );
    const position = await app.organization.createPosition(
      { code: randomUUID(), title: 'Departure capacity' },
      { actorId: ids.hr },
    );
    await d.db.repository('employees').updateMany({
      filter: { id: r.employeeId },
      values: { positionId: position.id },
    });
    const command = (requestKey = randomUUID()) => ({
      actorId: ids.hr,
      requestKey,
      reason: 'Departure capacity test',
    });
    const account = await d.db.transaction((tx) =>
      headcounts.create(
        {
          ...command(),
          departmentId: 'departure-department',
          positionId: position.id,
          year: 2026,
          limit: 1,
        },
        tx,
      ),
    );
    await d.db.transaction((tx) =>
      headcounts.reconcile(
        {
          ...command(),
          accountId: account.id,
          expectedVersion: account.version,
          employeeIds: [r.employeeId],
        },
        tx,
      ),
    );
    const guarded = createDepartureService({ ...d, headcounts });
    await guarded.initialize();
    reassignment = { reassign: async () => ({ remaining: 0 }) };
    expect(
      await headcounts.balance(account.id, d.db.connection()),
    ).toMatchObject({ used: 1, available: 0 });
    expect(await guarded.reconcile(now)).toMatchObject({ executed: 0 });
    now = new Date('2026-12-03T01:00:00Z');
    const spy = vi
      .spyOn(d.audit, 'record')
      .mockImplementation(async (entry) => {
        if (entry.action === 'departure.execute')
          throw new Error('departure audit rollback');
      });
    await guarded.reconcile(now);
    spy.mockRestore();
    expect((await d.employees.getById(r.employeeId))?.status).toBe('leaving');
    expect((await d.users.get(r.applicantId))?.disabledAt).toBeNull();
    expect(
      await headcounts.balance(account.id, d.db.connection()),
    ).toMatchObject({ used: 1, available: 0 });
    await guarded.reconcile(now);
    expect((await d.employees.getById(r.employeeId))?.status).toBe('left');
    expect(
      await headcounts.balance(account.id, d.db.connection()),
    ).toMatchObject({ used: 0, available: 1 });
    const count = await d.db
      .repository('headcountJournal')
      .count({ filter: { accountId: account.id, action: 'releaseEmployee' } });
    await guarded.reconcile(now);
    expect(
      await d.db.repository('headcountJournal').count({
        filter: { accountId: account.id, action: 'releaseEmployee' },
      }),
    ).toBe(count);
    now = new Date('2026-10-11T01:00:00Z');
    reassignment = undefined;
  });
  it('HR cancellation needs another HR confirmation, preserves used, blocks replacements and cancels pending execution', async () => {
    const hr2 = (await app.createUser('departure-cancel-confirmation')).user;
    await d.db.repository('employees').createOne({
      values: {
        id: randomUUID(),
        code: randomUUID(),
        name: 'Confirming HR',
        userId: hr2.id,
        status: 'regular',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await app.organization.addDutyRoleMember('hr', hr2.id, { actorId: ids.hr });
    const r = await toHandover();
    const headcounts = app.testApp.application.container.resolve(
      headcountServiceToken,
    );
    const position = await app.organization.createPosition(
      { code: randomUUID(), title: 'Cancellation capacity' },
      { actorId: ids.hr },
    );
    await d.db.repository('employees').updateMany({
      filter: { id: r.employeeId },
      values: { positionId: position.id },
    });
    const command = () => ({
      actorId: ids.hr,
      requestKey: randomUUID(),
      reason: 'Cancel replacement',
    });
    const account = await d.db.transaction((tx) =>
      headcounts.create(
        {
          ...command(),
          departmentId: 'departure-department',
          positionId: position.id,
          year: 2026,
          limit: 1,
        },
        tx,
      ),
    );
    await d.db.transaction((tx) =>
      headcounts.reconcile(
        {
          ...command(),
          accountId: account.id,
          expectedVersion: account.version,
          employeeIds: [r.employeeId],
        },
        tx,
      ),
    );
    const source = await replacementSource(d.db.connection(), {
      applicantId: ids.hr,
      departmentId: 'departure-department',
      positionId: position.id,
      accountId: account.id,
      year: 2026,
      employeeId: r.employeeId,
      hrId: hr2.id,
    });
    await d.db.transaction((tx) =>
      headcounts.hold(
        {
          ...command(),
          ...source,
          accountId: account.id,
          quantity: 1,
          replacementEmployeeIds: [r.employeeId],
        },
        tx,
      ),
    );
    const originalService = service;
    service = createDepartureService({ ...d, headcounts });
    await service.initialize();
    const before = (await service.detail(r.id, ids.hr)).record;
    await expect(
      service.transition(
        r.id,
        'requestCancellation',
        r.applicantId,
        before.lifecycleVersion,
        randomUUID(),
        { reason: 'Keep employment' },
      ),
    ).rejects.toThrow();
    await service.transition(
      r.id,
      'requestCancellation',
      ids.hr,
      before.lifecycleVersion,
      randomUUID(),
      { reason: 'Keep employment' },
    );
    const requested = await service.detail(r.id, ids.hr);
    expect(requested.record.reason).toBe(before.reason);
    expect(requested.record.cancellationReason).toBe('Keep employment');
    expect((await d.employees.getById(r.employeeId))?.status).toBe('leaving');
    expect(
      (await service.detail(r.id, ids.hr)).taskActions.some((row) =>
        row.actions.some((a) => a.name === 'approve'),
      ),
    ).toBe(false);
    now = new Date('2026-12-03T01:00:00Z');
    reassignment = { reassign: async () => ({ remaining: 0 }) };
    expect(await service.reconcile(now)).toMatchObject({ executed: 0 });
    const scoped = await service.detail(r.id, hr2.id);
    const offered = scoped.taskActions.find((row) =>
      row.actions.some((a) => a.name === 'approve'),
    )!;
    const run = scoped.runs.find((row) => row.run.id === offered.task.runId)!;
    await expect(
      service.action(
        r.id,
        {
          target: { taskId: offered.task.id },
          action: 'approve',
          requestId: randomUUID(),
          contentHash: run.run.contentHash,
        },
        hr2.id,
        undefined,
        {
          read: { fields: '*' },
          create: false,
          update: {
            fields: '*',
            scope: (f) => f.string('id').eq('another-departure-record'),
          },
          delete: false,
        },
      ),
    ).rejects.toThrow();
    expect((await service.detail(r.id, hr2.id)).record.status).toBe(
      'cancellationReview',
    );
    const spy = vi
      .spyOn(d.audit, 'record')
      .mockImplementation(async (entry) => {
        if (entry.action === 'departure.cancelled')
          throw new Error('cancellation rollback');
      });
    await expect(approve(r.id, hr2.id)).rejects.toThrow(
      'cancellation rollback',
    );
    spy.mockRestore();
    expect((await d.employees.getById(r.employeeId))?.status).toBe('leaving');
    expect(
      await headcounts.reservation(source, d.db.connection()),
    ).toMatchObject({ blocked: 0 });
    expect(
      await d.db
        .repository('headcountReplacementNotices')
        .count({ filter: { sourceId: source.sourceId } }),
    ).toBe(0);
    await approve(r.id, hr2.id);
    expect((await service.detail(r.id, ids.hr)).record.status).toBe(
      'cancelled',
    );
    expect((await d.employees.getById(r.employeeId))?.status).toBe('regular');
    expect(
      await headcounts.balance(account.id, d.db.connection()),
    ).toMatchObject({ used: 1, available: 0, replacementBlocked: 1 });
    expect(
      await headcounts.reservation(source, d.db.connection()),
    ).toMatchObject({ blocked: 1 });
    expect((await service.detail(r.id, ids.hr)).execution?.status).toBe(
      'cancelled',
    );
    expect((await d.users.get(r.applicantId))?.disabledAt).toBeNull();
    const notices = await d.db
      .repository<{ recipients: string[] }>('headcountReplacementNotices')
      .findMany({ filter: { sourceId: source.sourceId } });
    expect(notices).toHaveLength(1);
    expect(notices[0].recipients).toContain(ids.hr);
    expect(notices[0].recipients).toContain(hr2.id);
    service = originalService;
    now = new Date('2026-10-11T01:00:00Z');
    reassignment = undefined;
  });
  it('cancellation rejection resumes the precise GM or settled state and refuses legacy or actual-left records', async () => {
    const peer = (await app.createUser('departure-cancellation-rejector')).user;
    await d.db.repository('employees').createOne({
      values: {
        id: randomUUID(),
        code: randomUUID(),
        name: 'Cancellation rejector',
        userId: peer.id,
        status: 'regular',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await app.organization.addDutyRoleMember('hr', peer.id, {
      actorId: ids.hr,
    });
    const cancellationGrade = randomUUID();
    await d.db.repository('grades').createOne({
      values: {
        id: cancellationGrade,
        code: randomUUID(),
        title: 'Cancellation high grade',
        rank: 9,
        active: true,
      },
    });
    const senior = await create(cancellationGrade);
    await approve(senior.id, ids.manager);
    await approve(senior.id, ids.head);
    await approve(senior.id, ids.hr, { lastWorkingDay: '2026-12-03' });
    const settled = await toHandover();
    for (const kind of ['work', 'it', 'admin', 'finance'])
      await work(settled.id, kind, 'forceComplete', ids.hr, {
        reason: 'Existing HR settlement exemption',
      });
    const handover = (await service.detail(settled.id, ids.hr)).record;
    await service.transition(
      settled.id,
      'settle',
      ids.hr,
      handover.lifecycleVersion,
      randomUUID(),
      { settlementDate: '2026-12-03', settlementNote: 'Preserved settlement' },
    );
    for (const [r, state] of [
      [senior, 'gm'],
      [settled, 'completed'],
    ] as const) {
      const before = (await service.detail(r.id, ids.hr)).record;
      expect(before.status).toBe(state);
      await service.transition(
        r.id,
        'requestCancellation',
        ids.hr,
        before.lifecycleVersion,
        randomUUID(),
        { reason: 'Review employment retention' },
      );
      const detail = await service.detail(r.id, peer.id);
      const offer = detail.taskActions.find((row) =>
        row.actions.some((a) => a.name === 'reject'),
      )!;
      const run = detail.runs.find((row) => row.run.id === offer.task.runId)!;
      await service.action(
        r.id,
        {
          target: { taskId: offer.task.id },
          action: 'reject',
          requestId: randomUUID(),
          comment: 'Continue original departure',
          contentHash: run.run.contentHash,
        },
        peer.id,
      );
      const restored = (await service.detail(r.id, ids.hr)).record;
      expect(restored.status).toBe(state);
      if (state === 'completed')
        expect(restored.settlementNote).toBe('Preserved settlement');
    }
    const legacy = await toHandover();
    await d.db.repository('departureRequests').updateMany({
      filter: { id: legacy.id },
      values: { originalEmployeeStatus: null },
    });
    const record = (await service.detail(legacy.id, ids.hr)).record;
    await expect(
      service.transition(
        legacy.id,
        'requestCancellation',
        ids.hr,
        record.lifecycleVersion,
        randomUUID(),
        { reason: 'No frozen original status' },
      ),
    ).rejects.toThrow();
    await d.db.transaction((tx) =>
      d.employees.applyStatusChange(
        {
          employeeId: settled.employeeId,
          status: 'left',
          active: false,
          kind: 'departure',
          effectiveAt: '2026-12-03',
        },
        { actorId: ids.hr },
        tx,
      ),
    );
    const left = (await service.detail(settled.id, ids.hr)).record;
    await expect(
      service.transition(
        settled.id,
        'requestCancellation',
        ids.hr,
        left.lifecycleVersion,
        randomUUID(),
        { reason: 'Cannot restore actual-left worker' },
      ),
    ).rejects.toThrow();
  });
});
