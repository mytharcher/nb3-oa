import { onboardingAssetServiceToken } from '../assets/contract.js';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ScheduleExecutor } from '@nocobase/jobs';
import {
  notificationServiceToken,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification';
import { i18nToken } from '@nocobase/app-server/i18n';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  defineDatabasePermission,
  anyScope,
  condition,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { organizationServiceToken } from '../org/index.js';
import { employeeServiceToken } from '../employees/contract.js';
import { headcountServiceToken } from '../headcounts/contract.js';
import { requisitionServiceToken } from '../recruitment/requisitions.js';
import { calendarServiceToken } from '../platform/index.js';
import { auditServiceToken } from '../audit/index.js';
import {
  onboardingServiceToken,
  ONBOARDING_FIELDS,
  ONBOARDING_TASK_FIELDS,
  type Onboarding,
  type OnboardingTask,
} from './contract.js';
import { OnboardingError, createOnboardingService } from './service.js';
export * from './contract.js';
export { OnboardingError, createOnboardingService } from './service.js';
const title = (key: string) => ({
  key: `onboarding.authz.${key}`,
  ns: 'nb3-oa',
});
export default class OnboardingProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/onboarding-provider';
  private schedule?: ScheduleExecutor;
  private unsubscribe?: () => void;
  public override register() {
    const c = this.app.container;
    c.singleton(onboardingServiceToken, () =>
      createOnboardingService({
        database: c.resolve(databaseManagerToken),
        users: c.resolve(userAdministrationServiceToken),
        employees: c.resolve(employeeServiceToken),
        organization: c.resolve(organizationServiceToken),
        headcounts: c.resolve(headcountServiceToken),
        assets: c.resolve(onboardingAssetServiceToken),
        requisitions: c.resolve(requisitionServiceToken),
        calendar: c.resolve(calendarServiceToken),
        audit: c.resolve(auditServiceToken),
        notify: async (input) => {
          const configured = this.app.config.get<{ inbox: string | null }>(
            'oaApprovals',
          )?.inbox;
          const config =
            this.app.config.get<NotificationConfig>('notification');
          const channel = configured ? config?.channels[configured] : undefined;
          if (
            !configured ||
            !channel ||
            channel.enabled === false ||
            channel.provider !== 'in-app'
          )
            return false;
          const i18n = c.resolve(i18nToken),
            locale = i18n.getDefaultLocale();
          await i18n.ensureLocaleLoaded(locale);
          const t = i18n.getFixedT('nb3-oa', locale);
          await c.resolve(notificationServiceToken).send({
            idempotencyKey: input.eventId,
            source: {
              type: 'oa.onboarding',
              referenceId: input.onboardingId,
            },
            messages: {
              [configured]: {
                to: input.recipientIds,
                title: t('onboarding.notifications.overdueTitle'),
                body: t('onboarding.notifications.overdueBody'),
              },
            },
          });
          return true;
        },
      }),
    );
  }
  public override async start() {
    const c = this.app.container,
      db = c.resolve(databaseManagerToken);
    if (await db.connection().collections.get('onboardingFiles')) {
      this.unsubscribe = db.connection().onRepositoryMutation(
        { id: 'oa/onboarding-upload', collections: ['onboardingFiles'] },
        {
          inTransaction: async (event, tx) => {
            if (event.granularity !== 'rows') return;
            for (const change of event.changes) {
              if (
                change.collection !== 'onboardingFiles' ||
                change.kind !== 'created'
              )
                continue;
              const file = await tx
                .repository<{
                  id: string;
                  taskId: string;
                  onboardingId: string;
                  ownerId: string;
                  uploadVersion: number;
                }>('onboardingFiles')
                .findOne({ filter: { id: String(change.key.id) } });
              if (!file) throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
              const locked = await tx.repository('onboardingTasks').updateMany({
                filter: { id: file.taskId },
                values: { version: { increment: 0 } },
              });
              if (locked.updatedCount !== 1)
                throw new OnboardingError('ONBOARDING_FORBIDDEN');
              const task = await c
                .resolve(onboardingServiceToken)
                .authorizeAttachment(file.taskId, file.ownerId, tx);
              if (
                task.version !== file.uploadVersion ||
                task.onboardingId !== file.onboardingId
              )
                throw new OnboardingError('ONBOARDING_FORBIDDEN');
              await c.resolve(auditServiceToken).record(
                {
                  actorId: file.ownerId,
                  action: 'onboarding.attachment.upload',
                  targetType: 'onboardings',
                  targetId: task.onboardingId,
                  after: { fileId: file.id, taskId: task.id },
                },
                tx,
              );
            }
          },
        },
      );
    }
    if (!(await db.connection().collections.get('onboardingReminders'))) return;
    this.schedule = c
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor('oa-onboarding');
    await this.schedule.addJob({
      name: 'overdue-scan',
      options: { every: 600000 },
      payload: {},
      execute: async () => {
        await c.resolve(onboardingServiceToken).maintenance();
      },
    });
    await this.schedule.setup();
  }
  public override async shutdown() {
    this.unsubscribe?.();
    await this.schedule?.shutdown();
  }
  public override async boot() {
    const c = this.app.container,
      authz = c.resolve(authorizationToken),
      db = c.resolve(databaseManagerToken),
      org = c.resolve(organizationServiceToken);
    for (const name of ['onboardings', 'onboardingTasks'])
      authz.database.collections.add({ name, title: title('resource') });
    const readable = authz.recordAccess.define(
      defineRecordAccess('oa.onboardingReadable', (a) =>
        a
          .title(title('readable'))
          .collections('onboardings', 'onboardingTasks')
          .resolver(async ({ principal, collection }) => {
            if (principal.type !== 'user') return false;
            const parents = await db
                .repository<Onboarding>('onboardings')
                .findMany(),
              tasks = await db
                .repository<OnboardingTask>('onboardingTasks')
                .findMany();
            const ids = new Set(
              parents
                .filter(
                  (p) =>
                    p.creatorId === principal.id || p.userId === principal.id,
                )
                .map((p) => p.id),
            );
            if (await org.hasDutyRole(principal.id, 'hr'))
              for (const p of parents) ids.add(p.id);
            for (const task of tasks)
              if (
                task.targetUserId === principal.id ||
                task.assigneeId === principal.id ||
                (task.dutyRoleCode &&
                  (await org.hasDutyRole(principal.id, task.dutyRoleCode)))
              )
                ids.add(task.onboardingId);
            return anyScope([
              ...(collection === 'onboardings'
                ? [
                    condition('creatorId', '$eq', principal.id),
                    condition('userId', '$eq', principal.id),
                  ]
                : []),
              ...[...ids].map((id) =>
                condition(
                  collection === 'onboardingTasks' ? 'onboardingId' : 'id',
                  '$eq',
                  id,
                ),
              ),
            ]);
          }),
      ),
    );
    const allParents = { key: 'allRecords', collections: ['onboardings'] },
      allTasks = { key: 'allRecords', collections: ['onboardingTasks'] };
    const read = defineDatabasePermission((p) =>
      p.collection('onboardings').read((r) => r.fields(...ONBOARDING_FIELDS)),
    );
    const taskRead = defineDatabasePermission((p) =>
      p
        .collection('onboardingTasks')
        .read((r) => r.fields(...ONBOARDING_TASK_FIELDS)),
    );
    authz.compositeResources.define(
      defineCompositeResource('oa.onboarding', (r) => {
        let resource = r
          .title(title('resource'))
          .action('view', (a) =>
            a
              .title(title('view'))
              .grant(
                'onboardings',
                read.options(readable, allParents).default(readable),
              )
              .grant(
                'onboardingTasks',
                taskRead.options(readable, allTasks).default(readable),
              ),
          )
          .action('create', (a) =>
            a
              .title(title('create'))
              .grant(
                'onboardings',
                read
                  .create('*')
                  .options(readable, allParents)
                  .default(readable),
              ),
          )
          .action('cancel', (a) =>
            a
              .title(title('cancel'))
              .grant(
                'onboardings',
                read
                  .update('*')
                  .options(readable, allParents)
                  .default(readable),
              ),
          );
        for (const action of [
          'claim',
          'release',
          'complete',
          'forceComplete',
          'transfer',
          'reassignMentor',
        ])
          resource = resource.action(action, (a) =>
            a
              .title(title(action))
              .grant(
                'onboardingTasks',
                taskRead
                  .update('*')
                  .options(readable, allTasks)
                  .default(readable),
              ),
          );
        for (const action of ['viewSalary', 'viewBank'])
          resource = resource.action(action, (a) =>
            a
              .title(title(action))
              .grant(
                'onboardings',
                read.options(readable, allParents).default(readable),
              ),
          );
        return resource;
      }),
    );
    authz.ui.sections.add({
      name: 'oa.onboarding',
      parent: 'administration',
      title: title('resource'),
    });
    authz.ui.place(
      { type: 'composite', id: 'oa.onboarding' },
      { section: 'oa.onboarding' },
    );
  }
}
