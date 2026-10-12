import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
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
import { employeeServiceToken } from '../employees/contract.js';
import {
  workItemServiceToken,
  WORK_ITEM_FIELDS,
  type WorkItem,
} from './contract.js';
import { createWorkItemService, WorkItemError } from './service.js';
export * from './contract.js';
export { createWorkItemService, WorkItemError } from './service.js';
const title = (key: string) => ({
  key: `workItems.authz.${key}`,
  ns: 'nb3-oa',
});
export default class WorkItemsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/work-items-provider';
  private jobs?: LifecycleJobs;
  private service?: ReturnType<typeof createWorkItemService>;
  private unsubscribe?: () => void;
  public override register() {
    const c = this.app.container;
    c.singleton(workItemServiceToken, () => {
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-work-items'),
        schedule: executors.getScheduleExecutor('oa-work-items'),
        jobName: 'oa-work-item-effect',
        sweepEveryMs: 600000,
      });
      this.service = createWorkItemService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        org: c.resolve(orgServiceToken),
        employees: c.resolve(employeeServiceToken),
        users: c.resolve(userAdministrationServiceToken),
        dispatcher: this.jobs,
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
            source: { type: 'oa.workItem', referenceId: id },
            messages: {
              [name]: {
                to: users,
                title: t('workItems.notifications.title'),
                body: t('workItems.notifications.body'),
              },
            },
          });
        },
      });
      return this.service;
    });
  }
  public override async boot() {
    const c = this.app.container,
      authz = c.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'workItems',
      title: title('title'),
    });
    const owned = authz.recordAccess.define(
      defineRecordAccess('oa.workItemsOwned', (a) =>
        a
          .title(title('owned'))
          .collections('workItems')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('creatorUserId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    const confirmationOwned = authz.recordAccess.define(
      defineRecordAccess('oa.workItemsConfirmationOwned', (a) =>
        a
          .title(title('confirmationOwned'))
          .collections('workItems')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('confirmationOwnerUserId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    const readable = authz.recordAccess.define(
      defineRecordAccess('oa.workItemsReadable', (a) =>
        a
          .title(title('readable'))
          .collections('workItems')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const rows = await c
              .resolve(databaseManagerToken)
              .repository<WorkItem>('workItems')
              .findMany({ select: (s) => s.fields('id', 'dutyRoleCode') });
            const ids = [];
            for (const w of rows)
              if (
                w.dutyRoleCode &&
                (await c
                  .resolve(orgServiceToken)
                  .hasDutyRole(principal.id, w.dutyRoleCode))
              )
                ids.push(w.id);
            return anyScope([
              condition('creatorUserId', '$eq', principal.id),
              condition('confirmationOwnerUserId', '$eq', principal.id),
              condition('targetUserId', '$eq', principal.id),
              ...ids.map((id) => condition('id', '$eq', id)),
            ]);
          }),
      ),
    );
    const all = { key: 'allRecords', collections: ['workItems'] };
    const read = defineDatabasePermission((p) =>
      p.collection('workItems').read((r) => r.fields(...WORK_ITEM_FIELDS)),
    );
    authz.compositeResources.define(
      defineCompositeResource('oa.workItems', (r) =>
        r
          .title(title('title'))
          .action('view', (a) =>
            a
              .title(title('view'))
              .grant(
                'workItems',
                read.options(readable, owned, all).default(readable),
              ),
          )
          .action('create', (a) =>
            a
              .title(title('create'))
              .grant(
                'workItems',
                read.create('*').options(owned).default(owned),
              ),
          )
          .action('edit', (a) =>
            a
              .title(title('edit'))
              .grant(
                'workItems',
                read.update('*').options(owned).default(owned),
              ),
          )
          .action('dispatch', (a) =>
            a
              .title(title('dispatch'))
              .grant(
                'workItems',
                read.update('*').options(owned).default(owned),
              ),
          )
          .action('claim', (a) =>
            a
              .title(title('claim'))
              .grant(
                'workItems',
                read.update('*').options(readable).default(readable),
              ),
          )
          .action('release', (a) =>
            a
              .title(title('release'))
              .grant(
                'workItems',
                read.update('*').options(readable).default(readable),
              ),
          )
          .action('complete', (a) =>
            a
              .title(title('complete'))
              .grant(
                'workItems',
                read.update('*').options(readable).default(readable),
              ),
          )
          .action('confirm', (a) =>
            a
              .title(title('confirm'))
              .grant(
                'workItems',
                read
                  .update('*')
                  .options(confirmationOwned, owned)
                  .default(confirmationOwned),
              ),
          )
          .action('return', (a) =>
            a
              .title(title('return'))
              .grant(
                'workItems',
                read
                  .update('*')
                  .options(confirmationOwned, owned)
                  .default(confirmationOwned),
              ),
          )
          .action('block', (a) =>
            a
              .title(title('block'))
              .grant(
                'workItems',
                read.update('*').options(readable).default(readable),
              ),
          )
          .action('resume', (a) =>
            a
              .title(title('resume'))
              .grant(
                'workItems',
                read.update('*').options(owned, all).default(owned),
              ),
          )
          .action('reassign', (a) =>
            a
              .title(title('reassign'))
              .grant(
                'workItems',
                read.update('*').options(owned, all).default(owned),
              ),
          )
          .action('cancel', (a) =>
            a
              .title(title('cancel'))
              .grant(
                'workItems',
                read.update('*').options(owned, all).default(owned),
              ),
          )
          .action('handoverConfirmation', (a) =>
            a
              .title(title('handoverConfirmation'))
              .grant('workItems', read.update('*').options(all).default(all)),
          )
          .action('forceComplete', (a) =>
            a
              .title(title('forceComplete'))
              .grant('workItems', read.update('*').options(all).default(all)),
          ),
      ),
    );
    authz.ui.sections.add({
      name: 'oa.workItems',
      parent: 'administration',
      title: title('title'),
    });
    authz.ui.place(
      { type: 'composite', id: 'oa.workItems' },
      { section: 'oa.workItems' },
    );
  }
  public override async start() {
    const c = this.app.container,
      db = c.resolve(databaseManagerToken),
      audit = c.resolve(auditServiceToken),
      service = c.resolve(workItemServiceToken);
    this.unsubscribe = db.connection().onRepositoryMutation(
      { id: 'oa/work-item-upload', collections: ['workItemFiles'] },
      {
        inTransaction: async (event, tx) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'workItemFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await tx
              .repository<{
                id: string;
                workItemId: string;
                ownerId: string;
                purpose: string;
                uploadVersion: number;
              }>('workItemFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            if (!file) throw new WorkItemError('INVALID_ATTACHMENT');
            const locked = await tx.repository('workItems').updateMany({
              filter: { id: file.workItemId },
              values: { version: { increment: 0 } },
            });
            if (locked.updatedCount !== 1)
              throw new WorkItemError('ACCESS_DENIED');
            const { item, purpose } = await service.authorizeUpload(
              file.workItemId,
              file.ownerId,
              tx,
              { read: true, create: false, update: false, delete: false },
            );
            if (item.version !== file.uploadVersion || purpose !== file.purpose)
              throw new WorkItemError('ACCESS_DENIED');
            await audit.record(
              {
                actorId: file.ownerId,
                action: 'workItem.attachment.upload',
                targetType: 'workItems',
                targetId: item.id,
                after: { fileId: file.id, purpose },
              },
              tx,
            );
          }
        },
      },
    );
    await this.jobs!.start(this.service!.runtime);
  }
  public override async shutdown() {
    this.unsubscribe?.();
    await this.jobs?.shutdown();
  }
}
