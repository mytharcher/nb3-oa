// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.js';
import { createAppLifecycleStore } from '../../../server/providers/approval-runtime/repository-store.js';
import { generalServiceToken } from '../../../server/providers/general-requests/index.js';
import { demoContext } from '../../../server/providers/demo-data/context.js';
import type { DemoDataSet } from '../../../server/providers/demo-data/contract.js';
import { validateDemo } from '../../../server/providers/demo-data/validate.js';

let fixture: OrgTestApp;
beforeAll(async () => {
  fixture = await startOrgTestApp();
}, 120000);
afterAll(async () => {
  await fixture?.close();
});

it('accepts pruned effect attempts on retry while retaining checks on durable history', async () => {
  const app = fixture.testApp.application;
  const db = app.container.resolve(databaseManagerToken);
  const dataset: DemoDataSet = {
    id: `demo-${randomUUID()}`,
    locale: 'zh-CN',
    baseDate: '2026-10-21',
    timeZone: 'Asia/Singapore',
    state: 'importFailed',
    version: 1,
    actorId: 'validation-fixture',
    accounts: [],
    scenarios: {},
    totalSteps: 0,
    failures: [],
    credentials: null,
    progress: 'failed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const scope = {
    id: dataset.id,
    locale: dataset.locale,
    baseDate: dataset.baseDate,
    users: new Set<string>(),
  };
  const store = createAppLifecycleStore(db, {
    collections: {
      transitions: 'oaLifecycleTransitions',
      effectRuns: 'oaLifecycleEffectRuns',
    },
  });
  const old = new Date(Date.now() - 60 * 86400000).toISOString();
  const { transition, run } = await demoContext.run(scope, () =>
    store.transaction(async (tx) => {
      const transition = await tx.appendTransition({
        lifecycle: 'demo-validation-fixture',
        recordId: randomUUID(),
        transition: 'complete',
        from: 'pending',
        to: 'complete',
        actorId: dataset.actorId,
        input: {},
        at: old,
        version: 1,
        requestId: randomUUID(),
      });
      const run = await tx.createEffectRun({
        transitionId: transition.id,
        lifecycle: transition.lifecycle,
        recordId: transition.recordId,
        effect: 'validation-fixture',
        stayBound: false,
        status: 'succeeded',
        attempts: 1,
        maxAttempts: 1,
        result: null,
        error: null,
        createdAt: old,
        updatedAt: old,
        claimedAt: null,
        runAfter: null,
        continuation: null,
      });
      return { transition, run };
    }),
  );
  await expect(validateDemo(app, dataset)).resolves.toBeUndefined();
  // Engine maintenance runs without the import context and legitimately removes
  // finished attempts, leaving the older ownership entry for batch cleanup.
  await app.container.resolve(generalServiceToken).runtime.prune({
    olderThan: new Date(Date.now() - 30 * 86400000),
  });
  expect(await store.findEffectRun(run.id)).toBeUndefined();
  expect(
    await db.repository('demoDataRecords').count({
      filter: {
        datasetId: dataset.id,
        collection: 'oaLifecycleEffectRuns',
      },
    }),
  ).toBe(1);
  expect(await store.findTransition(transition.id)).toBeDefined();
  await expect(validateDemo(app, dataset)).resolves.toBeUndefined();
  await expect(validateDemo(app, dataset)).resolves.toBeUndefined();
  // Losing permanent transition history must still fail closed.
  await db
    .repository('oaLifecycleTransitions')
    .deleteOne({ filter: { id: Number(transition.id) } });
  await expect(validateDemo(app, dataset)).rejects.toThrow(
    'DEMO_OWNED_ROW_MISSING',
  );
}, 30000);
