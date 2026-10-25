import { registerOwnedRequestSearch } from '../request-search/owned-source.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { defineRecordAccess } from '@nocobase/authorization/core';
import { databaseManagerToken } from '@nocobase/db';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import { ServiceProvider } from '@nocobase/service-provider';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { approvalNotificationServiceToken } from '../approval-notifications/contract.js';
import { auditServiceToken } from '../audit/index.js';
import { employeeServiceToken } from '../employees/contract.js';
import { headcountServiceToken } from '../headcounts/contract.js';
import { loanLedgerServiceToken } from '../loan-ledger/contract.js';
import { orgServiceToken } from '../org/contract.js';
import { organizationServiceToken } from '../org/index.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import { probationDepartureAdapterToken } from '../probation/contract.js';
import { reimbursementServiceToken } from '../reimbursement/index.js';
import { workItemServiceToken } from '../work-items/contract.js';
import { departureResource } from './authz.js';
import {
  departureApprovalReassignmentToken,
  departureAssetClearanceToken,
  departureCustodyClearanceToken,
  departureFinancialClearanceToken,
  departureServiceToken,
} from './contract.js';
import { createDepartureService } from './service.js';
export { departureServiceToken } from './contract.js';
export default class DepartureProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/departure-provider';
  private jobs?: LifecycleJobs;
  public override register(): void {
    const c = this.app.container;
    c.singleton(departureCustodyClearanceToken, () => {
      const checks = new Map<
        string,
        (
          employeeId: string,
          connection: import('@nocobase/db').DatabaseConnection,
        ) => Promise<void>
      >();
      return {
        register(name, check) {
          if (!name || checks.has(name))
            throw new Error('DEPARTURE_CUSTODY_DUPLICATE');
          checks.set(name, check);
        },
        async assertCleared(employeeId, connection) {
          for (const check of checks.values())
            await check(employeeId, connection);
        },
      };
    });
    c.singleton(departureFinancialClearanceToken, () => ({
      assertReimbursementsCleared: (applicantId, connection) =>
        c
          .resolve(reimbursementServiceToken)
          .assertDepartureCleared(applicantId, connection),
    }));
    c.singleton(departureServiceToken, () => {
      const service = createDepartureService({
        db: c.resolve(databaseManagerToken),
        headcounts: c.resolve(headcountServiceToken),
        custody: c.resolve(departureCustodyClearanceToken),
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
        organization: c.resolve(organizationServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
        administrators:
          this.app.config.get<{ administrators: readonly string[] }>(
            'oaApprovals',
          )?.administrators ?? [],
        reassignment: () =>
          c.has(departureApprovalReassignmentToken)
            ? c.resolve(departureApprovalReassignmentToken)
            : undefined,
        ordinaryWork: {
          async assertCleared(userId, connection) {
            const blockers = await c
              .resolve(workItemServiceToken)
              .departureBlockers(userId, connection);
            if (
              !Number.isSafeInteger(blockers.remaining) ||
              blockers.remaining !== 0
            )
              throw new Error('DEPARTURE_ORDINARY_WORK_INCOMPLETE');
          },
        },
        loans: c.resolve(loanLedgerServiceToken),
        assets: () =>
          c.has(departureAssetClearanceToken)
            ? c.resolve(departureAssetClearanceToken)
            : undefined,
        finances: () => c.resolve(departureFinancialClearanceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        calendar: c.resolve(calendarServiceToken),
        rules: c.resolve(ruleServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        employees: c.resolve(employeeServiceToken),
        org: c.resolve(orgServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        audit: c.resolve(auditServiceToken),
        users: c.resolve(userAdministrationServiceToken),
      });
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-departure'),
        schedule: executors.getScheduleExecutor('oa-departure'),
        jobName: 'oa-departure-effect',
        sweepEveryMs: 10 * 60_000,
        onSweep: () => service.maintenance(),
      });
      return service;
    });
    c.singleton(
      probationDepartureAdapterToken,
      () => c.resolve(departureServiceToken).adapter,
    );
  }
  public override async boot(): Promise<void> {
    registerOwnedRequestSearch(this.app, {
      kind: 'oa.departure',
      resource: 'oa.departure',
      collection: 'departureRequests',
      titleField: 'reason',
      validate: (id, actorId, policy) =>
        this.app.container
          .resolve(departureServiceToken)
          .searchVisible(id, actorId, policy),
    });
    const c = this.app.container;
    const authz = c.resolve(authorizationToken);
    for (const name of ['departureRequests', 'departureWorkItems'])
      authz.database.collections.add({
        name,
        title: { key: 'departureRequests.authz.resource', ns: 'nb3-oa' },
      });
    authz.recordAccess.define(
      defineRecordAccess('oa.departureReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('departureRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await c
              .resolve(departureServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.compositeResources.define(departureResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.departure' },
      { section: 'oa.approvals' },
    );
    const scheduler = c.resolve(schedulerServiceToken),
      i18n = c.resolve(i18nToken),
      locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    const t = i18n.getFixedT('nb3-oa', locale);
    scheduler.registerTarget({
      type: 'app.departure-execution',
      title: t('departureRequests.schedule.title'),
      validate: (config) =>
        config !== null &&
        typeof config === 'object' &&
        !Array.isArray(config) &&
        Object.keys(config).length === 0
          ? { valid: true }
          : { valid: false, reason: 'departure-config-must-be-empty' },
      start: async () => ({
        state: 'completed',
        outcome: 'succeeded',
        result: await c.resolve(departureServiceToken).reconcile(),
      }),
    });
    await c.resolve(calendarServiceToken).reload();
    scheduler.defineSchedule({
      key: 'oa.departure.daily-execution',
      title: t('departureRequests.schedule.title'),
      description: t('departureRequests.schedule.description'),
      schedule: {
        cron: '30 0 * * *',
        timezone: c.resolve(calendarServiceToken).timeZone(),
      },
      target: { type: 'app.departure-execution', config: {} },
    });
  }
  public override async start(): Promise<void> {
    const c = this.app.container;
    if (
      !(await c
        .resolve(databaseManagerToken)
        .connection()
        .collections.get('departureRequests'))
    )
      return;
    const service = c.resolve(departureServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
