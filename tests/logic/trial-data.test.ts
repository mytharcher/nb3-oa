// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { bootstrap } from '../../cli/commands/lib/trial-data/bootstrap.ts';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { startOrgTestApp, type OrgTestApp, json } from './org/helpers.ts';
import {
  generateTrialData,
  type TrialDataResult,
} from '../../cli/commands/lib/trial-data/index.ts';
import {
  trialAccounts,
  trialEmail,
} from '../../cli/commands/lib/trial-data/accounts.ts';

let fixture: OrgTestApp;
let result: TrialDataResult;
beforeAll(async () => {
  fixture = await startOrgTestApp();
}, 120000);
afterAll(async () => {
  await fixture?.close();
});

it('generates real PostgreSQL trial identities, resource holds and actionable role tasks', async () => {
  result = await generateTrialData(fixture.testApp.application);
  expect(result.failures).toEqual([]);
  expect(result.accounts).toBe(trialAccounts.length);
  expect(result.scenarios.length).toBeGreaterThan(25);
  const db =
    fixture.testApp.application.container.resolve(databaseManagerToken);
  expect(
    await db
      .repository('headcountAccounts')
      .findMany({ filter: { initialized: true } }),
  ).toHaveLength(7);
  expect((await db.repository('budgets').findMany()).length).toBeGreaterThan(
    20,
  );
  // Each scenario must reserve a different dataset-owned physical unit.
  const assetSamples = result.scenarios.filter(
    (s) => s.path === '/assetRequests',
  );
  expect(assetSamples).toHaveLength(4);
  const allocated = await Promise.all(
    assetSamples.map(async (s) => {
      const row = await db
        .repository('assetRequests')
        .findOne({ filter: { id: s.id } });
      const units = row?.allocation as { id: string }[];
      expect(units).toHaveLength(1);
      const unit = await db
        .repository('assets')
        .findOne({ filter: { id: units[0].id } });
      expect(unit?.code).toMatch(/^oa-trial-v1-asset-/);
      return units[0].id;
    }),
  );
  expect(new Set(allocated).size).toBe(4);
}, 360000);

it('uses distinct business permissions and preserves user progress on a repeat run', async () => {
  const { accounts } = JSON.parse(
    await readFile(result.accessFile, 'utf8'),
  ) as { accounts: { email: string; password: string }[] };
  const employee = await signIn(fixture.testApp, {
    email: trialEmail('employee'),
    password: accounts.find((a) => a.email === trialEmail('employee'))!
      .password,
  });
  const manager = await signIn(fixture.testApp, {
    email: trialEmail('manager'),
    password: accounts.find((a) => a.email === trialEmail('manager'))!.password,
  });
  const sample = result.scenarios.find((s) => s.key === 'leave-manager')!;
  const detail = await manager.fetch(`${sample.path}/${sample.id}`);
  expect(detail.status).toBe(200);
  expect((await detail.json()).data.taskActions.length).toBeGreaterThan(0);
  const own = (
    await (await employee.fetch(`${sample.path}/${sample.id}`)).json()
  ).data.record;
  const withdrawn = await employee.fetch(
    `${sample.path}/${sample.id}/transition`,
    json({
      transition: 'withdraw',
      version: own.lifecycleVersion,
      requestId: 'trial-test-withdraw',
      input: {},
    }),
  );
  expect(withdrawn.status).toBe(200);
  const before = await fixture.testApp.application.container
    .resolve(databaseManagerToken)
    .repository('leaveRequests')
    .count();
  const replay = await generateTrialData(fixture.testApp.application);
  expect(replay.failures).toEqual([]);
  expect(replay.scenarios.find((s) => s.id === sample.id)?.status).toBe(
    'withdrawn',
  );
  expect(
    await fixture.testApp.application.container
      .resolve(databaseManagerToken)
      .repository('leaveRequests')
      .count(),
  ).toBe(before);
  expect((await employee.fetch('/users')).status).toBe(200);
  expect(
    (await employee.fetch('/vendorQualifications/configuration')).status,
  ).toBe(403);
}, 360000);

it('rolls back new identities when an existing trial email belongs to a different account', async () => {
  const isolated = await startOrgTestApp();
  try {
    const app = isolated.testApp.application;
    await app.container.resolve(userAdministrationServiceToken).create({
      name: 'Collision fixture',
      email: trialEmail('driver'),
      username: 'different_fixture',
      password: 'Isolated-trial-collision-2026!',
    });
    await expect(
      bootstrap(app, 'Isolated-trial-password-2026!'),
    ).rejects.toThrow('Trial identity collision for driver');
    const db = app.container.resolve(databaseManagerToken);
    expect(
      await db
        .repository('user')
        .findOne({ filter: { email: trialEmail('employee') } }),
    ).toBeUndefined();
    expect(
      await db
        .repository('departments')
        .findOne({ filter: { code: 'oa-trial-v1-engineering' } }),
    ).toBeUndefined();
  } finally {
    await isolated.close();
  }
}, 120000);
