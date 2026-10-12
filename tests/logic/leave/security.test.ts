// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import type {
  RunView,
  TaskActions,
} from '@nocobase/app-plugin-approval/server';
import { describe, expect } from 'vitest';
import {
  leaveServiceToken,
  LEAVE_LIFECYCLE,
  type LeaveRecord,
} from '../../../server/providers/leave/index.ts';
import {
  createEmployee,
  createEmployeesAppTest,
  createPerson,
} from '../employees/helpers.ts';
import { json } from '../org/helpers.ts';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.ts';

const test = createEmployeesAppTest();
const form = {
  leaveType: 'personal',
  startDate: '2026-10-12',
  endDate: '2026-10-12',
  startHalf: 'am',
  endHalf: 'pm',
  reason: 'Security fixture',
  attachments: [] as string[],
  handoverUserId: null,
  enableDelegation: false,
};
interface Detail {
  record: LeaveRecord;
  runs: RunView[];
  taskActions: TaskActions[];
}
async function data<T>(response: Response): Promise<T> {
  expect(response.status).toBe(200);
  return ((await response.json()) as { data: T }).data;
}
async function draft(session: TestSession, input = form): Promise<LeaveRecord> {
  const response = await session.fetch('/leaveRequests', json(input));
  return (await data<{ record: LeaveRecord }>(response)).record;
}
async function transition(
  session: TestSession,
  record: LeaveRecord,
  verb: string,
) {
  return session.fetch(
    `/leaveRequests/${record.id}/transition`,
    json({
      transition: verb,
      version: Number(record.lifecycleVersion),
      requestId: randomUUID(),
      input: {},
    }),
  );
}
async function detail(session: TestSession, id: string) {
  return data<Detail>(await session.fetch(`/leaveRequests/${id}`));
}

