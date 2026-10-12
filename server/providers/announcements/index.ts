import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  authorizationToken,
  defineDatabasePermission,
  condition,
  anyScope,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
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
import { auditServiceToken } from '../audit/index.js';
import { orgServiceToken } from '../org/contract.js';
import { knowledgeServiceToken } from '../knowledge/contract.js';
import {
  announcementServiceToken,
  ANNOUNCEMENT_FIELDS,
  RECEIPT_FIELDS,
} from './contract.js';
import { createAnnouncementService, AnnouncementError } from './service.js';
export * from './contract.js';
export { AnnouncementError, createAnnouncementService } from './service.js';
const title = (key: string) => ({
  ns: 'nb3-oa',
  key: `announcements.authz.${key}`,
});
export default class AnnouncementsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/announcements-provider';
  private jobs?: LifecycleJobs;
  private unsubscribe?: () => void;
  private service?: ReturnType<typeof createAnnouncementService>;
  public override register() {
    const c = this.app.container;
    c.singleton(announcementServiceToken, () => {
      const executor = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executor.getJobExecutor('oa-announcements'),
        schedule: executor.getScheduleExecutor('oa-announcements'),
        jobName: 'oa-announcement-effect',
        sweepEveryMs: 600000,
      });
      this.service = createAnnouncementService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        org: c.resolve(orgServiceToken),
        dispatcher: this.jobs,
        knowledgeSnapshot: (documentId, actorId, tx, policy) =>
          c
            .resolve(knowledgeServiceToken)
            .snapshotForAnnouncement({ documentId, actorId }, tx, policy),
        notify: async (users, id, key) => {
          const config =
              this.app.config.get<NotificationConfig>('notification'),
            name = this.app.config.get<{ inbox: string | null }>(
              'oaApprovals',
            )?.inbox,
            channel = name ? config?.channels[name] : undefined;
          if (
            !name ||
            !channel ||
            channel.enabled === false ||
            channel.provider !== 'in-app'
          )
            return;
          const i18n = c.resolve(i18nToken),
            locale = i18n.getDefaultLocale();
          await i18n.ensureLocaleLoaded(locale);
          const t = i18n.getFixedT('nb3-oa', locale);
          await c.resolve(notificationServiceToken).send({
            idempotencyKey: key,
            source: { type: 'oa.announcement', referenceId: id },
            messages: {
              [name]: {
                to: users,
                title: t('announcements.notifications.title'),
                body: t('announcements.notifications.body'),
              },
            },
          });
        },
      });
      return this.service;
    });
  }
  public override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'announcements',
      title: title('title'),
    });
    const owned = authz.recordAccess.define(
      defineRecordAccess('oa.announcementsOwned', (a) =>
        a
          .title(title('owned'))
          .collections('announcements')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('publisherUserId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    const readable = authz.recordAccess.define(
      defineRecordAccess('oa.announcementsReadable', (a) =>
        a
          .title(title('readable'))
          .collections('announcements')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const receipts = await this.app.container
              .resolve(databaseManagerToken)
              .repository<{ announcementId: string; userId: string }>(
                'announcementReceipts',
              )
              .findMany({
                filter: { userId: principal.id },
                select: (s) => s.fields('announcementId'),
              });
            return anyScope([
              condition('publisherUserId', '$eq', principal.id),
              ...receipts.map((r) => condition('id', '$eq', r.announcementId)),
            ]);
          }),
      ),
    );
    const read = defineDatabasePermission((p) =>
      p
        .collection('announcements')
        .read((r) => r.fields(...ANNOUNCEMENT_FIELDS)),
    );
    authz.database.collections.add({
      name: 'announcementReceipts',
      title: title('receipts'),
    });
    const roster = authz.recordAccess.define(
      defineRecordAccess('oa.announcementRosterOwned', (a) =>
        a
          .title(title('owned'))
          .collections('announcementReceipts')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const rows = await this.app.container
              .resolve(databaseManagerToken)
              .repository<import('./contract.js').Announcement>('announcements')
              .findMany({
                filter: { publisherUserId: principal.id },
                select: (s) => s.fields('id'),
              });
            return rows.length
              ? anyScope(
                  rows.map((r) => condition('announcementId', '$eq', r.id)),
                )
              : false;
          }),
      ),
    );
    const rosterRead = defineDatabasePermission((p) =>
      p
        .collection('announcementReceipts')
        .read((r) => r.fields(...RECEIPT_FIELDS)),
    )
      .options(roster)
      .default(roster);
    authz.compositeResources.define(
      defineCompositeResource('oa.announcements', (r) =>
        r
          .title(title('title'))
          .action('view', (a) =>
            a
              .title(title('view'))
              .grant(
                'announcements',
                read.options(readable, owned).default(readable),
              ),
          )
          .action('confirm', (a) =>
            a
              .title(title('confirm'))
              .grant('announcements', read.options(readable).default(readable)),
          )
          .action('create', (a) =>
            a
              .title(title('create'))
              .grant(
                'announcements',
                read.create('*').options(owned).default(owned),
              ),
          )
          .action('edit', (a) =>
            a
              .title(title('edit'))
              .grant(
                'announcements',
                read.update('*').options(owned).default(owned),
              ),
          )
          .action('publish', (a) =>
            a
              .title(title('publish'))
              .grant(
                'announcements',
                read.update('*').options(owned).default(owned),
              ),
          )
          .action('revoke', (a) =>
            a
              .title(title('revoke'))
              .grant(
                'announcements',
                read.update('*').options(owned).default(owned),
              ),
          )
          .action('remind', (a) =>
            a
              .title(title('remind'))
              .grant(
                'announcements',
                read.update('*').options(owned).default(owned),
              ),
          )
          .action('receipts', (a) =>
            a
              .title(title('receipts'))
              .grant('announcements', read.options(owned).default(owned))
              .grant('announcementReceipts', rosterRead),
          ),
      ),
    );
    authz.ui.sections.add({
      name: 'oa.announcements',
      parent: 'administration',
      title: title('title'),
    });
    authz.ui.place(
      { type: 'composite', id: 'oa.announcements' },
      { section: 'oa.announcements' },
    );
  }
  public override async start() {
    const c = this.app.container,
      db = c.resolve(databaseManagerToken),
      audit = c.resolve(auditServiceToken);
    this.unsubscribe = db.connection().onRepositoryMutation(
      { id: 'oa/announcement-upload', collections: ['announcementFiles'] },
      {
        inTransaction: async (event, tx) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'announcementFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await tx
              .repository<{
                id: string;
                announcementId: string;
                ownerId: string;
                uploadVersion: number;
              }>('announcementFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            if (!file) throw new AnnouncementError('INVALID_ATTACHMENT');
            const locked = await tx.repository('announcements').updateMany({
              filter: { id: file.announcementId },
              values: { version: { increment: 0 } },
            });
            if (locked.updatedCount !== 1)
              throw new AnnouncementError('ACCESS_DENIED');
            const a = await tx
              .repository<import('./contract.js').Announcement>('announcements')
              .findOne({ filter: { id: file.announcementId } });
            if (
              !a ||
              a.status !== 'draft' ||
              a.publisherUserId !== file.ownerId ||
              a.version !== file.uploadVersion
            )
              throw new AnnouncementError('ACCESS_DENIED');
            await audit.record(
              {
                actorId: file.ownerId,
                action: 'announcement.attachment.upload',
                targetType: 'announcements',
                targetId: a.id,
                after: { fileId: file.id },
              },
              tx,
            );
          }
        },
      },
    );
    c.resolve(announcementServiceToken);
    await this.jobs!.start(this.service!.runtime);
  }
  public override async shutdown() {
    this.unsubscribe?.();
    await this.jobs?.shutdown();
  }
}
