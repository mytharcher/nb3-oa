// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  defineLifecycle,
  LifecycleRuntime,
  createRepositoryLifecycleStore,
} from '@nocobase/lifecycle';
import {
  createAppLifecycleStore,
  canonicalTransitionReference as canonicalJournalId,
} from '../../../server/providers/approval-runtime/repository-store.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
it('canonicalization changes only exact safe integral decimal journal references', () => {
  expect(canonicalJournalId('12.0')).toBe('12');
  expect(canonicalJournalId('12')).toBe('12');
  for (const id of [
    'vendor.0',
    '12.5',
    '9007199254740992.0',
    '391427336962054',
    '-12.0',
    '1e2',
    'uuid-0',
  ])
    expect(canonicalJournalId(id)).toBe(id);
});
for (const adapted of [false, true])
  test(
    adapted
      ? 'shared public adapter runs a durable effect exactly once'
      : 'unadapted installed public SQLite store reproduces decimal-reference effect failure',
    async ({ app }) => {
      const db = app.container.resolve(databaseManagerToken),
        queue: string[] = [];
      let calls = 0;
      const collection = adapted
        ? 'contractAdaptedEffectProof'
        : 'contractNumericEffectProof';
      await db.builder().createCollection(collection, (c) => {
        c.string('id', { length: 64, nullable: false });
        c.primary('id');
        c.string('status', { length: 32, nullable: false });
        c.integer('lifecycleVersion', { nullable: false });
        c.datetimeTz('statusChangedAt', { nullable: false });
      });
      const runtime = new LifecycleRuntime({
        store: (adapted
          ? createAppLifecycleStore
          : createRepositoryLifecycleStore)(db, {
          collections: {
            transitions: 'oaLifecycleTransitions',
            effectRuns: 'oaLifecycleEffectRuns',
          },
        }),
        dispatcher: {
          dispatch: async (id) => {
            queue.push(id);
          },
        },
      });
      runtime.register(
        defineLifecycle({
          name: 'proof.contractEffect',
          collection,
          initial: 'draft',
          states: ['draft', { name: 'pending', final: true }],
          transitions: { submit: { from: 'draft', to: 'pending' } },
          onEnter: {
            pending: [
              {
                name: 'proof.contractNumericEffect',
                run: () => {
                  calls += 1;
                },
              },
            ],
          },
        }),
      );
      const id = randomUUID();
      await runtime.create(
        'proof.contractEffect',
        { id },
        { actor: { id: 'fixture' } },
      );
      await runtime.fire('proof.contractEffect', id, 'submit', {
        actor: { id: 'fixture' },
      });
      expect(queue).toHaveLength(1);
      const attempt = await runtime.runEffect(queue[0]);
      if (adapted) {
        expect(attempt).toMatchObject({ status: 'succeeded' });
        expect(calls).toBe(1);
        await runtime.runEffect(queue[0]);
        expect(calls).toBe(1);
      } else {
        expect(attempt).toMatchObject({ status: 'failed' });
        expect(attempt?.error).toContain(
          'Filter value is invalid for Field "id" of type "integer".',
        );
        expect(calls).toBe(0);
      }
    },
  );
