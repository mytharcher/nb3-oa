import { PRINT_SOURCES } from '../template-print/contract.js';
import { completedStories } from './fulfillment.js';
import { historicalScenarios } from './history.js';
import { validateDemo } from './validate.js';
import { richResources } from './resources.js';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { scopedApiKeysToken } from '@nocobase/app-plugin-api-keys/server';
import { bootstrap } from '../../../cli/commands/lib/trial-data/bootstrap.js';
import {
  getTrialAccounts,
  trialEmail,
  trialUsername,
} from '../../../cli/commands/lib/trial-data/accounts.js';
import { trialSession } from '../../../cli/commands/lib/trial-data/http.js';
import { collaboration } from '../../../cli/commands/lib/trial-data/collaboration.js';
import { scenarios } from '../../../cli/commands/lib/trial-data/scenarios.js';
import {
  populateScenario,
  type TrialSessions,
} from '../../../cli/commands/lib/trial-data/engine.js';
import { followUps } from '../../../cli/commands/lib/trial-data/follow-ups.js';
import type { TrialPasswords } from '../../../cli/commands/lib/trial-data/passwords.js';
import { currentDemo, registerDemoUser } from './context.js';
import type { DemoAccount, DemoDataSet } from './contract.js';
import { sampleFailureReason } from './errors.js';
import { loggingToken } from '@nocobase/app-server/logging';

/** Reuses public business creation/approval paths. No SDK run or task table is written here. */
export async function generateDemo(
  app: Application,
  dataset: DemoDataSet,
  passwords: TrialPasswords,
  save: (patch: Partial<DemoDataSet>) => Promise<void>,
) {
  const scope = currentDemo()!;
  const db = app.container.resolve(databaseManagerToken);
  const facts = await bootstrap(app, passwords, dataset.baseDate);
  scope.identities = { ...facts.users };
  const accounts: DemoAccount[] = getTrialAccounts().map((p) => ({
    role: p.key,
    id: facts.users[p.key],
    name: p.name,
    email: trialEmail(p.key),
    username: trialUsername(p.key),
  }));
  await save({
    accounts,
    progress: 'workflows',
    totalSteps:
      2 +
      2 * (getTrialAccounts().length - 1) +
      PRINT_SOURCES.length +
      20 +
      scenarios(facts).length +
      17 +
      7 +
      7,
  });
  for (const userId of Object.values(facts.users))
    registerDemoUser(userId, scope);
  const keys = app.container.resolve(scopedApiKeysToken);
  // This service identity never has a password or browser session. Its one ephemeral
  // key is revoked even when a business step fails; credentials never leave the job.
  const issued = await keys.issueChecked(facts.users.system, {
    name: 'Demo data generation',
    description: null,
    scope: null,
    expiresInDays: 1,
  });
  scope.systemKey = issued.secret;
  const sessions = {} as TrialSessions;
  const saved = { ...dataset.scenarios };
  const failures: DemoDataSet['failures'] = [];
  const failure = (key: string, error: unknown) => {
    const detail = {
      key,
      module: scenarios(facts)
        .find((s) => s.key === key)
        ?.path.slice(1),
      reason: sampleFailureReason(error, 'DEMO_SCENARIO_FAILED'),
    };
    failures.push(detail);
    app.container
      .resolve(loggingToken)
      .getLogger('oa-sample-data')
      .warn({ datasetId: dataset.id, ...detail }, 'OA sample scenario failed');
  };
  const checkpoint = async (row: (typeof saved)[string]) => {
    saved[row.key] = row;
    await save({ scenarios: { ...saved }, progress: row.key });
  };
  try {
    for (const person of getTrialAccounts())
      sessions[person.key] = await trialSession(
        app,
        person.key,
        passwords[person.key],
      );
    await sessions.hr.request('/swagger');
    for (const row of await collaboration(app, facts)) await checkpoint(row);
    await richResources(app, facts, checkpoint);
    for (const scenario of scenarios(facts)) {
      try {
        await checkpoint(
          await populateScenario(
            app,
            sessions,
            facts,
            scenario,
            saved[scenario.key],
          ),
        );
      } catch (error) {
        failure(scenario.key, error);
      }
    }
    await followUps(
      app,
      sessions,
      facts,
      passwords,
      saved,
      checkpoint,
      failure,
    );
    await completedStories(app, sessions, facts, saved, checkpoint);
    await historicalScenarios(app, sessions, facts, saved, checkpoint);
    // Check every persisted sample against its actual business record, independently
    // of the generator's declared target stage.
    for (const row of Object.values(saved)) {
      if (!row.id || !row.path.startsWith('/'))
        throw new Error('DEMO_INVALID_CHECKPOINT');
    }
    await save({
      scenarios: saved,
      failures,
      state: failures.length ? 'importFailed' : 'importing',
      progress: failures.length ? 'failed' : 'complete',
    });
    const ownedUsers = await db
      .repository('demoDataRecords')
      .findMany({ filter: { datasetId: dataset.id, collection: '@user' } });
    const users = app.container.resolve(userAdministrationServiceToken);
    for (const owned of ownedUsers) {
      const id = String((owned.key as { id: string }).id);
      if (accounts.some((a) => a.id === id) || id === facts.users.system)
        continue;
      const user = await users.get(id);
      if (user)
        accounts.push({
          role: 'newhire',
          id,
          name: user.name,
          email: user.email,
          username: user.username ?? '',
        });
    }
    if (!failures.length)
      await validateDemo(app, { ...dataset, accounts, scenarios: saved });
    await save({ accounts, state: failures.length ? 'importFailed' : 'ready' });
  } finally {
    await keys.revokeAll(facts.users.system);
    delete scope.systemKey;
  }
}
