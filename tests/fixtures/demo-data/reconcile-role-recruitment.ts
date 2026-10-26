/** Controlled repair for drafts generated before all sample department accounts existed.
 * Usage: pnpm exec tsx tests/fixtures/demo-data/reconcile-role-recruitment.ts <datasetId>
 * Uses the original actor's HTTP edit command and preserves every other proposal field.
 */
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { createStandaloneServer } from '../../../server/standalone.js';
import { demoDataServiceToken } from '../../../server/providers/demo-data/contract.js';
import { demoContext } from '../../../server/providers/demo-data/context.js';
import { bootstrap } from '../../../cli/commands/lib/trial-data/bootstrap.js';
import {
  trialSession,
  recordOf,
  dataOf,
} from '../../../cli/commands/lib/trial-data/http.js';
import { getTrialAccounts } from '../../../cli/commands/lib/trial-data/accounts.js';
import { scenarios } from '../../../cli/commands/lib/trial-data/scenarios.js';
import type { TrialPasswords } from '../../../cli/commands/lib/trial-data/passwords.js';
import type { DemoDataSet } from '../../../server/providers/demo-data/contract.js';
import type { ScenarioResult } from '../../../cli/commands/lib/trial-data/engine.js';

const expectedId = process.argv[2];
if (!expectedId?.startsWith('demo-'))
  throw new Error('An explicit managed dataset ID is required.');
const server = await createStandaloneServer();
try {
  const app = server.application;
  await app.start();
  const service = app.container.resolve(demoDataServiceToken);
  await service.idle();
  const status = await service.status();
  if (status.datasetId !== expectedId || status.state !== 'ready')
    throw new Error('Expected dataset must be ready.');
  const credentials = await service.credentials(expectedId, status.version);
  const passwords = Object.fromEntries(
    credentials.accounts.map((account) => [account.role, account.password]),
  ) as TrialPasswords;
  const db = app.container.resolve(databaseManagerToken);
  const dataset = await db
    .repository<DemoDataSet>('demoDataSets')
    .findOne({ filter: { id: expectedId } });
  if (!dataset) throw new Error('Dataset missing.');
  const scope = {
    id: expectedId,
    locale: dataset.locale,
    baseDate: dataset.baseDate,
    users: new Set(dataset.accounts.map((a) => a.id)),
    identities: Object.fromEntries(dataset.accounts.map((a) => [a.role, a.id])),
  };
  let repaired = 0;
  await demoContext.run(scope, async () => {
    const facts = await bootstrap(app, passwords, dataset.baseDate);
    const base = scenarios(facts).find((s) => s.key === 'recruitment-review')!;
    const fields = Object.keys(base.body.proposal as Record<string, unknown>);
    const rows: ScenarioResult[] = Object.values(dataset.scenarios);
    for (const row of rows.filter(
      (r) => r.key.startsWith('role-') && r.path === '/recruitmentRequests',
    )) {
      const session = await trialSession(app, row.actor, passwords[row.actor]);
      await session.request('/swagger');
      const record = recordOf(await session.request(`${row.path}/${row.id}`));
      const department = Object.keys(facts.departments).find(
        (key) => facts.departments[key] === record.departmentId,
      );
      if (!department) throw new Error('Unexpected sample department.');
      const accountId = facts.headcountAccountIds[department];
      if (record.accountId === accountId) continue;
      if (
        record.status !== 'draft' ||
        record.applicantId !== session.userId ||
        record.positionId !== facts.positionId ||
        record.year !== facts.year
      )
        throw new Error('Changed sample draft requires separate review.');
      const salary = dataOf(
        await session.request(`${row.path}/${row.id}/salary`),
      );
      const proposal = Object.fromEntries(
        fields.map((field) => [
          field,
          field === 'accountId'
            ? accountId
            : field === 'minimumCents' || field === 'maximumCents'
              ? salary[field]
              : record[field],
        ]),
      );
      await session.request(
        `${row.path}/${row.id}`,
        {
          proposal,
          version: record.lifecycleVersion,
          requestKey: randomUUID(),
          reason:
            'Reconcile the sample recruitment draft with its own department headcount account.',
        },
        'PATCH',
      );
      const updated = recordOf(await session.request(`${row.path}/${row.id}`));
      if (updated.accountId !== accountId || updated.status !== 'draft')
        throw new Error('Sample repair verification failed.');
      repaired++;
    }
  });
  await service.enrichRoleCoverage();
  const after = await service.status();
  const verified = await db
    .repository<DemoDataSet>('demoDataSets')
    .findOne({ filter: { id: expectedId } });
  let verifiedPairs = 0;
  for (const person of getTrialAccounts()) {
    if (person.key === 'system') continue;
    const account = verified!.accounts.find((a) => a.role === person.key)!;
    for (const collection of [
      'leaveRequests',
      'overtimeRequests',
      'attendanceChangeRequests',
      'outingRequests',
      'supplyRequests',
      'generalRequests',
      'certificateRequests',
      'sealRequests',
      'trainingRequests',
      'expensePlans',
      'travelRequests',
      'loanRequests',
      'reimbursementRequests',
      'purchaseRequests',
      'paymentRequests',
      'budgetAdjustments',
      'contractRequests',
      'assetRequests',
      'vehicleRequests',
      'departureRequests',
    ]) {
      const scene = Object.values(verified!.scenarios).find(
        (s) => s.actor === person.key && s.path === `/${collection}`,
      );
      if (!scene)
        throw new Error(
          `Missing representative flow: ${person.key}:${collection}`,
        );
      const record = await db
        .repository(collection)
        .findOne({ filter: { id: scene.id } });
      if (
        !record ||
        record.applicantId !== account.id ||
        record.status !== scene.status
      )
        throw new Error('Representative flow verification failed.');
      verifiedPairs++;
    }
  }
  process.stdout.write(
    JSON.stringify({
      verifiedPairs,
      state: after.state,
      repaired,
      scenarios: after.completedSteps,
    }) + '\n',
  );
} finally {
  await server.close();
}
