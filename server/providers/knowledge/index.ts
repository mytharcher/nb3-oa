import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import {
  notificationServiceToken,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification';
import { i18nToken } from '@nocobase/app-server/i18n';
import { announcementServiceToken } from '../announcements/contract.js';
import {
  createKnowledgeNotifications,
  knowledgeNoticeAccess,
} from './notifications.js';
import { auditServiceToken } from '../audit/index.js';
import { employeeServiceToken } from '../employees/contract.js';
import { orgServiceToken } from '../org/contract.js';
import {
  knowledgeServiceToken,
  KNOWLEDGE_DOCUMENT_FIELDS,
} from './contract.js';
import { createKnowledgeService } from './service.js';
export * from './contract.js';
export { KnowledgeError } from './service.js';
const title = (key: string) => ({
  key: `knowledge.authz.${key}`,
  ns: 'nb3-oa',
});
export default class KnowledgeProvider extends ServiceProvider<Application> {
  readonly name = 'oa/knowledge-provider';
  private jobs?: LifecycleJobs;
  private notices?: ReturnType<typeof createKnowledgeNotifications>;
  private offUploads?: () => void;
  override register() {
    const c = this.app.container;
    c.singleton(knowledgeServiceToken, () => {
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-knowledge-notices'),
        schedule: executors.getScheduleExecutor('oa-knowledge-notices'),
        jobName: 'oa-knowledge-version-notice',
        sweepEveryMs: 600000,
      });
      this.notices = createKnowledgeNotifications({
        db: c.resolve(databaseManagerToken),
        announcements: () => c.resolve(announcementServiceToken),
        knowledge: () => c.resolve(knowledgeServiceToken),
        dispatcher: this.jobs,
        delivery: async () => {
          const i18n = c.resolve(i18nToken),
            locale = i18n.getDefaultLocale();
          await i18n.ensureLocaleLoaded(locale);
          const t = i18n.getFixedT('nb3-oa', locale);
          return {
            channel:
              this.app.config.get<{ inbox: string | null }>('oaApprovals')
                ?.inbox ?? null,
            locale,
            title: t('knowledge.notifications.title'),
            body: t('knowledge.notifications.body'),
          };
        },
        access: (userId) =>
          knowledgeNoticeAccess(c.resolve(authorizationToken), userId),
        send: async (userId, documentId, versionId, key, delivery) => {
          const config =
            this.app.config.get<NotificationConfig>('notification');
          const name = delivery.channel;
          const channel = name ? config?.channels[name] : undefined;
          if (
            !name ||
            !channel ||
            channel.enabled === false ||
            channel.provider !== 'in-app'
          )
            return;
          await c.resolve(notificationServiceToken).send({
            idempotencyKey: key,
            source: { type: 'oa.knowledgeVersion', referenceId: versionId },
            messages: {
              [name]: {
                to: userId,
                title: delivery.title,
                body: delivery.body,
                target: {
                  type: 'route',
                  path: `/knowledge/${documentId}`,
                },
              },
            },
          });
        },
      });
      return createKnowledgeService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        org: c.resolve(orgServiceToken),
        employees: c.resolve(employeeServiceToken),
        files: c.resolve(serverFileRepositoryManagerToken),
        drive: c.resolve(driveManagerToken),
        notices: this.notices,
      });
    });
  }
  override async boot() {
    const a = this.app.container.resolve(authorizationToken);
    for (const n of [
      'knowledgeDocuments',
      'knowledgeFolders',
      'knowledgeVersions',
    ])
      a.database.collections.add({ name: n, title: title(n) });
    const versionRead = defineDatabasePermission((p) =>
      p.collection('knowledgeVersions').read('*'),
    );
    for (const [resource, collection, fields] of [
      [
        'oa.knowledgeDocuments',
        'knowledgeDocuments',
        KNOWLEDGE_DOCUMENT_FIELDS,
      ],
      [
        'oa.knowledgeFolders',
        'knowledgeFolders',
        ['id', 'parentId', 'title', 'version'],
      ],
    ] as const) {
      const read = defineDatabasePermission((p) =>
        p.collection(collection).read((r) => r.fields(...fields)),
      );
      a.compositeResources.define(
        defineCompositeResource(resource, (r) =>
          r
            .title(title(collection))
            .action('view', (x) =>
              collection === 'knowledgeDocuments'
                ? x
                    .title(title('view'))
                    .grant(collection, read)
                    .grant('knowledgeVersions', versionRead)
                : x.title(title('view')).grant(collection, read),
            )
            .action('manage', (x) =>
              collection === 'knowledgeDocuments'
                ? x
                    .title(title('manage'))
                    .grant(collection, read.create('*').update('*'))
                    .grant('knowledgeVersions', versionRead.create('*'))
                : x
                    .title(title('manage'))
                    .grant(collection, read.create('*').update('*')),
            ),
        ),
      );
    }
  }
  override async start() {
    const c = this.app.container,
      db = c.resolve(databaseManagerToken),
      audit = c.resolve(auditServiceToken);
    c.resolve(knowledgeServiceToken);
    await this.jobs!.start(this.notices!.runtime);
    this.offUploads = db.connection().onRepositoryMutation(
      { id: 'oa/knowledge-upload-audit', collections: ['knowledgeFiles'] },
      {
        inTransaction: async (event, tx) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'knowledgeFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await tx
              .repository<{
                id: string;
                ownerId: string;
                filename: string;
                size: number;
              }>('knowledgeFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            if (!file) throw new Error('Knowledge upload metadata is missing');
            await audit.record(
              {
                actorId: file.ownerId,
                action: 'knowledge.file.upload',
                targetType: 'knowledgeFiles',
                targetId: file.id,
                after: { filename: file.filename, size: file.size },
              },
              tx,
            );
          }
        },
      },
    );
  }
  override async shutdown() {
    this.offUploads?.();
    await this.jobs?.shutdown();
  }
}
