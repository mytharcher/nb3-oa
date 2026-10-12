// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { startOrgTestApp, json, type OrgTestApp } from '../org/helpers.ts';
import {
  leaveServiceToken,
  type LeaveService,
} from '../../../server/providers/leave/service.ts';
import {
  cancellationServiceToken,
  CANCELLATION_LIFECYCLE,
  type CancellationService,
} from '../../../server/providers/leave-cancellations/service.ts';
import {
  leaveBalanceServiceToken,
  type LeaveBalanceService,
} from '../../../server/providers/leave-balances/contract.ts';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.ts';
let app: OrgTestApp,
  db: DatabaseManager,
  leave: LeaveService,
  cancellations: CancellationService,
  balances: LeaveBalanceService;
let applicant: string, manager: string;
let ownerSession: TestSession;
let serial = 0;
async function approve(
  service: LeaveService | CancellationService,
  id: string,
) {
  const detail = await service.detail(id, manager);
  const run = detail.runs.at(-1)!;
  const task = run.tasks.find((t) => t.assigneeId === manager)!;
  return service.action(
    id,
    {
      target: { taskId: task.id },
      action: 'approve',
      contentHash: run.run.contentHash,
      requestId: `decision-${serial++}`,
    },
    manager,
  );
}
async function approvedLeave(
  startDate: string,
  endDate = startDate,
  enableDelegation = false,
) {
  const draft = await leave.create(
    {
      leaveType: 'annual',
      startDate,
      endDate,
      startHalf: 'am',
      endHalf: 'pm',
      reason: 'Holiday',
      attachments: [],
      handoverUserId: enableDelegation ? manager : null,
      enableDelegation,
    },
    applicant,
  );
  const id = String(draft.record.id);
  await leave.transition(
    id,
    'submit',
    applicant,
    Number(draft.record.lifecycleVersion),
    `submit-${serial++}`,
  );
  await approve(leave, id);
  return id;
}
async function submittedCancellation(
  id: string,
  cancelAll: boolean,
  endDate: string,
) {
  const draft = await cancellations.create(
    {
      originalLeaveId: id,
      cancelAll,
      endDate,
      endHalf: 'pm',
      reason: 'Plans changed',
    },
    applicant,
  );
  const cancellationId = String(draft.record.id);
  await cancellations.transition(
    cancellationId,
    'submit',
    applicant,
    Number(draft.record.lifecycleVersion),
    `cancel-submit-${serial++}`,
  );
  return cancellationId;
}
describe('leave cancellation transaction', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    db = c.resolve(databaseManagerToken);
    leave = c.resolve(leaveServiceToken);
    cancellations = c.resolve(cancellationServiceToken);
    balances = c.resolve(leaveBalanceServiceToken);
    ownerSession = await app.createUser('CancellationApplicant');
    applicant = ownerSession.user.id;
    manager = (await app.createUser('CancellationManager')).user.id;
    const now = new Date().toISOString();
    for (const [id, userId, managerId] of [
      ['cancellation-manager', manager, null],
      ['cancellation-applicant', applicant, 'cancellation-manager'],
    ] as const)
      await db.repository('employees').createOne({
        values: {
          id,
          userId,
          managerId,
          code: id,
          name: id,
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    await db.transaction((tx) =>
      balances.grant(
        {
          employeeId: 'cancellation-applicant',
          leaveType: 'annual',
          units: 40,
          reference: 'test-grant',
          requestKey: 'test-grant',
        },
        tx,
      ),
    );
  }, 120000);
  afterAll(async () => app?.close());
  it('refunds shortened leave, corrects attendance, invalidates delegation and preserves original approval', async () => {
    const id = await approvedLeave('2027-01-04', '2027-01-05', true);
    const before = await balances.balance({
      employeeId: 'cancellation-applicant',
      leaveType: 'annual',
    });
    const cancellationId = await submittedCancellation(id, false, '2027-01-04');
    await expect(
      cancellations.runtime.fire(
        CANCELLATION_LIFECYCLE,
        cancellationId,
        'managerApproved',
        { actor: { id: manager } },
      ),
    ).rejects.toThrow();
    await approve(cancellations, cancellationId);
    const attendance = await db
      .repository('leaveAttendance')
      .findOne({ filter: { applicationId: id } });
    expect(attendance).toMatchObject({ active: true, endDate: '2027-01-04' });
    expect(Number(attendance!.days)).toBe(1);
    expect(
      (
        await balances.balance({
          employeeId: 'cancellation-applicant',
          leaveType: 'annual',
        })
      ).availableUnits,
    ).toBe(before.availableUnits + 2);
    expect((await leave.detail(id, applicant)).record.endDate).toBe(
      '2027-01-05',
    );
    const delegations = await app.testApp.application.container
      .resolve(approvalDirectoryServiceToken)
      .list();
    expect(
      delegations
        .filter((d) => d.sourceApplication === id)
        .every((d) => !d.active),
    ).toBe(true);
    // The cancelled tail no longer blocks a new leave submission.
    await approvedLeave('2027-01-05');
  });
  it('allows whole cancellation only before leave starts and refunds once', async () => {
    const id = await approvedLeave('2027-01-11');
    const a = await submittedCancellation(id, true, '2027-01-11');
    const b = await submittedCancellation(id, true, '2027-01-11');
    const decisions = await Promise.allSettled([
      approve(cancellations, a),
      approve(cancellations, b),
    ]);
    expect(decisions.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(decisions.filter((r) => r.status === 'rejected')).toHaveLength(1);
    const attendance = await db
      .repository('leaveAttendance')
      .findOne({ filter: { applicationId: id } });
    expect(attendance).toMatchObject({ active: false });
    expect(Number(attendance!.days)).toBe(0);
    const refunds = await db
      .repository('leaveLedger')
      .findMany({ filter: { reference: id, kind: 'refund' } });
    expect(refunds).toHaveLength(1);
  });
  it('refuses a foreign applicant and elapsed cancellation, leaving approved attendance intact', async () => {
    const id = await approvedLeave('2000-01-03');
    await expect(
      cancellations.create(
        {
          originalLeaveId: id,
          cancelAll: true,
          endDate: '2000-01-03',
          endHalf: 'pm',
          reason: 'Invalid',
        },
        manager,
      ),
    ).rejects.toThrow();
    await expect(
      submittedCancellation(id, true, '2000-01-03'),
    ).rejects.toThrow();
    expect(
      await db
        .repository('leaveAttendance')
        .findOne({ filter: { applicationId: id } }),
    ).toMatchObject({ active: true });
  });
  it('authenticates production endpoints and rejects another user reading or changing the cancellation', async () => {
    expect((await app.testApp.request('/leaveCancellations')).status).toBe(401);
    expect(
      (await app.testApp.request('/leaveCancellations/originals/none')).status,
    ).toBe(401);
    const id = await approvedLeave('2027-02-01');
    const response = await ownerSession.fetch(
      '/leaveCancellations',
      json({
        originalLeaveId: id,
        cancelAll: true,
        endDate: '2027-02-01',
        endHalf: 'pm',
        reason: 'Route fixture',
      }),
    );
    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      data: { record: { id: string } };
    };
    expect(
      (await ownerSession.fetch(`/leaveCancellations/${result.data.record.id}`))
        .status,
    ).toBe(200);
    const stranger = await app.createUser('CancellationStranger');
    expect(
      (await stranger.fetch(`/leaveCancellations/${result.data.record.id}`))
        .status,
    ).toBe(403);
    expect(
      (
        await stranger.fetch(
          `/leaveCancellations/${result.data.record.id}/transition`,
          json({ transition: 'withdraw', version: 0, requestId: 'foreign' }),
        )
      ).status,
    ).toBe(403);
    expect(
      (await stranger.fetch(`/leaveCancellations/originals/${id}`)).status,
    ).toBe(403);
    expect(
      (await ownerSession.fetch(`/leaveCancellations/originals/${id}`)).status,
    ).toBe(200);
  });
  it('returns for correction and resubmission, then rejection leaves original facts untouched', async () => {
    const id = await approvedLeave('2027-02-08');
    const cancellationId = await submittedCancellation(id, true, '2027-02-08');
    let d = await cancellations.detail(cancellationId, manager);
    let run = d.runs.at(-1)!;
    await cancellations.action(
      cancellationId,
      {
        target: { taskId: run.tasks[0].id },
        action: 'return',
        input: { to: 'revision' },
        comment: 'Review dates',
        contentHash: run.run.contentHash,
        requestId: 'return-cancellation',
      },
      manager,
    );
    d = await cancellations.detail(cancellationId, applicant);
    expect(d.record.status).toBe('revision');
    await cancellations.transition(
      cancellationId,
      'submit',
      applicant,
      d.record.lifecycleVersion,
      'resubmit-cancellation',
    );
    d = await cancellations.detail(cancellationId, manager);
    const next = d.runs.at(-1)!;
    expect(next.run.id).not.toBe(run.run.id);
    run = next;
    await cancellations.action(
      cancellationId,
      {
        target: { taskId: run.tasks[0].id },
        action: 'reject',
        comment: 'Cannot cancel',
        contentHash: run.run.contentHash,
        requestId: 'reject-cancellation',
      },
      manager,
    );
    expect(
      (await cancellations.detail(cancellationId, applicant)).record.status,
    ).toBe('rejected');
    expect(
      await db
        .repository('leaveAttendance')
        .findOne({ filter: { applicationId: id } }),
    ).toMatchObject({ active: true });
    expect(
      await db
        .repository('leaveLedger')
        .findMany({ filter: { reference: id, kind: 'refund' } }),
    ).toHaveLength(0);
  });
  it('offers global reminder and scoped transfer, then the transferred reviewer confirms cancellation', async () => {
    const bob = (await app.createUser('CancellationCover')).user.id;
    const now = new Date().toISOString();
    await db
      .repository('employees')
      .createOne({
        values: {
          id: 'cancellation-cover',
          userId: bob,
          code: 'cancellation-cover',
          name: 'Cover',
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    await db
      .repository('dutyRoles')
      .createOne({
        values: {
          code: 'cancel-test-reviewers',
          title: 'Test reviewers',
          active: true,
          sortOrder: 0,
        },
      });
    for (const userId of [manager, bob])
      await db
        .repository('dutyRoleMembers')
        .createOne({
          values: {
            id: `cancel-test-role:${userId}`,
            dutyRoleCode: 'cancel-test-reviewers',
            userId,
            active: true,
          },
        });
    const id = await approvedLeave('2027-03-01');
    const cancellationId = await submittedCancellation(id, true, '2027-03-01');
    const mine = await cancellations.detail(cancellationId, applicant);
    const run = mine.runs.at(-1)!;
    await cancellations.action(
      cancellationId,
      {
        target: { runId: run.run.id },
        action: 'urge',
        requestId: 'cancel-urge',
      },
      applicant,
    );
    await expect(
      cancellations.action(
        cancellationId,
        {
          target: { runId: run.run.id },
          action: 'urge',
          requestId: 'cancel-urge-too-soon',
        },
        applicant,
      ),
    ).rejects.toThrow();
    const task = run.tasks.find((t) => t.assigneeId === manager)!;
    expect(
      (
        await cancellations.candidates(
          cancellationId,
          task.id,
          'transfer',
          manager,
          {},
        )
      ).people.some((p) => p.id === bob),
    ).toBe(true);
    await cancellations.action(
      cancellationId,
      {
        target: { taskId: task.id },
        action: 'transfer',
        input: { to: bob },
        comment: 'Same reviewer role',
        contentHash: run.run.contentHash,
        requestId: 'cancel-transfer',
      },
      manager,
    );
    const changed = await cancellations.detail(cancellationId, bob);
    const current = changed.runs.at(-1)!;
    const transferred = current.tasks.find(
      (t) => t.assigneeId === bob && t.status === 'pending',
    )!;
    await cancellations.action(
      cancellationId,
      {
        target: { taskId: transferred.id },
        action: 'approve',
        contentHash: current.run.contentHash,
        requestId: 'cancel-cover-approve',
      },
      bob,
    );
    expect(
      (await cancellations.detail(cancellationId, applicant)).record.status,
    ).toBe('approved');
  });
});
