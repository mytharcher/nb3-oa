import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { i18nToken } from '@nocobase/app-server/i18n';
import { loanLedgerServiceToken } from '../loan-ledger/contract.js';
import { travelServiceToken } from '../travel/contract.js';
import { loanRequestServiceToken } from './contract.js';
import { createLoanReminderService } from './reminders.js';

import {
  anyScope,
  authorizationToken,
  condition,
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
import {
  createLoanRequestService,
  type LoanRequestService,
} from './service.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('loanRequests').read('*'),
);
export const loanRequestResource = defineCompositeResource('oa.loan', (r) =>
  r
    .title({ key: 'loanRequests.authz.resource', ns: 'nb3-oa' })
    .action('submit', (a) =>
      a
        .title({ key: 'loanRequests.authz.submit', ns: 'nb3-oa' })
        .grant('loanRequests', read.create('*').update('*')),
    )
    .action('delegate', (a) =>
      a
        .title({ key: 'loanRequests.authz.delegate', ns: 'nb3-oa' })
        .grant('loanRequests', read.create('*').update('*')),
    )
    .action('payment', (a) =>
      a
        .title({ key: 'loanRequests.authz.payment', ns: 'nb3-oa' })
        .grant('loanRequests', read),
    )
    .action('cashRepayment', (a) =>
      a
        .title({ key: 'loanRequests.authz.cashRepayment', ns: 'nb3-oa' })
        .grant('loanRequests', read),
    )
    .action('confirmRepayment', (a) =>
      a
        .title({ key: 'loanRequests.authz.confirmRepayment', ns: 'nb3-oa' })
        .grant('loanRequests', read),
    )
    .action('view', (a) =>
      a
        .title({ key: 'loanRequests.authz.view', ns: 'nb3-oa' })
        .grant('loanRequests', read),
    ),
);
export default class LoanRequestProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/loan-requests-provider';
  private jobs?: LifecycleJobs;
  private reminders?: ReturnType<typeof createLoanReminderService>;
  public override register(): void {
    const c = this.app.container;
    this.reminders = createLoanReminderService({
      db: c.resolve(databaseManagerToken),
      calendar: c.resolve(calendarServiceToken),
      ledger: c.resolve(loanLedgerServiceToken),
      directory: c.resolve(approvalDirectoryServiceToken),
      notifications: c.resolve(approvalNotificationServiceToken),
    });
    c.singleton(loanRequestServiceToken, () => {
      const service: LoanRequestService = createLoanRequestService({
        db: c.resolve(databaseManagerToken),
        ledger: c.resolve(loanLedgerServiceToken),
        travelSource: async (id, applicantId, tx) =>
          c.has(travelServiceToken)
            ? c.resolve(travelServiceToken).sourceForLoan(id, applicantId, tx)
            : null,
        travelOptions: async (applicantId, tx) =>
          c.has(travelServiceToken)
            ? c.resolve(travelServiceToken).approvedLoanSources(applicantId, tx)
            : [],
        org: c.resolve(orgServiceToken),

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
        jobs: executors.getJobExecutor('oa-loan-requests'),
        schedule: executors.getScheduleExecutor('oa-loan-requests'),
        jobName: 'oa-loan-requests-effect',
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
    const c = this.app.container,
      scheduler = c.resolve(schedulerServiceToken),
      i18n = c.resolve(i18nToken),
      locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    const t = i18n.getFixedT('nb3-oa', locale);
    scheduler.registerTarget({
      type: 'app.loan-reminders',
      title: t('loanRequests.scheduleTitle'),
      validate: (config) =>
        config !== null &&
        typeof config === 'object' &&
        !Array.isArray(config) &&
        Object.keys(config).length === 0
          ? { valid: true }
          : { valid: false, reason: 'loan-reminder-config-must-be-empty' },
      start: async () => ({
        state: 'completed',
        outcome: 'succeeded',
        result: await this.reminders!.run(),
      }),
    });
    await c.resolve(calendarServiceToken).reload();
    scheduler.defineSchedule({
      key: 'oa.loanRequests.reminders',
      title: t('loanRequests.scheduleTitle'),
      description: t('loanRequests.scheduleDescription'),
      schedule: {
        cron: '0 9 * * *',
        timezone: c.resolve(calendarServiceToken).timeZone(),
      },
      target: { type: 'app.loan-reminders', config: {} },
    });

    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'loanRequests',
      title: { key: 'loanRequests.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.loanReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('loanRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const service = this.app.container.resolve(
              loanRequestServiceToken,
            ) as LoanRequestService;
            return await service.readableScope(principal.id);
          }),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.loanOwned', (a) =>
        a
          .title({ key: 'loanRequests.authz.ownedScope', ns: 'nb3-oa' })
          .collections('loanRequests')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? anyScope([
                  condition('applicantId', '$eq', principal.id),
                  condition('createdById', '$eq', principal.id),
                ])
              : false,
          ),
      ),
    );
    authz.compositeResources.define(loanRequestResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.loan' },
      { section: 'oa.approvals' },
    );
  }
  public override async start(): Promise<void> {
    if (
      !this.app.container.has(authorizationToken) ||
      !this.app.container.has(userAdministrationServiceToken) ||
      !this.app.container.has(approvalDirectoryServiceToken)
    )
      return;
    const db = this.app.container.resolve(databaseManagerToken);
    if (!(await db.connection().collections.get('loanRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-loan-requests')
        .warn(
          'LoanRequest tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(
      loanRequestServiceToken,
    ) as LoanRequestService;
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
