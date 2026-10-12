import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
} from '@nocobase/db';
import {
  LifecycleRuntime,
  defineEffect,
  defineLifecycle,
  type EffectDispatcher,
} from '@nocobase/lifecycle';
import type { AnnouncementService } from '../announcements/contract.js';
import { createAppLifecycleStore } from '../approval-runtime/repository-store.js';
import type { KnowledgeService } from './contract.js';

type Notice = {
  readonly [key: string]: unknown;
  id: string;
  documentId: string;
  targets: { announcementId: string; userIds: string[] }[];
  delivery: {
    channel: string | null;
    locale: string;
    title: string;
    body: string;
  };
  status: 'pending' | 'notified';
  version: number;
};

/** Resolve actual current memberships and independent ordinary view policies. */
export async function knowledgeNoticeAccess(
  authz: AppAuthorization,
  userId: string,
) {
  const principal = { type: 'user', id: userId };
  const subjects = [
    { type: 'authenticated', id: '*' },
    ...(await authz.subjects.resolveFor(principal)),
  ];
  const context = authz.for({ principal, subjects });
  async function policy(resource: string, collection: string) {
    const decision = await context.authorize({
      resource: { type: 'composite', id: resource },
      action: 'view',
    });
    return decision.effect === 'deny'
      ? undefined
      : (
          decision.conditions?.database as
            Record<string, RepositoryPolicy | false> | undefined
        )?.[collection];
  }
  const announcement = await policy('oa.announcements', 'announcements');
  const knowledge = await policy('oa.knowledgeDocuments', 'knowledgeDocuments');
  return announcement && knowledge ? { announcement, knowledge } : undefined;
}

/** A durable business outbox. Targets are frozen by the announcement owner;
 * delivery resolves fresh subjects/policies, then reads both owner facades.
 * Each immutable version has one notification per user across linked notices.
 */
export function createKnowledgeNotifications(d: {
  db: DatabaseManager;
  announcements: () => AnnouncementService;
  knowledge: () => KnowledgeService;
  dispatcher?: EffectDispatcher;
  now?: () => Date;
  delivery?: () => Promise<Notice['delivery']>;
  access: (
    userId: string,
  ) => Promise<
    { announcement: RepositoryPolicy; knowledge: RepositoryPolicy } | undefined
  >;
  send: (
    userId: string,
    documentId: string,
    versionId: string,
    key: string,
    delivery: Notice['delivery'],
  ) => Promise<void>;
}) {
  const effect = defineEffect<{ record: Notice; state: Notice['status'] }>({
    name: 'oa.knowledge.versionNotice',
    retry: { attempts: 5, backoffMs: 5000, factor: 2 },
    onSuccess: 'complete',
    run: async ({ record }) => {
      const candidates = [
        ...new Set(record.targets.flatMap((target) => target.userIds)),
      ].sort();
      for (const userId of candidates) {
        // Resolve authorization outside the read transaction (SQLite single pool).
        const access = await d.access(userId);
        if (!access) continue;
        const eligible = await d.db.transaction(async (tx) => {
          const knowledge = await d.knowledge().compareAnnouncementVersion(
            {
              documentId: record.documentId,
              versionId: record.id,
              actorId: userId,
            },
            tx,
            access.knowledge,
          );
          if (!knowledge.visible) return false;
          for (const target of record.targets) {
            if (!target.userIds.includes(userId)) continue;
            if (
              await d.announcements().versionNoticeEligible(
                {
                  announcementId: target.announcementId,
                  documentId: record.documentId,
                  actorId: userId,
                },
                tx,
                access.announcement,
              )
            )
              return true;
          }
          return false;
        });
        if (eligible)
          await d.send(
            userId,
            record.documentId,
            record.id,
            `oa.knowledge.version:${record.id}:${userId}`,
            record.delivery,
          );
      }
    },
  });
  const runtime = new LifecycleRuntime({
    store: createAppLifecycleStore(d.db, {
      collections: {
        transitions: 'oaLifecycleTransitions',
        effectRuns: 'oaLifecycleEffectRuns',
      },
    }),
    dispatcher: d.dispatcher,
    clock: d.now,
  });
  runtime.register(
    defineLifecycle<{ record: Notice; state: Notice['status'] }>({
      name: 'oa.knowledgeVersionNotice',
      collection: 'knowledgeVersionNotices',
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
    async enqueue(
      documentId: string,
      versionId: string,
      actorId: string,
      tx: DatabaseConnection,
    ) {
      const targets = await d
        .announcements()
        .linkedVersionAudience(documentId, tx);
      if (!targets.some((target) => target.userIds.length)) return;
      await runtime.create(
        'oa.knowledgeVersionNotice',
        {
          id: versionId,
          documentId,
          targets,
          delivery: (await d.delivery?.()) ?? {
            channel: null,
            locale: 'en-US',
            title: '',
            body: '',
          },
        },
        {
          actor: { id: actorId },
          transaction: tx,
        },
      );
    },
  };
}
