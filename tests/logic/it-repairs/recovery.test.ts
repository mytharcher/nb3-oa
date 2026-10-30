// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { OA_TEST_DATABASE_ENV, OA_TEST_SERVER } from '../oa-test-origin.js';
import { ORIGIN, write } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
import { repairServiceToken } from '../../../server/providers/it-repairs/service.js';
import { ruleServiceToken } from '../../../server/providers/platform/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'r'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
  },
});
const draft = {
  title: 'Synthetic recovery',
  description: 'Synthetic fault',
  category: 'software',
  impact: 'partial',
  location: 'Test office',
  contact: '',
  occurredAt: null,
  assetId: null,
};
const group = {
  title: 'Recovery IT',
  leaderIds: [] as string[],
  engineerIds: [],
  categories: ['software'],
  active: true,
};
function gate() {
  let calls = 0,
    release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  return async () => {
    if (++calls > 2) return;
    if (calls === 2) release();
    await ready;
  };
}

test('native receipt survives missing leaders and routing recovery rolls back atomically', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(repairServiceToken),
    inbox = c.resolve(inAppNotificationStoreToken),
    f = await prepareRepairs(testApp);
  const a = await f.a.session(),
    s = await f.admin.session(),
    l = await f.leader.session(),
    b = await f.b.session();
  const created = (
    await (
      await a.fetch(
        '/itRepairs/save',
        write('POST', { requestKey: randomUUID(), draft }),
      )
    ).json()
  ).data;
  const submitted = (
    await (
      await a.fetch(
        `/itRepairs/${created.id}/submit`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: created.version,
        }),
      )
    ).json()
  ).data;
  const messages = async (userId: string) =>
    (await inbox.list({ userId, limit: 100 })).filter(
      (m) => m.target?.type === 'route' && m.target.path.endsWith(submitted.id),
    );
  await expect.poll(async () => (await messages(f.a.userId)).length).toBe(1);
  const originalRun = (
    await service.runtime.listEffectRuns({ recordId: submitted.id })
  )[0];
  await expect
    .poll(
      async () =>
        (await service.runtime.listEffectRuns({ recordId: submitted.id })).find(
          (r) => r.id === originalRun.id,
        )?.status,
    )
    .toBe('queued');
  const configure = (
    id: string,
    expectedVersion: number,
    values = group,
    requestKey = randomUUID(),
  ) =>
    s.fetch(
      `/itRepairs/groups/${id}`,
      write('POST', { ...values, expectedVersion, requestKey }),
    );
  expect((await configure('recovery', 0)).status).toBe(200);
  expect(
    (await configure('recovery', 1, { ...group, leaderIds: [f.leader.userId] }))
      .status,
  ).toBe(200);
  await expect
    .poll(async () => (await messages(f.leader.userId)).length)
    .toBe(1);
  // Date-only advancement exercises the original queued attempt without sleeping or mocking notification delivery.
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    vi.setSystemTime(Date.now() + 60000);
    await service.runtime.runEffect(originalRun.id);
  } finally {
    vi.useRealTimers();
  }
  expect(
    (await service.runtime.listEffectRuns({ recordId: submitted.id })).find(
      (r) => r.id === originalRun.id,
    )?.status,
  ).toBe('succeeded');
  expect(await messages(f.a.userId)).toHaveLength(1);
  expect(await messages(f.leader.userId)).toHaveLength(1);
  const recovered = (await (await l.fetch(`/itRepairs/${submitted.id}`)).json())
    .data;
  expect(recovered.groupId).toBe('recovery');
  for (const key of [
    'number',
    'submittedAt',
    'responseDueAt',
    'resolutionDueAt',
  ])
    expect(recovered[key]).toEqual(submitted[key]);
  const beforeTitle = await db
    .repository('itRepairs')
    .findOne({ filter: { id: submitted.id } });
  const beforeRuns = await service.runtime.listEffectRuns({
    recordId: submitted.id,
  });
  expect(
    (
      await configure('recovery', 2, {
        ...group,
        title: 'Renamed only',
        leaderIds: [f.leader.userId],
      })
    ).status,
  ).toBe(200);
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: submitted.id } }),
  ).toEqual(beforeTitle);
  expect(
    await service.runtime.listEffectRuns({ recordId: submitted.id }),
  ).toEqual(beforeRuns);

  const pending = (
    await (
      await a.fetch(
        '/itRepairs/save',
        write('POST', {
          requestKey: randomUUID(),
          draft: { ...draft, category: 'device' },
        }),
      )
    ).json()
  ).data;
  await a.fetch(
    `/itRepairs/${pending.id}/submit`,
    write('POST', {
      requestKey: randomUUID(),
      expectedVersion: pending.version,
    }),
  );
  const before = await db
    .repository('itRepairs')
    .findOne({ filter: { id: pending.id } });
  const facts = async () =>
    Promise.all(
      [
        'itRepairCommands',
        'oaLifecycleTransitions',
        'oaLifecycleEffectRuns',
        'userTasks',
        'auditLogs',
      ].map((name) => db.repository(name).count()),
    );
  const counts = await facts();
  const audit = c.resolve(auditServiceToken),
    record = audit.record.bind(audit);
  const fault = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, tx) => {
      if (entry.action === 'itRepair.refreshRouting')
        throw new Error('RECOVERY_AUDIT_FAILURE');
      await record(entry, tx);
    });
  const key = randomUUID(),
    values = { ...group, categories: ['device'], leaderIds: [f.leader.userId] };
  try {
    expect((await configure('device', 0, values, key)).status).toBe(500);
  } finally {
    fault.mockRestore();
  }
  expect(
    await db.repository('itRepairGroups').findOne({ filter: { id: 'device' } }),
  ).toBeUndefined();
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: pending.id } }),
  ).toEqual(before);
  expect(await facts()).toEqual(counts);
  expect((await configure('device', 0, values, key)).status).toBe(200);
  expect((await l.fetch(`/itRepairs/${pending.id}`)).status).toBe(200);
  const after = await facts();
  expect(
    (
      await b.fetch(
        '/itRepairs/groups/device/recoverRouting',
        write('POST', { requestKey: randomUUID(), expectedVersion: 1 }),
      )
    ).status,
  ).toBe(403);
  expect((await s.fetch(`/itRepairs/${pending.id}`)).status).toBe(403);
  expect(await facts()).toEqual(after);
}, 60000);

