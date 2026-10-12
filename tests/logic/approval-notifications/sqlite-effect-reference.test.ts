// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import {
  createAppLifecycleStore,
  canonicalTransitionReference,
} from '../../../server/providers/approval-runtime/repository-store.js';
import { databaseManagerToken } from '@nocobase/db';
import { createRepositoryLifecycleStore } from '@nocobase/lifecycle';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
test('inspects shared SQLite effect journal references using only public lifecycle store APIs', async ({
  app,
}) => {
  const store = createRepositoryLifecycleStore(
    app.container.resolve(databaseManagerToken),
    {
      collections: {
        transitions: 'oaLifecycleTransitions',
        effectRuns: 'oaLifecycleEffectRuns',
      },
    },
  );
  const at = new Date().toISOString(),
    recordId = randomUUID();
  const transition = await store.appendTransition({
    lifecycle: 'oa.compatibilityProof',
    recordId,
    transition: 'create',
    from: null,
    to: 'created',
    actorId: randomUUID(),
    input: {},
    at,
    version: 1,
    requestId: randomUUID(),
  });
  const run = await store.createEffectRun({
    transitionId: transition.id,
    lifecycle: transition.lifecycle,
    recordId,
    effect: 'proof',
    stayBound: false,
    status: 'queued',
    attempts: 0,
    maxAttempts: 1,
    result: null,
    error: null,
    createdAt: at,
    updatedAt: at,
    claimedAt: null,
    runAfter: null,
  });
  const persisted = await store.findEffectRun(run.id);
  expect([transition.id, `${transition.id}.0`]).toContain(
    persisted!.transitionId,
  );
  if (persisted!.transitionId !== transition.id)
    await expect(store.findTransition(persisted!.transitionId)).rejects.toThrow(
      'invalid',
    );
  expect((await store.findTransition(transition.id))!.id).toBe(transition.id);
  const appStore = createAppLifecycleStore(
    app.container.resolve(databaseManagerToken),
    {
      collections: {
        transitions: 'oaLifecycleTransitions',
        effectRuns: 'oaLifecycleEffectRuns',
      },
    },
  );
  const normalized = await appStore.findEffectRun(run.id);
  expect(normalized!.transitionId).toBe(transition.id);
  expect((await appStore.findTransition(normalized!.transitionId))!.id).toBe(
    transition.id,
  );
  await appStore.transaction(async (child) => {
    const childRun = await child.findEffectRun(run.id);
    expect((await child.findTransition(childRun!.transitionId))!.id).toBe(
      transition.id,
    );
    expect(
      await child.listTransitions(transition.lifecycle, recordId, {
        after: persisted!.transitionId,
      }),
    ).toEqual([]);
  });
  expect((await store.findEffectRun(run.id))!.transitionId).toBe(
    persisted!.transitionId,
  );
});

it.each(['9007199254740992.0', '123.5', '1e3', 'record.0', '-1.0', '123', ''])(
  'preserves non-integral, unsafe or ordinary references (%s)',
  (id) => {
    expect(canonicalTransitionReference(id)).toBe(id);
  },
);
it('canonicalizes only the safe SQLite integral representation', () => {
  expect(canonicalTransitionReference('123.0')).toBe('123');
});
test('preserves caller transaction rollback and outermost afterCommit through the compatibility adapter', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken),
    store = createAppLifecycleStore(db, {
      collections: {
        transitions: 'oaLifecycleTransitions',
        effectRuns: 'oaLifecycleEffectRuns',
      },
    });
  let committed = 0;
  const recordId = randomUUID(),
    entry = {
      lifecycle: 'oa.compatibilityProof',
      recordId,
      transition: 'create',
      from: null,
      to: 'created',
      actorId: randomUUID(),
      input: {},
      at: new Date().toISOString(),
      version: 1,
      requestId: randomUUID(),
    };
  await expect(
    db.transaction(async (connection) => {
      await store.transaction(
        async (child) => {
          await child.appendTransition(entry);
          child.afterCommit(() => {
            committed++;
          });
        },
        { within: connection },
      );
      expect(committed).toBe(0);
      expect(
        await connection
          .repository('oaLifecycleTransitions')
          .count({ filter: { recordId } }),
      ).toBe(1);
      throw new Error('outer audit fault');
    }),
  ).rejects.toThrow('outer audit fault');
  expect(committed).toBe(0);
  expect(
    await db
      .repository('oaLifecycleTransitions')
      .count({ filter: { recordId } }),
  ).toBe(0);
  await db.transaction(async (connection) => {
    await store.transaction(
      async (child) => {
        await child.appendTransition(entry);
        child.afterCommit(() => {
          committed++;
        });
      },
      { within: connection },
    );
    expect(committed).toBe(0);
  });
  expect(committed).toBe(1);
});
