// @vitest-environment node
import { expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { startOrgTestApp } from './org/helpers.ts';
import { bootstrap } from '../../cli/commands/lib/trial-data/bootstrap.ts';
import { trialAccounts } from '../../cli/commands/lib/trial-data/accounts.ts';
import { trialSession } from '../../cli/commands/lib/trial-data/http.ts';
import { scenarios } from '../../cli/commands/lib/trial-data/scenarios.ts';
import { cloneScenario } from '../../cli/commands/lib/trial-data/follow-ups.ts';
import {
  populateScenario,
  setLegacyDutyReplacements,
  type TrialSessions,
} from '../../cli/commands/lib/trial-data/engine.ts';

it('moves only explicitly selected old sample duties and recovers a held trial stage through the administrator offer', async () => {
  const fixture = await startOrgTestApp();
  try {
    const app = fixture.testApp.application;
    const users = app.container.resolve(userAdministrationServiceToken);
    const legacy = await users.create({
      name: 'Historical fixture',
      email: 'oa.test001@example.test',
      username: 'legacy_fixture',
      password: 'Legacy-fixture-2026!',
    });
    const control = await users.create({
      name: 'Preserved fixture',
      email: 'preserved@example.test',
      username: 'preserved_fixture',
      password: 'Preserved-fixture-2026!',
    });
    await fixture.organization.addDutyRoleMember('gm', legacy.id, {
      actorId: legacy.id,
    });
    await fixture.organization.addDutyRoleMember('legal', control.id, {
      actorId: control.id,
    });
    const password = 'Isolated-trial-migration-2026!';
    const facts = await bootstrap(app, password);
    expect(await fixture.organization.listDutyRoleMembers('gm')).toContain(
      legacy.id,
    );
    await fixture.organization.removeDutyRoleMember('gm', legacy.id, {
      actorId: legacy.id,
    });
    await fixture.organization.removeDutyRoleMember('gm', facts.users.gm, {
      actorId: facts.users.system,
    });
    const sessions = {} as TrialSessions;
    for (const person of trialAccounts)
      sessions[person.key] = await trialSession(app, person.key, password);
    const source = scenarios(facts).find((s) => s.key === 'expense-plan-head')!;
    const scenario = cloneScenario(source, 'expense-plan-gm', {
      stopAt: 'gm',
      body: {
        ...source.body,
        reason: 'oa-trial-v1·expense-plan-gm',
        amountCents: 30000000,
      },
    });
    await expect(
      populateScenario(app, sessions, facts, scenario),
    ).rejects.toThrow('no trial role');
    await fixture.organization.addDutyRoleMember('gm', legacy.id, {
      actorId: legacy.id,
    });
    await bootstrap(app, password, undefined, true);
    expect(await fixture.organization.listDutyRoleMembers('gm')).toEqual([
      facts.users.gm,
    ]);
    expect(await fixture.organization.listDutyRoleMembers('legal')).toContain(
      control.id,
    );
    expect(
      await app.container
        .resolve(databaseManagerToken)
        .repository('user')
        .findOne({ filter: { id: legacy.id } }),
    ).toMatchObject({ email: 'oa.test001@example.test' });
    setLegacyDutyReplacements(sessions, { [legacy.id]: 'gm' });
    const recovered = await populateScenario(app, sessions, facts, scenario);
    expect(recovered.status).toBe('gm');
    const detail = await sessions.gm.request(
      `${scenario.path}/${recovered.id}`,
    );
    expect(JSON.stringify(detail)).toContain('approve');
    expect(
      await app.container
        .resolve(databaseManagerToken)
        .repository('expensePlans')
        .count(),
    ).toBe(1);
  } finally {
    await fixture.close();
  }
}, 120000);
