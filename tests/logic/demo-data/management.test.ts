import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import { cleanupBlocked } from '../../../server/providers/demo-data/cleanup.js';
import { createEmployee } from '../employees/helpers.js';
// @vitest-environment node
import { beforeAll, afterAll, expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { startOrgTestApp, json, type OrgTestApp } from '../org/helpers.js';
import { demoDataServiceToken } from '../../../server/providers/demo-data/index.js';
import { demoContext } from '../../../server/providers/demo-data/context.js';
import { assetServiceToken } from '../../../server/providers/assets/contract.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { randomUUID } from 'node:crypto';
let fixture: OrgTestApp;
beforeAll(async () => {
  fixture = await startOrgTestApp();
}, 120000);
afterAll(async () => {
  await fixture?.close();
});
it('authenticates and independently authorizes every management action', async () => {
  const anonymous = await fixture.testApp.request('/demoData');
  expect(anonymous.status).toBe(401);
  const ordinary = await fixture.createUser('DemoObserver');
  expect((await ordinary.fetch('/demoData/presence')).status).toBe(200);
  expect((await ordinary.fetch('/demoData')).status).toBe(403);
  for (const [path, body] of [
    [
      'import',
      { locale: 'en-US', expectedVersion: 0, requestKey: randomUUID() },
    ],
    ['removePreview', { datasetId: 'unknown', expectedVersion: 0 }],
    [
      'remove',
      {
        datasetId: 'unknown',
        expectedVersion: 0,
        previewToken: randomUUID(),
        requestKey: randomUUID(),
      },
    ],
    ['credentials', { datasetId: 'unknown', expectedVersion: 0 }],
  ] as const)
    expect((await ordinary.fetch(`/demoData/${path}`, json(body))).status).toBe(
      403,
    );
  const admin = await fixture.admin();
  expect((await (await admin.fetch('/demoData')).json()).data).toMatchObject({
    state: 'absent',
    version: 0,
    accounts: [],
  });
  expect(
    (
      await admin.fetch(
        '/demoData/import',
        json({
          locale: 'fr-FR',
          expectedVersion: 0,
          requestKey: 'invalid-locale',
        }),
      )
    ).status,
  ).toBe(400);
});
it('records dataset-owned business creations atomically and rejects changes to pre-existing records', async () => {
  const app = fixture.testApp.application,
    c = app.container,
    db = c.resolve(databaseManagerToken);
  const admin = await fixture.admin();
  const user = (
    await c.resolve(userAdministrationServiceToken).list({ pageSize: 100 })
  ).items.find((u) => u.email === admin.user.email)!;
  const category = (
    await c.resolve(dictionaryServiceToken).list('assetCategory')
  )[0].code;
  const assets = c.resolve(assetServiceToken);
  const real = await db.transaction((tx) =>
    assets.create(
      {
        code: 'USER-OWNED-DEMO-SENTINEL',
        category,
        name: 'User-owned device',
        serialNumber: 'REAL-001',
        originalValueCents: 120000,
        actorId: user.id,
        reason: 'Independent user creation',
      },
      tx,
    ),
  );
  const id = `demo-${randomUUID()}`,
    scope = {
      id,
      locale: 'en-US' as const,
      baseDate: '2026-10-19',
      users: new Set<string>(),
    };
  let sampleId = '';
  await demoContext.run(scope, () =>
    db.transaction(async (tx) => {
      const sample = await assets.create(
        {
          code: `${id}-a`,
          category,
          name: 'Demo-owned device',
          serialNumber: 'DEMO-001',
          originalValueCents: 120000,
          actorId: user.id,
          reason: 'Demo fixture',
        },
        tx,
      );
      sampleId = sample.id;
    }),
  );
  expect(
    await db
      .repository('demoDataRecords')
      .count({ filter: { datasetId: id, collection: 'assets' } }),
  ).toBe(1);
  await expect(
    demoContext.run(scope, () =>
      db.transaction((tx) =>
        assets.update(
          real.id,
          {
            version: real.version,
            name: 'Unsafe overwrite',
            actorId: user.id,
            reason: 'Guard regression',
          },
          tx,
        ),
      ),
    ),
  ).rejects.toThrow('DEMO_SHARED_WRITE_REFUSED');
  expect((await assets.get(real.id, db.connection()))?.name).toBe(
    'User-owned device',
  );
  await expect(
    demoContext.run(scope, () =>
      db.transaction(async (tx) => {
        await assets.create(
          {
            code: `${id}-rollback`,
            category,
            name: 'Rolled back device',
            serialNumber: 'DEMO-ROLLBACK',
            originalValueCents: 10000,
            actorId: user.id,
            reason: 'Rollback fixture',
          },
          tx,
        );
        throw new Error('rollback');
      }),
    ),
  ).rejects.toThrow('rollback');
  expect(
    await db
      .repository('demoDataRecords')
      .count({ filter: { datasetId: id, collection: 'assets' } }),
  ).toBe(1);
  expect((await assets.get(sampleId, db.connection()))?.name).toBe(
    'Demo-owned device',
  );
  const definition = await db.connection().collections.get('assets');
  expect(
    definition?.constraints?.some((x) => x.type === 'primary') ||
      definition?.fields.some((x) => x.primaryKey),
  ).toBe(true);
  await db
    .repository('assets')
    .updateOne({ filter: { id: real.id }, values: { name: sampleId } });
  expect(
    (await db.repository('assets').findOne({ filter: { id: real.id } }))?.name,
  ).toBe(sampleId);
  expect(await cleanupBlocked(db.connection(), id)).toBe(true);
  await db.repository('assets').updateOne({
    filter: { id: real.id },
    values: { name: 'User-owned device' },
  });
  expect(await cleanupBlocked(db.connection(), id)).toBe(false);
  expect(await c.resolve(demoDataServiceToken).presence()).toEqual({
    present: false,
    busy: false,
  });
});

it('imports a complete dataset with actionable scenarios and reports its actual result', async () => {
  const service =
    fixture.testApp.application.container.resolve(demoDataServiceToken);
  const admin = await fixture.admin();
  const current = await service.status();
  const requestKey = randomUUID();
  const response = await admin.fetch(
    '/demoData/import',
    json({
      locale: 'zh-CN',
      expectedVersion: current.version,
      requestKey,
    }),
  );
  expect(response.status).toBe(202);
  const first = (await response.json()).data;
  const repeated = await admin.fetch(
    '/demoData/import',
    json({ locale: 'zh-CN', expectedVersion: current.version, requestKey }),
  );
  expect(repeated.status).toBe(202);
  expect((await repeated.json()).data.operationId).toBe(first.operationId);
  const changedPayload = await admin.fetch(
    '/demoData/import',
    json({ locale: 'en-US', expectedVersion: current.version, requestKey }),
  );
  expect(changedPayload.status).toBe(409);
  await service.idle();
  const result = await service.status();
  expect(result.safeFailures).toEqual([]);
  expect(result.state).toBe('ready');
  expect(result.accounts.length).toBeGreaterThanOrEqual(26);
  expect(result.completedSteps).toBe(result.totalSteps);
  const db =
    fixture.testApp.application.container.resolve(databaseManagerToken);
  const credentialsBefore = await service.credentials(
    result.datasetId!,
    result.version,
  );
  // Simulate the durable state left by a process that stopped after its final checkpoint.
  const recovery = randomUUID();
  await db.repository('demoDataSets').updateOne({
    filter: { id: result.datasetId! },
    values: { state: 'importing' },
  });
  await db.repository('demoDataOperations').createOne({
    values: {
      id: recovery,
      datasetId: result.datasetId!,
      kind: 'import',
      state: 'running',
      createdAt: new Date(),
    },
  });
  await db.repository('demoDataControl').updateOne({
    filter: { id: 'main' },
    values: {
      operationId: recovery,
      operation: 'import',
      leaseUntil: new Date(Date.now() - 1000),
      leaseToken: 'abandoned-worker',
    },
  });
  await service.resume();
  await service.idle();
  const restored = await service.status();
  expect(restored.state).toBe('ready');
  expect(restored.baseDate).toBe(result.baseDate);
  expect(restored.datasetId).toBe(result.datasetId);
  expect(restored.completedSteps).toBe(result.completedSteps);
  expect(await service.credentials(result.datasetId!, result.version)).toEqual(
    credentialsBefore,
  );
}, 360000);

it('preflights, removes only the imported batch, revokes sign-in and allows a fresh English import', async () => {
  const app = fixture.testApp.application,
    c = app.container;
  const service = c.resolve(demoDataServiceToken),
    db = c.resolve(databaseManagerToken);
  const admin = await fixture.admin();
  const ready = await service.status();
  expect(ready.state).toBe('ready');
  const id = ready.datasetId!;
  const owned = await db
    .repository('demoDataRecords')
    .findMany({ filter: { datasetId: id } });
  expect(owned.length).toBeGreaterThan(1000);
  const credentials = await service.credentials(id, ready.version);
  const employee = credentials.accounts.find((a) => a.role === 'employee')!;
  const inbox = c.resolve(inAppNotificationStoreToken);
  expect(await inbox.countUnread(employee.id)).toBeGreaterThan(0);
  expect(await inbox.countUnread(admin.user.id)).toBe(0);
  expect(employee.password.length).toBeGreaterThan(20);
  const histories = await db
    .repository('generalRequests')
    .findMany({ filter: (f) => f.string('title').includes(' · ') });
  for (const state of ['approved', 'rejected', 'revision', 'withdrawn'])
    expect(histories.some((r) => r.status === state)).toBe(true);
  const realColleague = await createEmployee(
    fixture.testApp,
    'User-owned colleague',
  );
  const demoEmployee = await db
    .repository('employees')
    .findOne({ filter: { userId: employee.id } });
  await db.repository('employees').updateOne({
    filter: { id: realColleague.employeeId },
    values: { managerId: String(demoEmployee!.id) },
  });
  expect(
    (await service.preview({ datasetId: id, expectedVersion: ready.version }))
      .blocked,
  ).toBe(true);
  await db.repository('employees').updateOne({
    filter: { id: realColleague.employeeId },
    values: { managerId: null },
  });
  const realSalaryBefore = await db
    .repository('salaryGradeCurrent')
    .findOne({ filter: { id: 'current' } });
  expect(realSalaryBefore?.revisionId).toBeNull();
  expect(
    await db.repository('demoSalaryGradeRevisions').count(),
  ).toBeGreaterThan(0);
  const expired = await service.preview({
    datasetId: id,
    expectedVersion: ready.version,
  });
  await db.repository('demoDataPreviews').updateOne({
    filter: { id: expired.previewToken },
    values: { expiresAt: new Date(Date.now() - 1000) },
  });
  const refused = await admin.fetch(
    '/demoData/remove',
    json({
      datasetId: id,
      expectedVersion: ready.version,
      previewToken: expired.previewToken,
      requestKey: randomUUID(),
    }),
  );
  expect(refused.status).toBe(409);
  expect((await service.status()).state).toBe('ready');
  const previews = await service.preview({
    datasetId: id,
    expectedVersion: ready.version,
  });
  expect(previews.blocked).toBe(false);
  await admin.fetch(
    '/demoData/remove',
    json({
      datasetId: id,
      expectedVersion: ready.version,
      previewToken: previews.previewToken,
      requestKey: randomUUID(),
    }),
  );
  await service.idle();
  expect((await service.status()).state).toBe('absent');
  expect(
    await db.repository('demoDataRecords').count({ filter: { datasetId: id } }),
  ).toBe(0);
  expect(
    await db
      .repository('employees')
      .exists({ filter: { id: realColleague.employeeId } }),
  ).toBe(true);
  expect(
    await db
      .repository('salaryGradeCurrent')
      .findOne({ filter: { id: 'current' } }),
  ).toEqual(realSalaryBefore);

  expect(
    await db
      .repository('assets')
      .exists({ filter: { code: 'USER-OWNED-DEMO-SENTINEL' } }),
  ).toBe(true);
  const login = await fixture.testApp.request(
    '/auth/sign-in/email',
    json({ email: employee.email, password: employee.password }),
  );
  expect(login.ok).toBe(false);
  const sentinel = await db
    .repository('assets')
    .findOne({ filter: { code: 'USER-OWNED-DEMO-SENTINEL' } });
  await expect(
    db.repository('assets').updateOne({
      filter: { id: String(sentinel!.id) },
      values: { name: employee.id },
    }),
  ).rejects.toThrow('DEMO_REFERENCE_RETIRED');
  expect(
    (
      await db
        .repository('assets')
        .findOne({ filter: { id: String(sentinel!.id) } })
    )?.name,
  ).toBe(sentinel!.name);
  const absent = await service.status();
  await admin.fetch(
    '/demoData/import',
    json({
      locale: 'en-US',
      expectedVersion: absent.version,
      requestKey: randomUUID(),
    }),
  );
  await service.idle();
  const english = await service.status();
  expect(english.safeFailures).toEqual([]);
  expect(english.state).toBe('ready');
  expect(english.locale).toBe('en-US');
  expect(english.datasetId).not.toBe(id);
  expect(english.accounts.some((a) => a.name === 'Olivia Bennett')).toBe(true);
  for (const a of english.accounts)
    expect(a.name).not.toMatch(/\p{Script=Han}/u);
  const last = await service.preview({
    datasetId: english.datasetId!,
    expectedVersion: english.version,
  });
  expect(last.blocked).toBe(false);
  await admin.fetch(
    '/demoData/remove',
    json({
      datasetId: english.datasetId,
      expectedVersion: english.version,
      previewToken: last.previewToken,
      requestKey: randomUUID(),
    }),
  );
  await service.idle();
  expect((await service.status()).state).toBe('absent');
}, 900000);
