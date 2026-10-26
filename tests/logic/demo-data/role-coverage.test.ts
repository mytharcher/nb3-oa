// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { bootstrap } from '../../../cli/commands/lib/trial-data/bootstrap.js';
import { getTrialAccounts } from '../../../cli/commands/lib/trial-data/accounts.js';
import { trialSession } from '../../../cli/commands/lib/trial-data/http.js';
import type {
  ScenarioResult,
  TrialSessions,
} from '../../../cli/commands/lib/trial-data/engine.js';
import {
  demoContext,
  demoContexts,
} from '../../../server/providers/demo-data/context.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { roleCoverage } from '../../../server/providers/demo-data/role-coverage.js';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.js';

let fixture: OrgTestApp;
const scope = {
  id: `demo-${randomUUID()}`,
  locale: 'zh-CN' as const,
  baseDate: '',
  users: new Set<string>(),
};
beforeAll(async () => {
  fixture = await startOrgTestApp();
  scope.baseDate = fixture.testApp.application.container
    .resolve(calendarServiceToken)
    .localDate(new Date());
}, 120000);
afterAll(async () => {
  await fixture?.close();
  for (const id of scope.users) demoContexts.delete(id);
});

it('fills every representative account through its authenticated permissions and resumes without duplicate records', async () => {
  await demoContext.run(scope, async () => {
    const app = fixture.testApp.application;
    const db = fixture.testApp.database;
    await db.repository('demoDataSets').createOne({
      values: {
        id: scope.id,
        locale: scope.locale,
        baseDate: scope.baseDate,
        timeZone: 'Asia/Singapore',
        state: 'importing',
        version: 1,
        actorId: 'isolated-role-test',
        accounts: [],
        totalSteps: 0,
        scenarios: {},
        failures: [],
        credentials: null,
        progress: 'initializing',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const password = '12345678';
    const facts = await bootstrap(app, password, scope.baseDate);
    const sessions = {} as TrialSessions;
    for (const person of getTrialAccounts()) {
      if (person.key !== 'system')
        sessions[person.key] = await trialSession(app, person.key, password);
    }
    await sessions.hr.request('/swagger');
    const saved: Record<string, ScenarioResult> = {};
    const failures: { key: string; error: unknown }[] = [];
    const checkpoint = async (row: ScenarioResult) => {
      saved[row.key] = row;
    };
    const failure = (key: string, error: unknown) => {
      failures.push({ key, error: String(error) });
    };
    await roleCoverage(app, sessions, facts, saved, checkpoint, failure);
    expect(failures).toEqual([]);
    for (const person of getTrialAccounts()) {
      if (person.key === 'system') continue;
      for (const path of [
        '/leaveRequests',
        '/attendanceChangeRequests',
        '/generalRequests',
        '/contractRequests',
        '/certificateRequests',
        '/sealRequests',
        '/vehicleRequests',
        '/budgetAdjustments',
      ]) {
        const row = Object.values(saved).find(
          (r) => r.actor === person.key && r.path === path,
        );
        expect(row, `${person.key}: ${path}`).toBeDefined();
        const record = await db
          .repository(path.slice(1))
          .findOne({ filter: { id: row!.id } });
        expect(record!.applicantId).toBe(facts.users[person.key]);
      }
    }
    for (const row of Object.values(saved).filter(
      (r) => r.path === '/recruitmentRequests',
    )) {
      const request = await db
        .repository('recruitmentRequests')
        .findOne({ filter: { id: row.id } });
      const account = await db
        .repository('headcountAccounts')
        .findOne({ filter: { id: String(request!.accountId) } });
      expect(account).toMatchObject({
        departmentId: request!.departmentId,
        positionId: request!.positionId,
        year: request!.year,
        initialized: true,
      });
    }
    expect(new Set(Object.values(saved).map((r) => r.status))).toEqual(
      new Set(['draft', 'manager', 'withdrawn']),
    );
    const before = await db
      .repository('demoDataRecords')
      .count({ filter: { datasetId: scope.id } });
    const rowsBefore = structuredClone(saved);
    await roleCoverage(app, sessions, facts, saved, checkpoint, failure);
    expect(failures).toEqual([]);
    expect(saved).toEqual(rowsBefore);
    expect(
      await db
        .repository('demoDataRecords')
        .count({ filter: { datasetId: scope.id } }),
    ).toBe(before);
  });
}, 900000);