describe('leave production route security', () => {
  test('authenticates routes and isolates default employee access from another applicant', async ({
    testApp,
    request,
  }) => {
    expect((await request('/leaveRequests')).status).toBe(401);
    expect((await request('/leaveRequests', json(form))).status).toBe(401);
    const owner = await createEmployee(testApp, 'Security Owner');
    const stranger = await createEmployee(testApp, 'Security Stranger');
    const ownerSession = await owner.session();
    const strangerSession = await stranger.session();
    const record = await draft(ownerSession);
    expect(
      (await ownerSession.fetch(`/leaveRequests/${record.id}`)).status,
    ).toBe(200);
    expect(
      (await strangerSession.fetch(`/leaveRequests/${record.id}`)).status,
    ).toBe(403);
    expect(
      (
        await strangerSession.fetch(
          `/leaveRequests/${record.id}/transition`,
          json({
            transition: 'withdraw',
            version: record.lifecycleVersion,
            requestId: randomUUID(),
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await strangerSession.fetch(
          '/leaveRequests',
          json({ ...form, applicantId: owner.userId }),
        )
      ).status,
    ).toBe(403);
    const unarchived = await createPerson(testApp, 'No Archive');
    const session = await unarchived.session();
    const emptyDraft = await draft(session);
    const refused = await transition(session, emptyDraft, 'submit');
    expect(refused.status).toBe(400);
    expect(
      ((await refused.json()) as { error: { reason: string } }).error.reason,
    ).toBe('LEAVE_EMPLOYEE_INACTIVE');
  });

  test('refuses a submit after the employee permission set loses the submit action', async ({
    testApp,
  }) => {
    const owner = await createEmployee(testApp, 'Revoked Submit Owner');
    const session = await owner.session();
    const record = await draft(session);
    const permissionSets =
      testApp.application.container.resolve(authorizationToken).permissionSets;
    const original = (await permissionSets.get('oa-leave-employee'))!;
    try {
      await permissionSets.update(original.key, {
        ...original,
        grants: original.grants.map((grant) =>
          grant.resource.type === 'composite' &&
          grant.resource.id === 'oa.leave'
            ? {
                ...grant,
                actions: grant.actions.filter(
                  (action) => action.action !== 'submit',
                ),
              }
            : grant,
        ),
      });
      expect((await transition(session, record, 'submit')).status).toBe(403);
      expect((await detail(session, record.id)).record.status).toBe('draft');
    } finally {
      await permissionSets.update(original.key, original);
    }
  });

  test('refuses balance-backed leave and fabricated supporting files without assigning tasks or attendance', async ({
    testApp,
  }) => {
    const owner = await createEmployee(testApp, 'Invalid Leave Owner');
    const session = await owner.session();
    const fake = await session.fetch(
      '/leaveRequests',
      json({ ...form, attachments: ['invented-secret-file'] }),
    );
    expect(fake.status).toBe(400);
    expect(
      ((await fake.json()) as { error: { reason: string } }).error.reason,
    ).toBe('LEAVE_ATTACHMENT_INVALID');
    for (const [input, reason] of [
      [{ ...form, leaveType: 'annual' }, 'LEAVE_BALANCE_INSUFFICIENT'],
    ] as const) {
      const record = await draft(session, input);
      const response = await transition(session, record, 'submit');
      expect(response.status).toBe(400);
      expect(
        ((await response.json()) as { error: { reason: string } }).error.reason,
      ).toBe(reason);
      const state = await detail(session, record.id);
      expect(state.record.status).toBe('draft');
      expect(state.runs).toHaveLength(0);
      expect(
        await testApp.database
          .repository('leaveAttendance')
          .count({ filter: { applicationId: record.id } }),
      ).toBe(0);
    }
  });

  test('rejects targets from another request and native outcome transition bypasses', async ({
    testApp,
  }) => {
    const manager = await createEmployee(testApp, 'Security Manager');
    const firstOwner = await createEmployee(testApp, 'First Target Owner', {
      managerId: manager.employeeId,
    });
    const secondOwner = await createEmployee(testApp, 'Second Target Owner', {
      managerId: manager.employeeId,
    });
    const managerSession = await manager.session();
    const firstSession = await firstOwner.session();
    const secondSession = await secondOwner.session();
    const first = await draft(firstSession);
    const second = await draft(secondSession);
    await data(await transition(firstSession, first, 'submit'));
    await data(await transition(secondSession, second, 'submit'));
    const firstDetail = await detail(managerSession, first.id);
    const secondDetail = await detail(managerSession, second.id);
    const run = secondDetail.runs.at(-1)!;
    const task = run.tasks.find(
      (entry) => entry.assigneeId === manager.userId,
    )!;
    const cross = await managerSession.fetch(
      `/leaveRequests/${first.id}/action`,
      json({
        target: { taskId: task.id },
        action: 'approve',
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
      }),
    );
    expect(cross.status).toBe(403);
    expect(
      ((await cross.json()) as { error: { reason: string } }).error.reason,
    ).toBe('LEAVE_TARGET_MISMATCH');
    const service = testApp.application.container.resolve(leaveServiceToken);
    await expect(
      service.runtime.fire(LEAVE_LIFECYCLE, first.id, 'managerApproved', {
        actor: { id: manager.userId },
        expect: { version: Number(firstDetail.record.lifecycleVersion) },
      }),
    ).rejects.toMatchObject({ code: 'GUARD_REJECTED' });
    expect((await detail(managerSession, first.id)).record.status).toBe(
      'manager',
    );
    expect((await detail(managerSession, second.id)).record.status).toBe(
      'manager',
    );
    const foreignVote = await firstSession.fetch(
      `/leaveRequests/${first.id}/action`,
      json({
        target: { taskId: firstDetail.runs.at(-1)!.tasks[0]!.id },
        action: 'approve',
        contentHash: firstDetail.runs.at(-1)!.run.contentHash,
        requestId: randomUUID(),
      }),
    );
    expect(foreignVote.status).toBe(403);
  });

  test('holds missing managers and allows an audited root appointment without automatically approving', async ({
    testApp,
  }) => {
    const owner = await createEmployee(testApp, 'Held Security Owner');
    const assignee = await createEmployee(testApp, 'Held Security Assignee');
    const session = await owner.session();
    const record = await draft(session);
    await data(await transition(session, record, 'submit'));
    const held = await detail(session, record.id);
    expect(held.record.status).toBe('manager');
    expect(held.runs.at(-1)!.tasks).toHaveLength(0);
    const root = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const response = await root.fetch(
      `/leaveRequests/${record.id}/action`,
      json({
        target: { runId: held.runs.at(-1)!.run.id },
        action: 'appoint',
        input: { to: assignee.userId },
        comment: 'Assign missing responsible manager',
        requestId: randomUUID(),
      }),
    );
    expect(response.status).toBe(200);
    const assigned = await detail(session, record.id);
    expect(assigned.record.status).toBe('manager');
    expect(
      assigned.runs.at(-1)!.tasks.map((entry) => entry.assigneeId),
    ).toEqual([assignee.userId]);
    const audit = await testApp.database
      .repository('auditLogs')
      .findMany({ filter: { targetId: record.id, action: 'leave.appoint' } });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.actorId).toBe(root.user.id);
  });
  test('keeps administrative reassignment out of personal approval work', async ({
    testApp,
  }) => {
    const manager = await createEmployee(testApp, 'Pending Actual Manager');
    const owner = await createEmployee(testApp, 'Pending Applicant', {
      managerId: manager.employeeId,
    });
    const ownerSession = await owner.session();
    const managerSession = await manager.session();
    const root = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const record = await draft(ownerSession);
    await data(await transition(ownerSession, record, 'submit'));
    const rootDetail = await detail(root, record.id);
    expect(
      rootDetail.taskActions.flatMap((entry) =>
        entry.actions.map((action) => action.name),
      ),
    ).toContain('reassign');
    expect(
      rootDetail.taskActions.flatMap((entry) =>
        entry.actions.map((action) => action.name),
      ),
    ).not.toContain('approve');
    const pending = async (session: TestSession) =>
      (
        await data<LeaveRecord[]>(
          await session.fetch('/leaveRequests?view=pending'),
        )
      ).map((entry) => entry.id);
    expect(await pending(managerSession)).toContain(record.id);
    expect(await pending(root)).not.toContain(record.id);
    expect(await pending(ownerSession)).not.toContain(record.id);
    // A current delegate remains a reviewer even without direct task assignment.
    const delegate = await createEmployee(testApp, 'Pending Delegate');
    const delegateSession = await delegate.session();
    const directory = testApp.application.container.resolve(
      approvalDirectoryServiceToken,
    );
    const delegation = await directory.createManualDelegation(
      {
        principalId: manager.userId,
        delegateId: delegate.userId,
        scope: [LEAVE_LIFECYCLE],
        from: new Date(Date.now() - 60_000).toISOString(),
        to: new Date(Date.now() + 3_600_000).toISOString(),
      },
      { actorId: root.user.id },
    );
    expect(await pending(delegateSession)).toContain(record.id);
    await directory.disableManualDelegation(delegation.id, {
      actorId: root.user.id,
    });
    expect(await pending(delegateSession)).not.toContain(record.id);

    const task = rootDetail.runs
      .at(-1)!
      .tasks.find((entry) => entry.assigneeId === manager.userId)!;
    await data(
      await managerSession.fetch(
        `/leaveRequests/${record.id}/action`,
        json({
          target: { taskId: task.id },
          action: 'approve',
          contentHash: rootDetail.runs.at(-1)!.run.contentHash,
          requestId: randomUUID(),
        }),
      ),
    );
    expect(await pending(managerSession)).not.toContain(record.id);
    expect(await pending(root)).not.toContain(record.id);
  });
});
