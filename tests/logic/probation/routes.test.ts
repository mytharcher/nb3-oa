// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { startOrgTestApp, json, type OrgTestApp } from '../org/helpers.ts';
import { composite } from '../employees/helpers.ts';
import {
  probationServiceToken,
  type ProbationService,
} from '../../../server/providers/probation/contract.js';
import { publicRecordFields } from '../../../server/routes/probation/schemas.js';
let app: OrgTestApp;
let service: ProbationService;
const users: Record<string, TestSession> = {};
let requestId = '';
let foreignTaskId = '';
let hrInput: {
  action: string;
  target: { taskId: string };
  contentHash: string;
  requestId: string;
};
function mockView(read: RepositoryPolicy['read'] | 'deny') {
  const original = app.authz.for.bind(app.authz);
  return vi.spyOn(app.authz, 'for').mockImplementation((identity) => {
    const context = original(identity);
    return {
      ...context,
      authorize: async (check) => {
        const decision = await context.authorize(check);
        if (
          check.resource.type !== 'composite' ||
          check.resource.id !== 'oa.probation' ||
          check.action !== 'view'
        )
          return decision;
        if (read === 'deny') return { effect: 'deny' as const };
        const policy = decision.conditions?.database?.probationRequests;
        if (!policy) return decision;
        return {
          ...decision,
          conditions: {
            ...decision.conditions,
            database: {
              ...decision.conditions?.database,
              probationRequests: { ...policy, read },
            },
          },
        };
      },
    };
  });
}
async function answer(
  id: string,
  actor: string,
  data: Record<string, unknown>,
) {
  const detail = await service.detail(id, users[actor].user.id);
  const offer = detail.taskActions.find((t) =>
    t.actions.some((a) => a.name === 'approve'),
  )!;
  const run = detail.runs.find((v) => v.run.id === offer.task.runId)!;
  await service.action(
    id,
    {
      action: 'approve',
      target: { taskId: offer.task.id },
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
      ...(Object.keys(data).length ? { input: { data } } : {}),
    },
    users[actor].user.id,
  );
}
describe('probation registered HTTP boundaries', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    service = app.testApp.application.container.resolve(probationServiceToken);
    for (const name of [
      'hr',
      'manager',
      'head',
      'applicant',
      'other',
      'viewer',
      'outsider',
    ]) {
      users[name] = await app.createUser(`probation-route-${name}`);
      await db.repository('employees').createOne({
        values: {
          id: `route-probation-${name}`,
          code: `R-P-${name}`,
          name,
          userId: users[name].user.id,
          managerId: ['applicant', 'other'].includes(name)
            ? 'route-probation-manager'
            : null,
          status: ['applicant', 'other'].includes(name)
            ? 'probation'
            : 'regular',
          probationEndDate: ['applicant', 'other'].includes(name)
            ? '2026-11-01'
            : null,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    const department = await app.organization.createDepartment(
      { title: 'Probation HTTP', managerId: users.head.user.id },
      { actorId: users.hr.user.id },
    );
    for (const name of ['applicant', 'other'])
      await app.organization.addMember(
        {
          departmentId: department.id,
          userId: users[name].user.id,
          primary: true,
        },
        { actorId: users.hr.user.id },
      );
    await app.organization.addDutyRoleMember('hr', users.hr.user.id, {
      actorId: users.hr.user.id,
    });
    await db.repository('grades').createOne({
      values: {
        id: 'route-probation-grade',
        code: 'R-P-G',
        title: 'Junior',
        rank: 1,
        active: true,
      },
    });
    const key = `probation-routes-${randomUUID()}`;
    await app.authz.permissionSets.create({
      key,
      title: key,
      grants: [
        composite('oa.probation', {
          delegate: { probationRequests: 'allRecords' },
          view: { probationRequests: 'allRecords' },
          compensation: {
            probationRequests: 'allRecords',
            probationCompensationProposals: 'allRecords',
          },
        }),
      ],
    });
    await app.authz.permissionSets.assign({
      permissionSet: key,
      subject: { type: 'user', id: users.hr.user.id },
    });
    const viewerKey = `probation-viewer-${randomUUID()}`;
    await app.authz.permissionSets.create({
      key: viewerKey,
      title: viewerKey,
      grants: [
        composite('oa.probation', {
          view: { probationRequests: 'allRecords' },
        }),
      ],
    });
    await app.authz.permissionSets.assign({
      permissionSet: viewerKey,
      subject: { type: 'user', id: users.viewer.user.id },
    });
    const response = await users.hr.fetch(
      '/probationRequests',
      json({
        employeeId: 'route-probation-applicant',
        selfEvaluation: 'Targets met',
      }),
    );
    if (response.status !== 201) throw new Error('HR draft creation failed.');
    const body = (await response.json()) as {
      data: {
        record: {
          id: string;
          lifecycleVersion: number;
          applicantId: string;
          createdById: string;
        };
      };
    };
    requestId = body.data.record.id;

    await service.transition(
      requestId,
      'submit',
      users.applicant.user.id,
      body.data.record.lifecycleVersion,
      randomUUID(),
    );
    await answer(requestId, 'manager', {
      evaluation: 'Qualified',
      conclusion: 'regular',
      deferredTo: null,
    });
    await answer(requestId, 'head', {});
    const detail = await service.detail(requestId, users.hr.user.id);
    const offer = detail.taskActions.find((t) =>
      t.actions.some((a) => a.name === 'approve'),
    )!;
    const run = detail.runs.find((v) => v.run.id === offer.task.runId)!;
    hrInput = {
      action: 'approve',
      target: { taskId: offer.task.id },
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
    };
    const foreign = await service.create(
      { employeeId: 'route-probation-other', selfEvaluation: 'Other employee' },
      users.hr.user.id,
      users.other.user.id,
    );
    await service.transition(
      String(foreign.record.id),
      'submit',
      users.other.user.id,
      Number(foreign.record.lifecycleVersion),
      randomUUID(),
    );
    foreignTaskId = (
      await service.detail(String(foreign.record.id), users.manager.user.id)
    ).taskActions.find((t) => t.actions.some((a) => a.name === 'approve'))!.task
      .id;
  }, 120000);
  afterAll(async () => app?.close());
  it('derives the applicant from the employee archive and limits manual creation to HR', async () => {
    const record = (await service.detail(requestId, users.hr.user.id)).record;
    expect(record.applicantId).toBe(users.applicant.user.id);
    expect(record.createdById).toBe(users.hr.user.id);
    expect(
      (
        await users.viewer.fetch(
          '/probationRequests',
          json({
            employeeId: 'route-probation-applicant',
            selfEvaluation: 'Proxy',
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await users.hr.fetch(
          '/probationRequests',
          json({
            employeeId: 'route-probation-applicant',
            applicantId: users.outsider.user.id,
            selfEvaluation: 'Proxy',
          }),
        )
      ).status,
    ).toBe(400);
  });
  it('projects probation into the approval center without private compensation amounts', async () => {
    const response = await users.applicant.fetch(
      '/approvalCenter?view=mine&kind=oa.probation',
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    const entry = result.data.find(
      (row: { id: string }) => row.id === requestId,
    );
    expect(entry).toMatchObject({
      id: requestId,
      kind: 'oa.probation',
      amount: null,
      unit: null,
    });
    expect(entry).not.toHaveProperty('baseSalary');
    expect(entry).not.toHaveProperty('compensationProposalId');
    const foreign = await users.outsider.fetch(
      '/approvalCenter?view=mine&kind=oa.probation',
    );
    expect(foreign.status).toBe(200);
    expect((await foreign.json()).data).toEqual([]);
  });
  it('reports actual HR identity for manual-create availability', async () => {
    const hr = await users.hr.fetch('/probationRequests/options');
    const employee = await users.applicant.fetch('/probationRequests/options');
    expect(hr.status).toBe(200);
    expect(employee.status).toBe(200);
    expect((await hr.json()).data.canCreateManualDraft).toBe(true);
    expect((await employee.json()).data.canCreateManualDraft).toBe(false);
  });
  it('requires authentication and rejects a caller with no record access', async () => {
    expect(
      (await app.testApp.request(`/probationRequests/${requestId}`)).status,
    ).toBe(401);
    expect(
      (await users.outsider.fetch(`/probationRequests/${requestId}`)).status,
    ).toBe(403);
    const deny = mockView('deny');
    try {
      expect(
        (await users.hr.fetch(`/probationRequests/${requestId}`)).status,
      ).toBe(403);
    } finally {
      deny.mockRestore();
    }
  });
  it('declares its registered routes in the actual application API document', async () => {
    const admin = await app.admin();
    const response = await admin.fetch('/swagger');
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('createProbationRequest');
    expect(text).toContain('probationCandidates');
    expect(text).toContain('/probationRequests/{id}/compensation');
  });
  it('does not turn an ordinary view grant into private salary access', async () => {
    expect(
      (await users.viewer.fetch(`/probationRequests/${requestId}`)).status,
    ).toBe(200);
    expect(
      (await users.viewer.fetch(`/probationRequests/${requestId}/compensation`))
        .status,
    ).toBe(403);
  });
  it('does not replace ordinary record scope with a broad private compensation grant', async () => {
    const scope = mockView({
      scope: { id: randomUUID() },
      fields: [...publicRecordFields],
    });
    try {
      expect(
        (await users.hr.fetch(`/probationRequests/${requestId}/compensation`))
          .status,
      ).toBe(403);
    } finally {
      scope.mockRestore();
    }
  });
  it('refuses field-hidden SDK subjects instead of exposing an unprojected record', async () => {
    const fields = mockView({ scope: true, fields: ['id', 'applicantId'] });
    try {
      expect(
        (await users.hr.fetch(`/probationRequests/${requestId}`)).status,
      ).toBe(403);
    } finally {
      fields.mockRestore();
    }
  });
  it('validates exact-one candidate target and refuses a task from another application', async () => {
    expect(
      (
        await users.hr.fetch(
          `/probationRequests/${requestId}/candidates?action=transfer`,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await users.hr.fetch(
          `/probationRequests/${requestId}/candidates?action=transfer&taskId=${foreignTaskId}`,
        )
      ).status,
    ).toBe(403);
  });
  it('rejects nested salary/reference injection without persisting the payload in SDK history', async () => {
    for (const data of [
      { baseSalary: '99123.45' },
      { salaryProposalId: randomUUID() },
    ]) {
      const response = await users.hr.fetch(
        `/probationRequests/${requestId}/action`,
        json({ ...hrInput, requestId: randomUUID(), input: { data } }),
      );
      expect(response.status).toBe(400);
    }
    const detail = await users.hr.fetch(`/probationRequests/${requestId}`);
    expect(detail.status).toBe(200);
    expect(await detail.text()).not.toContain('99123.45');
    expect(
      (await service.detail(requestId, users.hr.user.id)).record.status,
    ).toBe('hr');
  });
});
