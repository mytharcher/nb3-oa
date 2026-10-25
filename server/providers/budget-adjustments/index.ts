import { registerOwnedRequestSearch } from '../request-search/owned-source.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { budgetServiceToken } from '../budgets/contract.js';
import { dictionaryServiceToken } from '../platform/index.js';

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
import {
  budgetAdjustmentServiceToken,
  createBudgetAdjustmentService,
  type BudgetAdjustmentService,
} from './service.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('budgetAdjustments').read('*'),
);
export const budgetAdjustmentResource = defineCompositeResource(
  'oa.budgetAdjustment',
  (r) =>
    r
      .title({ key: 'budgetAdjustments.authz.resource', ns: 'nb3-oa' })
      .action('submit', (a) =>
        a
          .title({ key: 'budgetAdjustments.authz.submit', ns: 'nb3-oa' })
          .grant('budgetAdjustments', read.create('*').update('*')),
      )
      .action('delegate', (a) =>
        a
          .title({ key: 'budgetAdjustments.authz.delegate', ns: 'nb3-oa' })
          .grant('budgetAdjustments', read.create('*').update('*')),
      )
      .action('view', (a) =>
        a
          .title({ key: 'budgetAdjustments.authz.view', ns: 'nb3-oa' })
          .grant('budgetAdjustments', read),
      ),
);
export default class BudgetAdjustmentProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/budget-adjustment-provider';
  private jobs?: LifecycleJobs;
  public override register(): void {
    const c = this.app.container;
    c.singleton(budgetAdjustmentServiceToken, () => {
      const service: BudgetAdjustmentService = createBudgetAdjustmentService({
        db: c.resolve(databaseManagerToken),
        budgets: c.resolve(budgetServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
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
        jobs: executors.getJobExecutor('oa-budget-adjustment'),
        schedule: executors.getScheduleExecutor('oa-budget-adjustment'),
        jobName: 'oa-budget-adjustment-effect',
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
      kind: 'oa.budgetAdjustment',
      resource: 'oa.budgetAdjustment',
      collection: 'budgetAdjustments',
      titleField: 'reason',
      validate: (id, actorId, policy) =>
        this.app.container
          .resolve(budgetAdjustmentServiceToken)
          .searchVisible(id, actorId, policy),
    });
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'budgetAdjustments',
      title: { key: 'budgetAdjustments.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.budgetAdjustmentReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('budgetAdjustments')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await this.app.container
              .resolve(budgetAdjustmentServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.compositeResources.define(budgetAdjustmentResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.budgetAdjustment' },
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
    if (!(await db.connection().collections.get('budgetAdjustments'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-budget-adjustment')
        .warn(
          'BudgetAdjustment tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(budgetAdjustmentServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
