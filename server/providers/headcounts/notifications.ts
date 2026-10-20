import { demoNow } from '../demo-data/context.js';
import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import {
  LifecycleRuntime,
  defineEffect,
  defineLifecycle,
  type EffectDispatcher,
} from '@nocobase/lifecycle';
import { createAppLifecycleStore } from '../approval-runtime/repository-store.js';
import type { HeadcountSource } from './contract.js';

export interface ReplacementNoticeDelivery {
  channel: string | null;
  title: string;
  body: string;
}
export interface ReplacementNoticeOwner {
  /** Freeze only real source recipients and safe translated text in the caller transaction. */
  prepare(
    source: HeadcountSource,
    tx: DatabaseConnection,
  ): Promise<{
    recipients: readonly string[];
    delivery: ReplacementNoticeDelivery;
  }>;
  /** Recheck current active identity, ordinary source policy and blocked reservation before sending. */
  deliver(
    source: HeadcountSource,
    recipient: string,
    key: string,
    delivery: ReplacementNoticeDelivery,
  ): Promise<void>;
}
type Notice = {
  readonly [key: string]: unknown;
  id: string;
  sourceKind: string;
  sourceId: string;
  recipients: string[];
  delivery: ReplacementNoticeDelivery;
  status: 'pending' | 'notified';
  version: number;
};
export function createReplacementNotifications(d: {
  db: DatabaseManager;
  dispatcher?: EffectDispatcher;
  now?: () => Date;
}) {
  const owners = new Map<string, ReplacementNoticeOwner>();
  const runtime = new LifecycleRuntime({
    store: createAppLifecycleStore(d.db, {
      collections: {
        transitions: 'oaLifecycleTransitions',
        effectRuns: 'oaLifecycleEffectRuns',
      },
    }),
    dispatcher: d.dispatcher,
    clock: d.now ?? demoNow,
  });
  const effect = defineEffect<{ record: Notice; state: Notice['status'] }>({
    name: 'oa.headcounts.replacementBlocked',
    retry: { attempts: 5, backoffMs: 5000, factor: 2 },
    onSuccess: 'complete',
    run: async ({ record }) => {
      const owner = owners.get(record.sourceKind);
      if (!owner)
        throw new Error('Replacement notification source owner unavailable');
      for (const recipient of record.recipients)
        await owner.deliver(
          record,
          recipient,
          `oa.headcounts.blocked:${record.id}:${recipient}`,
          record.delivery,
        );
    },
  });
  runtime.register(
    defineLifecycle<{ record: Notice; state: Notice['status'] }>({
      name: 'oa.headcountReplacementNotice',
      collection: 'headcountReplacementNotices',
      versionField: 'version',
      initial: 'pending',
      states: ['pending', { name: 'notified', final: true }],
      onEnter: { pending: [effect] },
      transitions: {
        complete: { from: 'pending', to: 'notified', manual: false },
      },
    }),
  );
  return {
    runtime,
    register(sourceKind: string, owner: ReplacementNoticeOwner) {
      if (owners.has(sourceKind))
        throw new Error('Replacement source owner already registered');
      owners.set(sourceKind, owner);
    },
    async enqueue(
      source: HeadcountSource,
      actorId: string,
      tx: DatabaseConnection,
    ) {
      const owner = owners.get(source.sourceKind);
      // Other source types retain capacity invalidation without inventing a recipient policy.
      if (!owner) return;
      const prepared = await owner.prepare(source, tx);
      const id = randomUUID();
      await runtime.create(
        'oa.headcountReplacementNotice',
        {
          id,
          sourceKind: source.sourceKind,
          sourceId: source.sourceId,
          recipients: [...new Set(prepared.recipients)].sort(),
          delivery: prepared.delivery,
        },
        { actor: { id: actorId }, transaction: tx },
      );
      return id;
    },
  };
}
export type ReplacementNotifications = ReturnType<
  typeof createReplacementNotifications
>;
export const replacementNotificationsToken =
  createServiceToken<ReplacementNotifications>(
    'oa/headcount-replacement-notifications',
  );
