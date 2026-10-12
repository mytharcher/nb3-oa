// @vitest-environment node
import { randomUUID } from 'node:crypto';
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from 'vitest';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { startOrgTestApp, json, type OrgTestApp } from '../org/helpers.ts';
import {
  departureServiceToken,
  type DepartureService,
} from '../../../server/providers/departure/contract.js';
import { probationDepartureAdapterToken } from '../../../server/providers/probation/contract.js';
let app: OrgTestApp;
let service: DepartureService;
const sessions: Record<string, TestSession> = {};
const employees: Record<string, string> = {};
let ownId: string;
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
          check.resource.id !== 'oa.departure' ||
          check.action !== 'view'
        )
          return decision;
        if (read === 'deny') return { effect: 'deny' as const };
        const policy = decision.conditions?.database?.departureRequests;
        if (!policy) return decision;
        return {
          ...decision,
          conditions: {
            ...decision.conditions,
            database: {
              ...decision.conditions?.database,
              departureRequests: { ...policy, read },
            },
          },
        };
      },
    };
  });
}
describe('departure registered HTTP contracts and scopes', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);
    service = c.resolve(departureServiceToken);
    for (const name of ['applicant', 'target', 'hr', 'outsider']) {
      sessions[name] = await app.createUser(`departure-http-${name}`);
      employees[name] = randomUUID();
      await db.repository('employees').createOne({
        values: {
          id: employees[name],
          code: employees[name],
          name,
          userId: sessions[name].user.id,
          status: 'regular',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    await db.repository('dutyRoleMembers').createOne({
      values: {
        id: randomUUID(),
        dutyRoleCode: 'hr',
        userId: sessions.hr.user.id,
        active: true,
      },
    });
    ownId = String(
      (
        await service.create(
          { departureType: 'resignation', reason: 'Self request' },
          sessions.applicant.user.id,
        )
      ).record.id,
    );
  }, 120000);
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => app?.close());
  it('registers a real adapter and refuses anonymous requests', async () => {
    const c = app.testApp.application.container;
    expect(c.has(probationDepartureAdapterToken)).toBe(true);
    expect((await app.testApp.request('/departureRequests')).status).toBe(401);
  });
  it('registers a translated public Scheduler target and schedule', async () => {
    const admin = await app.admin();
    const response = await admin.fetch('/scheduler/schedules?pageSize=100');
    expect(response.status).toBe(200);
    const rows = (await response.json()).data;
    const departure = rows.find(
      (row: { targetType: string }) =>
        row.targetType === 'app.departure-execution',
    );
    expect(departure).toMatchObject({
      targetState: 'ready',
      lifecycleState: 'active',
      cron: '30 0 * * *',
    });
    expect(['离职生效执行', 'Departure execution']).toContain(
      departure.title,
    );
    expect(departure.targetSummary.targetLabel).toBe(departure.title);
  });
  it('returns distinct creation eligibility, scoped recipients and honest draft readiness', async () => {
    const selfOptions = await sessions.applicant.fetch(
      '/departureRequests/options',
    );
    expect(selfOptions.status).toBe(200);
    expect((await selfOptions.json()).data).toMatchObject({
      canCreateSelfDraft: true,
      canCreateManualDraft: false,
      actor: { id: sessions.applicant.user.id },
    });
    const hrOptions = await sessions.hr.fetch('/departureRequests/options');
    expect((await hrOptions.json()).data.canCreateManualDraft).toBe(true);
    const candidates = await sessions.applicant.fetch(
      '/departureRequests/handoverCandidates',
    );
    expect(candidates.status).toBe(200);
    const candidateData = (await candidates.json()).data;
    expect(
      candidateData.items.some(
        (user: { id: string }) => user.id === sessions.applicant.user.id,
      ),
    ).toBe(false);
    expect(
      candidateData.items.some(
        (user: { id: string }) => user.id === sessions.target.user.id,
      ),
    ).toBe(true);
    expect(
      (
        await sessions.applicant.fetch(
          `/departureRequests/handoverCandidates?employeeId=${employees.target}`,
        )
      ).status,
    ).toBe(403);
    const detail = await sessions.applicant.fetch(
      `/departureRequests/${ownId}`,
    );
    const data = (await detail.json()).data;
    expect(data.readyForSubmission).toBe(false);
    expect(data.blockedBy).toContain('DEPARTURE_APPLICATION_INCOMPLETE');
    expect(
      (await service.list(sessions.applicant.user.id, undefined, 'mine')).map(
        (row) => row.id,
      ),
    ).toContain(ownId);
  });
  it('creates self and HR delegated drafts with resolved actual target identity and no employee status change', async () => {
    const self = await sessions.outsider.fetch(
      '/departureRequests',
      json({ departureType: 'resignation', reason: 'Own resignation' }),
    );
    expect(self.status).toBe(201);
    expect((await self.json()).data.record).toMatchObject({
      applicantId: sessions.outsider.user.id,
      applicant: {
        id: sessions.outsider.user.id,
        name: 'departure-http-outsider',
      },
      status: 'draft',
    });
    expect(
      (
        await sessions.hr.fetch(
          '/departureRequests',
          json({
            employeeId: employees.target,
            departureType: 'resignation',
            reason: 'Invalid delegated resignation',
          }),
        )
      ).status,
    ).toBe(403);
    const target = await sessions.hr.fetch(
      '/departureRequests',
      json({
        employeeId: employees.target,
        departureType: 'contractExpiry',
        reason: 'Contract ends',
      }),
    );
    expect(target.status).toBe(201);
    expect((await target.json()).data.record).toMatchObject({
      employeeId: employees.target,
      applicantId: sessions.target.user.id,
      createdById: sessions.hr.user.id,
      applicant: { id: sessions.target.user.id, name: 'departure-http-target' },
    });
    expect(
      (
        await app.testApp.application.container
          .resolve(databaseManagerToken)
          .repository('employees')
          .findOne({ filter: { id: employees.target } })
      )?.status,
    ).toBe('regular');
  });
  it('denies outsider HR proxy and a different employee record even with authenticated defaults', async () => {
    expect(
      (
        await sessions.outsider.fetch(
          '/departureRequests',
          json({
            employeeId: employees.target,
            departureType: 'dismissal',
            reason: 'Invalid proxy',
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (await sessions.outsider.fetch(`/departureRequests/${ownId}`)).status,
    ).toBe(403);
  });
  it('requires view grant and ordinary scoped fields for owner and HR', async () => {
    mockView('deny');
    expect(
      (await sessions.applicant.fetch(`/departureRequests/${ownId}`)).status,
    ).toBe(403);
    vi.restoreAllMocks();
    mockView({ scope: { id: 'outside' }, fields: ['id'] });
    expect(
      (await sessions.hr.fetch(`/departureRequests/${ownId}`)).status,
    ).toBe(403);
    vi.restoreAllMocks();
    mockView({ scope: true, fields: ['id'] });
    expect(
      (await sessions.applicant.fetch(`/departureRequests/${ownId}`)).status,
    ).toBe(403);
  });
  it('rejects client source bindings and recursive salary injection before persistence', async () => {
    expect(
      (
        await sessions.hr.fetch(
          '/departureRequests',
          json({
            employeeId: employees.target,
            departureType: 'declinedProbation',
            reason: 'Fake source',
            sourceProbationId: randomUUID(),
          }),
        )
      ).status,
    ).toBe(400);
    const input = {
      target: { taskId: randomUUID() },
      action: 'approve',
      requestId: randomUUID(),
      input: { data: { nested: { baseSalary: '42424.24' } } },
    };
    const result = await sessions.applicant.fetch(
      `/departureRequests/${ownId}/actions`,
      json(input),
    );
    expect(result.status).toBe(400);
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    for (const collection of [
      'departureRequests',
      'oaLifecycleTransitions',
      'auditLogs',
    ])
      expect(
        JSON.stringify(await db.repository(collection).findMany()),
      ).not.toContain('42424.24');
  });
  it('refuses a work item from another request before running the independent lifecycle', async () => {
    const result = await sessions.applicant.fetch(
      `/departureRequests/${ownId}/workItems/${randomUUID()}/actions`,
      json({ action: 'claim', version: 1, requestId: randomUUID(), input: {} }),
    );
    expect(result.status).toBe(403);
  });
});
