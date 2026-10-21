// @vitest-environment node
import { databaseManagerToken } from '@nocobase/db';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.js';
import { bootstrap } from '../../../cli/commands/lib/trial-data/bootstrap.js';
import { scenarios } from '../../../cli/commands/lib/trial-data/scenarios.js';
import {
  populateScenario,
  type TrialSessions,
} from '../../../cli/commands/lib/trial-data/engine.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { trialSession } from '../../../cli/commands/lib/trial-data/http.js';
import {
  demoContext,
  demoContexts,
} from '../../../server/providers/demo-data/context.js';

let fixture: OrgTestApp;
const scope = {
  id: `demo-${randomUUID()}`,
  locale: 'zh-CN' as const,
  baseDate: '2026-10-21',
  users: new Set<string>(),
};
beforeAll(async () => {
  fixture = await startOrgTestApp();
  const admin = await fixture.admin();
  for (const role of ['gm', 'hrDirector', 'hrbp', 'hr']) {
    await fixture.organization.addDutyRoleMember(role, admin.user.id, {
      actorId: admin.user.id,
      reason: 'Existing business role regression fixture',
    });
  }
}, 120000);
afterAll(async () => {
  await fixture?.close();
  for (const id of scope.users) demoContexts.delete(id);
});
it('imports and resumes recruitment and transfer samples through their public commands', async () => {
  await demoContext.run(scope, async () => {
    const app = fixture.testApp.application;
    const password = 'isolated-demo-test-password';
    await app.container
      .resolve(databaseManagerToken)
      .repository('demoDataSets')
      .createOne({
        values: {
          id: scope.id,
          locale: scope.locale,
          baseDate: scope.baseDate,
          timeZone: 'Asia/Singapore',
          state: 'importing',
          version: 1,
          actorId: (await fixture.admin()).user.id,
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
    const facts = await bootstrap(app, password, scope.baseDate);
    const sessions = {
      head: await trialSession(app, 'head', password),
      hr: await trialSession(app, 'hr', password),
    } as TrialSessions;
    await sessions.hr.request('/swagger');
    for (const key of ['recruitment-review', 'transfer-review']) {
      const scenario = scenarios(facts).find((row) => row.key === key)!;
      // Recover a draft committed before a failed submit, without a checkpoint.
      if (key === 'recruitment-review')
        await sessions.head.request(scenario.path, scenario.body);
      const result = await populateScenario(app, sessions, facts, scenario);
      const stored = await app.container
        .resolve(databaseManagerToken)
        .repository(scenario.collection)
        .findOne({ filter: { id: result.id } });
      expect(stored?.snapshot).toMatchObject(
        key === 'recruitment-review'
          ? {
              gmId: facts.users.gm,
              hrDirectorId: facts.users.hrDirector,
              hrbpIds: [facts.users.hrbp],
            }
          : { gmId: facts.users.gm, hrIds: [facts.users.hr] },
      );
      expect(await populateScenario(app, sessions, facts, scenario)).toEqual(
        result,
      );
      expect(result.status).not.toBe('draft');
      expect(
        await populateScenario(app, sessions, facts, scenario, result),
      ).toEqual(result);
    }
  });
  const admin = await fixture.admin();
  const org = fixture.testApp.application.container.resolve(orgServiceToken);
  for (const role of ['gm', 'hrDirector', 'hrbp', 'hr'])
    expect(await org.dutyRoleMembers(role)).toContain(admin.user.id);
}, 120000);
