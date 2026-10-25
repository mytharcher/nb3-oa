import { registerOwnedRequestSearch } from '../request-search/owned-source.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { i18nToken } from '@nocobase/app-server/i18n';
import {
  probationDepartureAdapterToken,
  probationServiceToken,
  type ProbationService,
} from './contract.js';

import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { databaseManagerToken } from '@nocobase/db';
import type { LifecycleJobs } from '@nocobase/lifecycle/jobs';
import { createLifecycleJobs } from '@nocobase/lifecycle/jobs';
import { ServiceProvider } from '@nocobase/service-provider';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { approvalNotificationServiceToken } from '../approval-notifications/contract.js';
import { auditServiceToken } from '../audit/index.js';
import { employeeServiceToken } from '../employees/contract.js';
import { orgServiceToken } from '../org/contract.js';
import {
  calendarServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import { createProbationService } from './service.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('probationRequests').read('*'),
);
export const probationResource = defineCompositeResource('oa.probation', (r) =>
  r
    .title({ key: 'probationRequests.authz.resource', ns: 'nb3-oa' })
    .action('submit', (a) =>
      a
        .title({ key: 'probationRequests.authz.submit', ns: 'nb3-oa' })
        .grant('probationRequests', read.create('*').update('*')),
    )
    .action('delegate', (a) =>
      a
        .title({ key: 'probationRequests.authz.delegate', ns: 'nb3-oa' })
        .grant('probationRequests', read.create('*').update('*')),
    )
    .action('view', (a) =>
      a
        .title({ key: 'probationRequests.authz.view', ns: 'nb3-oa' })
        .grant('probationRequests', read),
    )
    .action('compensation', (a) =>
      a
        .title({ key: 'probationRequests.authz.compensation', ns: 'nb3-oa' })
        .grant('probationRequests', read)
        .grant(
          'probationCompensationProposals',
          defineDatabasePermission((p) =>
            p
              .collection('probationCompensationProposals')
              .read('*')
              .create('*')
              .update('*'),
          ),
        ),
    ),
);
export default class ProbationProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/probation-provider';
  private jobs?: LifecycleJobs;
  public override register(): void {
    const c = this.app.container;
    c.singleton(probationServiceToken, () => {
      const service: ProbationService = createProbationService({
        db: c.resolve(databaseManagerToken),
        org: c.resolve(orgServiceToken),
        departure: () =>
          c.has(probationDepartureAdapterToken)
            ? c.resolve(probationDepartureAdapterToken)
            : undefined,

        audit: c.resolve(auditServiceToken),
        users: c.resolve(userAdministrationServiceToken),
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
        employees: c.resolve(employeeServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        calendar: c.resolve(calendarServiceToken),
        rules: c.resolve(ruleServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
      });
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-probation'),
        schedule: executors.getScheduleExecutor('oa-probation'),
        jobName: 'oa-probation-effect',
        sweepEveryMs: 10 * 60_000,
        async onSweep() {
          await service.maintenance();
          await service.runtime.prune({
            olderThan: new Date(Date.now() - 30 * 24 * 60 * 60_000),
          });
        },
      });
      return service;
    });
  }
  public override async boot(): Promise<void> {
    registerOwnedRequestSearch(this.app, {
      kind: 'oa.probation',
      resource: 'oa.probation',
      collection: 'probationRequests',
      titleField: 'selfEvaluation',
      validate: (id, actorId, policy) =>
        this.app.container
          .resolve(probationServiceToken)
          .searchVisible(id, actorId, policy),
    });
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'probationRequests',
      title: { key: 'probationRequests.authz.resource', ns: 'nb3-oa' },
    });
    authz.database.collections.add({
      name: 'probationCompensationProposals',
      title: { key: 'probationRequests.authz.compensation', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.probationReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('probationRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await this.app.container
              .resolve(probationServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.compositeResources.define(probationResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.probation' },
      { section: 'oa.approvals' },
    );
    const c = this.app.container;
    const scheduler = c.resolve(schedulerServiceToken);
    const i18n = c.resolve(i18nToken);
    const locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    const t = i18n.getFixedT('nb3-oa', locale);
    scheduler.registerTarget({
      type: 'app.probation-reminders',
      title: t('probationRequests.schedule.title'),
      validate: (config) =>
        config !== null &&
        typeof config === 'object' &&
        !Array.isArray(config) &&
        Object.keys(config).length === 0
          ? { valid: true }
          : { valid: false, reason: 'probation-config-must-be-empty' },
      start: async () => {
        const result = await c.resolve(probationServiceToken).reconcile();
        return { state: 'completed', outcome: 'succeeded', result };
      },
    });
    await c.resolve(calendarServiceToken).reload();
    scheduler.defineSchedule({
      key: 'oa.probation.daily-reconciliation',
      title: t('probationRequests.schedule.title'),
      description: t('probationRequests.schedule.description'),
      schedule: {
        cron: '20 0 * * *',
        timezone: c.resolve(calendarServiceToken).timeZone(),
      },
      target: { type: 'app.probation-reminders', config: {} },
    });
  }
  public override async start(): Promise<void> {
    if (
      !this.app.container.has(authorizationToken) ||
      !this.app.container.has(userAdministrationServiceToken) ||
      !this.app.container.has(approvalDirectoryServiceToken)
    )
      return;
    const db = this.app.container.resolve(databaseManagerToken);
    if (!(await db.connection().collections.get('probationRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-probation')
        .warn(
          'Probation tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(probationServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
