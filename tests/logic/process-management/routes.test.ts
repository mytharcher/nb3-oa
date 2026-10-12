// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, describe } from 'vitest';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  createEmployeesAppTest,
  createEmployee,
} from '../employees/helpers.ts';
import { json } from '../org/helpers.ts';
import { leaveServiceToken } from '../../../server/providers/leave/index.ts';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.ts';
import { isProcessOverviewEdge } from '../../../client/pages/process-management/overview.js';
import { processOwners } from '../../../server/providers/process-management/owners.ts';
const test = createEmployeesAppTest();
const form = {
  leaveType: 'personal',
  startDate: '2026-11-02',
  endDate: '2026-11-02',
  startHalf: 'am',
  endHalf: 'pm',
  reason: 'Private business detail',
  attachments: [],
  handoverUserId: null,
  enableDelegation: false,
};
async function value(response: Response) {
  expect(response.status).toBe(200);
  return (await response.json()).data;
}
describe('process management main application', () => {
  test('requires both page and process grants, and describes all fixed registered approval owners', async ({
    testApp,
    request,
  }) => {
    expect((await request('/processManagement/definitions')).status).toBe(401);
    const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const defs = await value(
      await admin.fetch('/processManagement/definitions?pageSize=100'),
    );
    expect(defs).toHaveLength(processOwners.length);
    const missingConditions: string[] = [];
    for (const owner of processOwners) {
      const d = await value(
        await admin.fetch(`/processManagement/definitions/${owner.kind}`),
      );
      expect(d.states.length).toBeGreaterThan(1);
      expect(d.transitions.length).toBeGreaterThan(0);
      const overview = d.transitions
        .flatMap((transition: { name: string; from: string[]; to: string[] }) =>
          transition.from.flatMap((from) =>
            transition.to.map((to) => ({ name: transition.name, from, to })),
          ),
        )
        .filter(isProcessOverviewEdge);
      expect(overview.length).toBeGreaterThan(0);
      expect(
        overview.some((edge: { from: string }) => edge.from === 'draft'),
      ).toBe(true);
      if (owner.kind === 'oa.recruitment') {
        expect(overview).toHaveLength(10);
        expect(
          overview.some((edge: { name: string }) =>
            /Returned|Edit/.test(edge.name),
          ),
        ).toBe(false);
      }

      for (const transition of d.transitions) {
        if (transition.name !== 'edit' && transition.to.length > 1)
          for (const target of transition.to)
            if (!transition.conditions[target])
              missingConditions.push(
                `${owner.kind}/${transition.name}/${target}`,
              );
      }
      expect(JSON.stringify(d)).not.toContain('[function]');
    }
    expect(missingConditions).toEqual([]);
    const employee = await createEmployee(testApp, 'No Management');
    expect(
      (await (await employee.session()).fetch('/processManagement/definitions'))
        .status,
    ).toBe(403);
  });
  test('permits a scoped leave manager to read safe independent history and terminate without global administrator access', async ({
    testApp,
  }) => {
    const owner = await createEmployee(testApp, 'Managed Owner');
    const manager = await createEmployee(testApp, 'Scoped Manager');
    const reviewer = await createEmployee(testApp, 'Managed Reviewer');
    const outsider = await createEmployee(testApp, 'Other Owner');
    const db = (await import('@nocobase/db')).databaseManagerToken;
    await testApp.application.container
      .resolve(db)
      .repository('employees')
      .updateMany({
        filter: { userId: owner.userId },
        values: { managerId: reviewer.employeeId },
      });
    const session = await owner.session(),
      service = testApp.application.container.resolve(leaveServiceToken);
    const created = (
      await value(await session.fetch('/leaveRequests', json(form)))
    ).record;
    const submitted = await service.transition(
      created.id,
      'submit',
      owner.userId,
      Number(created.lifecycleVersion),
      randomUUID(),
    );
    const authz = testApp.application.container.resolve(authorizationToken);
    const set = definePermissionSet('fixture-process-manager')
      .grant(authz.pages.grant('oa.processManagement'), {
        resource: { type: 'composite', id: 'oa.processManagement.leave' },
        actions: [
          'definitionRead',
          'historyRead',
          'terminate',
          'reassign',
          'appoint',
        ].map((action) => ({
          action,
          policy: {
            type: 'composite' as const,
            scopes: { leaveRequests: 'allRecords' },
          },
        })),
      })
      .build();
    await authz.permissionSets.create(set);
    const assignment = await authz.permissionSets.assign({
      permissionSet: set.key,
      subject: { type: 'user', id: manager.userId },
    });
    const managerSession = await manager.session();
    expect(
      (await managerSession.fetch(`/leaveRequests/${created.id}`)).status,
    ).toBe(403);
    const detail = await value(
      await managerSession.fetch(
        `/processManagement/executions/oa.leave/${created.id}`,
      ),
    );
    expect(detail.record.id).toBe(created.id);
    expect(detail.commentsReadable).toBe(false);
    expect(JSON.stringify(detail)).not.toContain('Private business detail');
    expect(JSON.stringify(detail)).not.toContain('ruleSnapshot');
    expect(JSON.stringify(detail)).not.toContain('contentHash');
    const pending = detail.runs
      .flatMap((r: { tasks: unknown[] }) => r.tasks)
      .find((t: { actions: string[] }) => t.actions.includes('reassign'));
    expect(pending).toBeTruthy();
    const options = await value(
      await managerSession.fetch(
        `/processManagement/executions/oa.leave/${created.id}/managementOptions`,
        json({ action: 'reassign', taskId: pending.id }),
      ),
    );
    expect(
      options.people.some((p: { id: string }) => p.id === outsider.userId),
    ).toBe(true);
    const reassignKey = randomUUID();
    const reassign = await value(
      await managerSession.fetch(
        `/processManagement/executions/oa.leave/${created.id}/managementActions`,
        json({
          action: 'reassign',
          reason: 'Cover reviewer absence',
          requestId: reassignKey,
          expectedVersion: detail.record.version,
          taskId: pending.id,
          runId: options.runId,
          contentHash: options.contentHash,
          to: outsider.userId,
        }),
      ),
    );
    expect(
      reassign.detail.events.some(
        (e: { kind: string }) => e.kind === 'reassign',
      ),
    ).toBe(true);
    const replay = await value(
      await managerSession.fetch(
        `/processManagement/executions/oa.leave/${created.id}/managementActions`,
        json({
          action: 'reassign',
          reason: 'Cover reviewer absence',
          requestId: reassignKey,
          expectedVersion: detail.record.version,
          taskId: pending.id,
          runId: options.runId,
          contentHash: options.contentHash,
          to: outsider.userId,
        }),
      ),
    );
    expect(replay.replayed).toBe(true);
    expect(
      replay.detail.events.filter(
        (event: { kind: string }) => event.kind === 'reassign',
      ),
    ).toHaveLength(1);
    const oldTaskResponse = await managerSession.fetch(
      `/processManagement/executions/oa.leave/${created.id}/managementActions`,
      json({
        action: 'reassign',
        reason: 'Old task must fail',
        requestId: randomUUID(),
        expectedVersion: detail.record.version,
        taskId: pending.id,
        runId: options.runId,
        contentHash: options.contentHash,
        to: reviewer.userId,
      }),
    );
    expect(oldTaskResponse.status).toBe(409);
    const vacant = (
      await value(
        await (await outsider.session()).fetch('/leaveRequests', json(form)),
      )
    ).record;
    await service.transition(
      vacant.id,
      'submit',
      outsider.userId,
      Number(vacant.lifecycleVersion),
      randomUUID(),
    );
    const vacancy = await value(
      await managerSession.fetch(
        `/processManagement/executions/oa.leave/${vacant.id}`,
      ),
    );
    const appointRun = vacancy.runs.find(
      (run: { appoint: boolean }) => run.appoint,
    );
    expect(appointRun).toBeTruthy();
    const appointmentOptions = await value(
      await managerSession.fetch(
        `/processManagement/executions/oa.leave/${vacant.id}/managementOptions`,
        json({ action: 'appoint', taskId: appointRun.id }),
      ),
    );
    expect(
      appointmentOptions.people.some(
        (person: { id: string }) => person.id === reviewer.userId,
      ),
    ).toBe(true);
    const appointed = await value(
      await managerSession.fetch(
        `/processManagement/executions/oa.leave/${vacant.id}/managementActions`,
        json({
          action: 'appoint',
          reason: 'Assign vacant review',
          requestId: randomUUID(),
          expectedVersion: vacancy.record.version,
          taskId: appointRun.id,
          runId: appointRun.id,
          contentHash: appointmentOptions.contentHash,
          to: reviewer.userId,
        }),
      ),
    );
    expect(
      appointed.detail.runs
        .flatMap((run: { tasks: { assignee: { id: string } }[] }) => run.tasks)
        .some(
          (task: { assignee: { id: string } }) =>
            task.assignee.id === reviewer.userId,
        ),
    ).toBe(true);
    const terminate = await value(
      await managerSession.fetch(
        `/processManagement/executions/oa.leave/${created.id}/managementActions`,
        json({
          action: 'terminate',
          reason: 'Administrator cancellation',
          requestId: randomUUID(),
          expectedVersion: Number(submitted.record.lifecycleVersion),
        }),
      ),
    );
    expect(terminate.detail.record.status).toBe('terminated');
    expect(terminate.detail.record.endedAt).toBeTruthy();
    const directory = await testApp.application.container
      .resolve(approvalDirectoryServiceToken)
      .snapshot();
    expect(directory.hasRole(manager.userId, 'approval.admin')).toBe(false);
    expect(
      (
        await managerSession.fetch(
          '/processManagement/executions/oa.overtime/unknown',
        )
      ).status,
    ).toBe(403);
    expect(
      (await managerSession.fetch(`/leaveRequests/${created.id}`)).status,
    ).toBe(403);
    expect(
      (
        await managerSession.fetch(
          `/processManagement/executions/oa.leave/${created.id}/managementActions`,
          json({
            action: 'terminate',
            reason: 'Repeated',
            requestId: randomUUID(),
            expectedVersion: detail.record.version,
          }),
        )
      ).status,
    ).toBe(409);
    const readerSet = definePermissionSet('fixture-process-reader')
      .grant(authz.pages.grant('oa.processManagement'), {
        resource: { type: 'composite', id: 'oa.processManagement.leave' },
        actions: [
          {
            action: 'historyRead',
            policy: {
              type: 'composite',
              scopes: { leaveRequests: 'allRecords' },
            },
          },
        ],
      })
      .build();
    await authz.permissionSets.create(readerSet);
    await authz.permissionSets.assign({
      permissionSet: readerSet.key,
      subject: { type: 'user', id: reviewer.userId },
    });
    const reader = await reviewer.session();
    const readOnly = await value(
      await reader.fetch(
        `/processManagement/executions/oa.leave/${created.id}`,
      ),
    );
    expect(readOnly.actions).toEqual([]);
    expect(
      (
        await reader.fetch(
          `/processManagement/executions/oa.leave/${created.id}/managementOptions`,
          json({ action: 'terminate' }),
        )
      ).status,
    ).toBe(403);
    await authz.permissionSets.revoke(assignment.id);
    expect(
      (
        await managerSession.fetch(
          `/processManagement/executions/oa.leave/${created.id}`,
        )
      ).status,
    ).toBe(403);
    const scopeSet = definePermissionSet('fixture-process-scoped-reader')
      .grant(authz.pages.grant('oa.processManagement'), {
        resource: { type: 'composite', id: 'oa.processManagement.leave' },
        actions: [
          {
            action: 'historyRead',
            policy: {
              type: 'composite',
              scopes: { leaveRequests: 'oa.processManagement.myDepartments' },
            },
          },
        ],
      })
      .build();
    await authz.permissionSets.create(scopeSet);
    await authz.permissionSets.assign({
      permissionSet: scopeSet.key,
      subject: { type: 'user', id: manager.userId },
    });
    expect(
      (
        await managerSession.fetch(
          `/processManagement/executions/oa.leave/${created.id}`,
        )
      ).status,
    ).toBe(404);
    const scopedList = await managerSession.fetch(
      '/processManagement/executions?kind=oa.leave',
    );
    expect(scopedList.status).toBe(200);
    expect((await scopedList.json()).meta.total).toBe(0);
    const audited = await testApp.application.container
      .resolve(db)
      .repository('auditLogs')
      .findMany({ filter: { actorId: manager.userId, targetId: created.id } });
    expect(audited.some((row) => row.action === 'leave.reassign')).toBe(true);
    expect(audited.some((row) => row.action === 'leave.terminate')).toBe(true);
  });
});