test('different configuration identities cannot both commit one calendar revision or overlapping mappings', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    f = await prepareRepairs(testApp),
    rules = c.resolve(ruleServiceToken);
  await c.resolve(authorizationToken).permissionSets.assign({
    permissionSet: 'oa-it-repairs-configuration',
    subject: { type: 'user', id: f.b.userId },
  });
  const sessions = [await f.admin.session(), await f.b.session()];
  const current = (
    await (await sessions[0].fetch('/itRepairs/calendar')).json()
  ).data;
  const versions = rules.versions.bind(rules),
    synchronize = gate();
  const spy = vi
    .spyOn(rules, 'versions')
    .mockImplementation(async (...args) => {
      const value = await versions(...args);
      await synchronize();
      return value;
    });
  const beforeVersions = (
      await versions(['itRepair.morning', 'itRepair.afternoon'])
    ).length,
    beforeCommands = await db.repository('itRepairCommands').count();
  const beforeAudits = await db.repository('auditLogs').count();
  const beforeTasks = await db.repository('userTasks').count();
  let responses: Response[];
  try {
    responses = await Promise.all(
      sessions.map((session, i) =>
        session.fetch(
          '/itRepairs/calendar',
          write('POST', {
            requestKey: randomUUID(),
            expectedRevision: current.revision,
            windows: [
              { start: `0${8 + i}:00`, end: '12:00' },
              { start: '13:00', end: '18:00' },
            ],
          }),
        ),
      ),
    );
  } finally {
    spy.mockRestore();
  }
  expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
  expect(
    (await versions(['itRepair.morning', 'itRepair.afternoon'])).length,
  ).toBe(beforeVersions + 2);
  expect(await db.repository('itRepairCommands').count()).toBe(
    beforeCommands + 1,
  );
  expect(await db.repository('auditLogs').count()).toBe(beforeAudits + 2);
  expect(await db.repository('userTasks').count()).toBe(beforeTasks);
  const audit = c.resolve(auditServiceToken),
    record = audit.record.bind(audit),
    overlap = gate();
  const concurrent = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, tx) => {
      if (entry.action === 'itRepair.configure') await overlap();
      await record(entry, tx);
    });
  const before = await db.repository('itRepairCommands').count();
  const beforeGroups = await db.repository('itRepairGroups').count();
  try {
    responses = await Promise.all(
      sessions.map((session, i) =>
        session.fetch(
          `/itRepairs/groups/race-${i}`,
          write('POST', {
            ...group,
            categories: ['account'],
            expectedVersion: 0,
            requestKey: randomUUID(),
          }),
        ),
      ),
    );
  } finally {
    concurrent.mockRestore();
  }
  expect(responses.map((r) => r.status).sort()).toEqual([200, 400]);
  expect(await db.repository('itRepairGroups').count()).toBe(beforeGroups + 1);
  expect(await db.repository('itRepairCommands').count()).toBe(before + 1);
  expect(await db.repository('auditLogs').count()).toBe(beforeAudits + 3);
  expect(await db.repository('userTasks').count()).toBe(beforeTasks);
}, 60000);
