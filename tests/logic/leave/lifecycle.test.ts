// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.ts';
import { databaseManagerToken } from '@nocobase/db';
import {
  leaveServiceToken,
  LEAVE_LIFECYCLE,
  type LeaveService,
  type LeaveInput,
} from '../../../server/providers/leave/index.ts';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
let app: OrgTestApp;
let service: LeaveService;
let employeeId: string;
let managerId: string;
const form: LeaveInput = {
  leaveType: 'personal',
  startDate: '2026-10-12',
  endDate: '2026-10-12',
  startHalf: 'am',
  endHalf: 'pm',
  reason: 'Family appointment',
  attachments: [],
  handoverUserId: null,
  enableDelegation: false,
};
describe('leave lifecycle on SQLite', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    service = app.testApp.application.container.resolve(leaveServiceToken);
    const employee = await app.createUser('LeaveApplicant');
    const manager = await app.createUser('LeaveManager');
    employeeId = employee.user.id;
    managerId = manager.user.id;
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const now = new Date().toISOString();
    await db.repository('employees').createOne({
      values: {
        id: 'leave-test-manager',
        userId: managerId,
        code: 'LEAVE-MGR',
        name: 'Leave Manager',
        managerId: null,
        status: 'regular',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    await db.repository('employees').createOne({
      values: {
        id: 'leave-test-applicant',
        userId: employeeId,
        code: 'LEAVE-EMP',
        name: 'Leave Applicant',
        managerId: 'leave-test-manager',
        status: 'regular',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  }, 120000);
  afterAll(async () => app?.close());
  it('submits, protects direct exits and stale hashes, then atomically records approved attendance', async () => {
    const draft = await service.create(form, employeeId);
    const id = String(draft.record.id);
    await service.transition(
      id,
      'submit',
      employeeId,
      Number(draft.record.lifecycleVersion),
      'leave-submit',
    );
    let detail = await service.detail(id, managerId);
    expect(detail.record.status).toBe('manager');
    expect(detail.record.number).toMatch(/^LEAVE/);
    const run = detail.runs.at(-1)!;
    const task = run.tasks.find((t) => t.assigneeId === managerId)!;
    await expect(
      service.runtime.fire(LEAVE_LIFECYCLE, id, 'managerApproved', {
        actor: { id: managerId },
      }),
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
        managerId,
      ),
    ).rejects.toThrow();
    await service.action(
      id,
      {
        target: { taskId: task.id },
        action: 'approve',
        contentHash: run.run.contentHash,
        requestId: 'leave-approve',
      },
      managerId,
    );
    detail = await service.detail(id, employeeId);
    expect(detail.record.status).toBe('approved');
    const rows = await app.testApp.application.container
      .resolve(databaseManagerToken)
      .repository('leaveAttendance')
      .findMany({ filter: { applicationId: id } });
    expect(rows).toHaveLength(1);
    await expect(
      service.transition(
        id,
        'withdraw',
        employeeId,
        detail.record.lifecycleVersion,
        'after-approved',
      ),
    ).rejects.toThrow();
  });
  it('rejects balance-backed and overlapping requests without allocating approval work', async () => {
    const annual = await service.create(
      {
        ...form,
        leaveType: 'annual',
        startDate: '2026-10-13',
        endDate: '2026-10-13',
      },
      employeeId,
    );
    await expect(
      service.transition(
        String(annual.record.id),
        'submit',
        employeeId,
        Number(annual.record.lifecycleVersion),
        'annual-submit',
      ),
    ).rejects.toMatchObject({ code: 'LEAVE_BALANCE_INSUFFICIENT' });
    expect(
      (await service.detail(String(annual.record.id), employeeId)).runs,
    ).toHaveLength(0);
    const duplicate = await service.create(form, employeeId);
    await expect(
      service.transition(
        String(duplicate.record.id),
        'submit',
        employeeId,
        Number(duplicate.record.lifecycleVersion),
        'overlap-submit',
      ),
    ).rejects.toMatchObject({ code: 'LEAVE_OVERLAP' });
  });
  it('returns for guarded revision, creates fresh tasks and refuses stale or unauthorized operations', async () => {
    const applicant2 = await app.createUser('RevisionApplicant');
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const now = new Date().toISOString();
    await db.repository('employees').createOne({
      values: {
        id: 'leave-test-revision',
        userId: applicant2.user.id,
        code: 'LEAVE-REV',
        name: 'Revision Applicant',
        managerId: 'leave-test-manager',
        status: 'regular',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    const draft = await service.create(form, applicant2.user.id);
    const id = String(draft.record.id);
    await service.transition(
      id,
      'submit',
      applicant2.user.id,
      Number(draft.record.lifecycleVersion),
      'revision-submit',
    );
    const first = await service.detail(id, managerId);
    const run = first.runs.at(-1)!;
    const task = run.tasks.find((t) => t.assigneeId === managerId)!;
    await expect(
      service.action(
        id,
        {
          target: { taskId: task.id },
          action: 'approve',
          contentHash: run.run.contentHash,
          requestId: 'stranger-vote',
        },
        employeeId,
      ),
    ).rejects.toThrow();
    await service.action(
      id,
      {
        target: { taskId: task.id },
        action: 'return',
        input: { to: 'revision' },
        comment: 'Correct the dates',
        contentHash: run.run.contentHash,
        requestId: 'return',
      },
      managerId,
    );
    const returned = await service.detail(id, applicant2.user.id);
    expect(returned.record.status).toBe('revision');
    await service.transition(
      id,
      'edit',
      applicant2.user.id,
      returned.record.lifecycleVersion,
      'edit-revision',
      { ...form, startHalf: 'pm' },
    );
    const corrected = await service.detail(id, applicant2.user.id);
    await service.transition(
      id,
      'submit',
      applicant2.user.id,
      corrected.record.lifecycleVersion,
      'resubmit',
    );
    const second = await service.detail(id, managerId);
    expect(second.record.number).toBe(first.record.number);
    expect(second.runs.at(-1)!.run.id).not.toBe(run.run.id);
    expect(Number(second.record.days)).toBe(0.5);
    await expect(
      service.action(
        id,
        {
          target: { taskId: task.id },
          action: 'approve',
          contentHash: run.run.contentHash,
          requestId: 'closed-task',
        },
        managerId,
      ),
    ).rejects.toThrow();
    await service.transition(
      id,
      'withdraw',
      applicant2.user.id,
      second.record.lifecycleVersion,
      'withdraw-revision',
    );
    expect((await service.detail(id, managerId)).record.status).toBe(
      'withdrawn',
    );
  });
  it('holds missing assignees, blocks unvalidated attachments, and audits administrator termination atomically', async () => {
    const noManager = await app.createUser('NoManager');
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const now = new Date().toISOString();
    await db.repository('employees').createOne({
      values: {
        id: 'leave-test-no-manager',
        userId: noManager.user.id,
        code: 'LEAVE-NOMGR',
        name: 'No Manager',
        status: 'regular',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    await expect(
      service.create(
        { ...form, attachments: ['invented-file'] },
        noManager.user.id,
      ),
    ).rejects.toMatchObject({ code: 'LEAVE_ATTACHMENT_INVALID' });
    const safe = await service.create(form, noManager.user.id);
    const id = String(safe.record.id);
    await service.transition(
      id,
      'submit',
      noManager.user.id,
      Number(safe.record.lifecycleVersion),
      'missing-manager',
    );
    const pending = await service.detail(id, noManager.user.id);
    expect(pending.record.status).toBe('manager');
    expect(pending.runs.at(-1)!.tasks).toHaveLength(0);
    const root = await app.admin();
    await service.transition(
      id,
      'terminate',
      root.user.id,
      pending.record.lifecycleVersion,
      'admin-terminate',
      { reason: 'No responsible manager' },
      { read: true, create: false, update: false, delete: false },
    );
    const audits = await db
      .repository('auditLogs')
      .findMany({ filter: { targetId: id, action: 'leave.terminate' } });
    expect(audits).toHaveLength(1);
    expect((await service.detail(id, noManager.user.id)).record.status).toBe(
      'terminated',
    );
  });
  it('creates time-zone and work-window aligned leave delegation exactly once in the approval transaction', async () => {
    const person = await app.createUser('DelegatingApplicant');
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const now = new Date().toISOString();
    await db.repository('employees').createOne({
      values: {
        id: 'leave-test-delegating',
        userId: person.user.id,
        code: 'LEAVE-DEL',
        name: 'Delegating Applicant',
        managerId: 'leave-test-manager',
        status: 'regular',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    const draft = await service.create(
      {
        ...form,
        startDate: '2026-10-19',
        endDate: '2026-10-19',
        startHalf: 'pm',
        enableDelegation: true,
        handoverUserId: employeeId,
      },
      person.user.id,
    );
    const id = String(draft.record.id);
    await service.transition(
      id,
      'submit',
      person.user.id,
      Number(draft.record.lifecycleVersion),
      'delegate-submit',
    );
    const detail = await service.detail(id, managerId);
    const run = detail.runs.at(-1)!;
    const task = run.tasks.find((t) => t.assigneeId === managerId)!;
    await service.action(
      id,
      {
        target: { taskId: task.id },
        action: 'approve',
        contentHash: run.run.contentHash,
        requestId: 'delegate-approve',
      },
      managerId,
    );
    const directory = app.testApp.application.container.resolve(
      approvalDirectoryServiceToken,
    );
    const delegation = (await directory.list()).find(
      (row) => row.sourceApplication === id,
    )!;
    expect(delegation.delegateId).toBe(employeeId);
    expect(delegation.from).toBe('2026-10-19T05:30:00.000Z');
    expect(delegation.to).toBe('2026-10-19T10:00:00.000Z');
    expect(
      (await directory.snapshot()).delegateOf?.(
        person.user.id,
        LEAVE_LIFECYCLE,
        '2026-10-19T06:00:00Z',
        '2026-10-19T06:00:00Z',
      )?.to,
    ).toBe(employeeId);
    await service.action(
      id,
      {
        target: { taskId: task.id },
        action: 'approve',
        contentHash: run.run.contentHash,
        requestId: 'delegate-approve',
      },
      managerId,
    );
    expect(
      (await directory.list()).filter((row) => row.sourceApplication === id),
    ).toHaveLength(1);
  });
  it('rolls administrator termination and tasks back when the required audit fails', async () => {
    const person = await app.createUser('AuditRollbackApplicant');
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const now = new Date().toISOString();
    await db.repository('employees').createOne({
      values: {
        id: 'leave-test-audit',
        userId: person.user.id,
        code: 'LEAVE-AUD',
        name: 'Audit Rollback',
        status: 'regular',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    const draft = await service.create(form, person.user.id);
    const id = String(draft.record.id);
    await service.transition(
      id,
      'submit',
      person.user.id,
      Number(draft.record.lifecycleVersion),
      'audit-submit',
    );
    const pending = await service.detail(id, person.user.id);
    const root = await app.admin();
    const audit = app.testApp.application.container.resolve(auditServiceToken);
    const spy = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('audit unavailable'));
    try {
      await expect(
        service.transition(
          id,
          'terminate',
          root.user.id,
          pending.record.lifecycleVersion,
          'audit-terminate',
          { reason: 'Required audit' },
          { read: true, create: false, update: false, delete: false },
        ),
      ).rejects.toThrow('audit unavailable');
    } finally {
      spy.mockRestore();
    }
    const after = await service.detail(id, person.user.id);
    expect(after.record.status).toBe('manager');
    expect(after.record.lifecycleVersion).toBe(pending.record.lifecycleVersion);
    expect(after.runs.at(-1)!.run).toEqual(pending.runs.at(-1)!.run);
  });
});
