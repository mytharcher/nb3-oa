// @vitest-environment node
import { expect } from 'vitest';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { trialEmail } from '../../../cli/commands/lib/trial-data/accounts.js';
import { write } from '../platform/helpers.js';
import { createRequestKey } from '../../../client/lib/request-key.js';
import { databaseManagerToken } from '@nocobase/db';
import { bootstrap } from '../../../cli/commands/lib/trial-data/bootstrap.js';
import { populateHeadcountSamples } from '../../../cli/commands/lib/trial-data/headcounts.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/index.js';
import { test } from './helpers.js';
test('headcount-only supplement creates fictional teaching accounts and preserves existing quota and unrelated data on rerun', async ({
  testApp,
}) => {
  const app = testApp.application,
    db = app.container.resolve(databaseManagerToken),
    service = app.container.resolve(headcountServiceToken);
  const facts = await bootstrap(app, 'Isolated-headcount-trial-2026!');
  const before = (await service.balance(facts.accountId, db.connection()))!;
  await db.transaction((tx) =>
    service.adjustLimit(
      {
        actorId: facts.users.system,
        accountId: before.id,
        expectedVersion: before.version,
        limit: 55,
        reason: 'User changed example quota',
        requestKey: 'user-headcount-change',
      },
      tx,
    ),
  );
  const usersBefore = await db.repository('user').count(),
    flowsBefore = await db.repository('recruitmentRequests').count();
  const preview = await populateHeadcountSamples(app, true);
  expect(preview.dryRun).toBe(true);
  expect(await db.repository('headcountAccounts').count()).toBe(2);
  const first = await populateHeadcountSamples(app);
  expect(first.accounts).toHaveLength(8);
  expect(
    first.accounts.filter((a) => 'initialized' in a && a.initialized),
  ).toHaveLength(7);
  const a = (await service.balance(facts.accountId, db.connection()))!;
  expect(a.limit).toBe(55);
  expect(a.used).toBe(before.used);
  const journal = await db.repository('headcountJournal').count();
  await populateHeadcountSamples(app);
  expect(await db.repository('headcountAccounts').count()).toBe(8);
  expect(await db.repository('headcountJournal').count()).toBe(journal);
  expect(await db.repository('user').count()).toBe(usersBefore);
  expect(await db.repository('recruitmentRequests').count()).toBe(flowsBefore);
  expect(
    (await service.balance(facts.accountId, db.connection()))!.version,
  ).toBe(a.version);
  const head = await signIn(testApp, {
    email: trialEmail('head'),
    password: 'Isolated-headcount-trial-2026!',
  });
  const year = first.year;
  const query = new URLSearchParams({
    mode: 'create',
    departmentId: facts.departments.engineering,
    positionId: facts.positionId,
    year: String(year),
  });
  const options = await head.fetch(
    `/recruitmentRequests/capacityOptions?${query}`,
  );
  expect(options.status).toBe(200);
  expect(
    (await options.json()).data.map((v: { id: string }) => v.id),
  ).toContain(facts.accountId);
  const teaching = first.accounts.find(
    (v) => 'initialized' in v && !v.initialized,
  )!;
  const teachingBalance = (await service.balance(
    teaching.id,
    db.connection(),
  ))!;
  query.set('positionId', teachingBalance.positionId);
  expect(
    (
      await (
        await head.fetch(`/recruitmentRequests/capacityOptions?${query}`)
      ).json()
    ).data,
  ).toEqual([]);
  const created = await head.fetch(
    '/recruitmentRequests',
    write('POST', {
      requestKey: createRequestKey(),
      reason: 'Sample capacity draft',
      proposal: {
        departmentId: facts.departments.engineering,
        positionId: facts.positionId,
        gradeId: facts.gradeId,
        accountId: facts.accountId,
        year,
        quantity: 1,
        kind: 'additional',
        replacementEmployeeIds: [],
        minimumCents: 600000,
        maximumCents: 700000,
        expectedStartDate: `${year}-12-01`,
        jobDescription: 'Fictional capacity sample',
        reason: 'Sample hiring',
      },
    }),
  );
  expect(created.status).toBe(200);
  expect((await created.json()).data.record.accountId).toBe(facts.accountId);
});
