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
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
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
import { employeeServiceToken } from '../employees/contract.js';
import { orgServiceToken } from '../org/contract.js';
import { assetServiceToken } from '../assets/contract.js';
import {
  ruleServiceToken,
  sequenceServiceToken,
  dictionaryServiceToken,
  calendarServiceToken,
} from '../platform/index.js';
import { createRepairService, repairServiceToken, FIELDS } from './service.js';
export * from './service.js';
export default class RepairProvider extends ServiceProvider<Application> {
  readonly name = 'oa/it-repairs';
  private jobs?: LifecycleJobs;
  override register() {
    const c = this.app.container;
    c.singleton(repairServiceToken, () => {
      const jobs = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: jobs.getJobExecutor('oa-it-repairs'),
        schedule: jobs.getScheduleExecutor('oa-it-repairs'),
        jobName: 'oa-it-repair-effect',
        sweepEveryMs: 60000,
      });
      return createRepairService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        employees: c.resolve(employeeServiceToken),
        org: c.resolve(orgServiceToken),
        users: c.resolve(userAdministrationServiceToken),
        assets: c.resolve(assetServiceToken),
        calendar: c.resolve(calendarServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        rules: c.resolve(ruleServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        files: c.resolve(serverFileRepositoryManagerToken),
        writer: c.resolve(userTaskServiceToken).registerSource('oa.itRepair'),
        dispatcher: this.jobs,
        notify: async (id, number, recipients, key) => {
          const config =
            this.app.config.get<NotificationConfig>('notification');
          const name = this.app.config.get<{ inbox: string | null }>(
            'oaApprovals',
          )?.inbox;
          const channel = name ? config?.channels[name] : undefined;
          if (
            !name ||
            !channel ||
            channel.enabled === false ||
            (channel.type ?? channel.provider) !== 'in-app'
          )
            throw new Error('IT_REPAIR_NOTIFICATION_UNCONFIGURED');
          const eligible: string[] = [];
          const authz = c.resolve(authorizationToken);
          for (const userId of recipients) {
            const principal = { type: 'user', id: userId };
            const context = authz.for({
              principal,
              subjects: [
                { type: 'authenticated', id: '*' },
                ...(await authz.subjects.resolveFor(principal)),
              ],
            });
            const decision = await context.authorize({
              resource: { type: 'composite', id: 'oa.itRepairs' },
              action: 'view',
            });
            const p =
              decision.effect === 'deny'
                ? undefined
                : decision.conditions?.database?.itRepairs;
            if (!p) continue;
            const record = await c
              .resolve(databaseManagerToken)
              .repository('itRepairs')
              .withPolicy(p)
              .findOne({
                filter: { id },
                select: (s) => s.fields('id', 'number'),
              });
            if (record?.id === id && record.number === number)
              eligible.push(userId);
          }
          if (!eligible.length) return;
          const i18n = c.resolve(i18nToken);
          const locale = i18n.getDefaultLocale();
          await i18n.ensureLocaleLoaded(locale);
          const t = i18n.getFixedT('nb3-oa', locale);
          await c.resolve(notificationServiceToken).send({
            idempotencyKey: key,
            source: { type: 'oa.itRepair', referenceId: id },
            messages: {
              [name]: {
                to: eligible,
                title: t('itRepairs.noticeTitle'),
                body: t('itRepairs.noticeBody', { number }),
                target: {
                  type: 'route',
                  path: `/it-repairs/${encodeURIComponent(id)}`,
                },
              },
            },
          });
        },
      });
    });
  }
  override async boot() {
    const a = this.app.container.resolve(authorizationToken);
    a.database.collections.add({
      name: 'itRepairs',
      title: { key: 'itRepairs.title', ns: 'nb3-oa' },
    });
    const owned = a.recordAccess.define(
      defineRecordAccess('oa.itRepairsOwned', (r) =>
        r
          .title({ key: 'itRepairs.mine', ns: 'nb3-oa' })
          .collections('itRepairs')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('requesterId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    const visible = a.recordAccess.define(
      defineRecordAccess('oa.itRepairsVisible', (r) =>
        r
          .title({ key: 'itRepairs.title', ns: 'nb3-oa' })
          .collections('itRepairs')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const groups = await this.app.container
              .resolve(repairServiceToken)
              .leaderGroups(
                principal.id,
                this.app.container.resolve(databaseManagerToken).connection(),
              );
            return anyScope([
              condition('requesterId', '$eq', principal.id),
              ...groups.map((id) => ({
                kind: 'group' as const,
                logic: 'and' as const,
                items: [
                  condition('status', '$ne', 'draft'),
                  condition('groupId', '$eq', id),
                ],
              })),
            ]);
          }),
      ),
    );
    const read = defineDatabasePermission((p) =>
      p.collection('itRepairs').read((r) => r.fields(...FIELDS)),
    );
    a.compositeResources.define(
      defineCompositeResource('oa.itRepairs', (r) =>
        r
          .title({ key: 'itRepairs.title', ns: 'nb3-oa' })
          .action('view', (x) =>
            x
              .title({ key: 'itRepairs.view', ns: 'nb3-oa' })
              .grant(
                'itRepairs',
                read.options(visible, owned).default(visible),
              ),
          )
          .action('create', (x) =>
            x
              .title({ key: 'itRepairs.create', ns: 'nb3-oa' })
              .grant(
                'itRepairs',
                read.create('*').options(owned).default(owned),
              ),
          )
          .action('edit', (x) =>
            x
              .title({ key: 'itRepairs.edit', ns: 'nb3-oa' })
              .grant(
                'itRepairs',
                read.update('*').options(owned).default(owned),
              ),
          )
          .action('submit', (x) =>
            x
              .title({ key: 'itRepairs.submit', ns: 'nb3-oa' })
              .grant(
                'itRepairs',
                read.update('*').options(owned).default(owned),
              ),
          ),
      ),
    );
    a.settings.add({
      id: 'oa.itRepairGroups',
      title: { key: 'itRepairs.groups', ns: 'nb3-oa' },
      actions: [{ name: 'read' }, { name: 'update' }],
    });
    a.ui.sections.add({
      name: 'oa.itRepairs',
      parent: 'business',
      title: { key: 'itRepairs.title', ns: 'nb3-oa' },
    });
    a.ui.place(
      { type: 'composite', id: 'oa.itRepairs' },
      { section: 'oa.itRepairs' },
    );
    a.ui.place(
      { type: 'settings', id: 'oa.itRepairGroups' },
      { section: 'oa.itRepairs' },
    );
  }
  override async start() {
    const service = this.app.container.resolve(repairServiceToken);
    await this.jobs!.start(service.runtime);
  }
  override async shutdown() {
    await this.jobs?.shutdown();
  }
}
