import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';

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
import { leaveBalanceServiceToken } from '../leave-balances/contract.js';
import { leaveServiceToken } from '../leave/service.js';
import { orgServiceToken } from '../org/contract.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import {
  cancellationServiceToken,
  createCancellationService,
  type CancellationService,
} from './service.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('leaveCancellations').read('*'),
);
export const cancellationResource = defineCompositeResource(
  'oa.leaveCancellation',
  (r) =>
    r
      .title({ key: 'approvals.authz.cancellation', ns: 'nb3-oa' })
      .action('submit', (a) =>
        a
          .title({ key: 'approvals.authz.submit', ns: 'nb3-oa' })
          .grant('leaveCancellations', read.create('*').update('*')),
      )
      .action('delegate', (a) =>
        a
          .title({ key: 'approvals.authz.delegate', ns: 'nb3-oa' })
          .grant('leaveCancellations', read.create('*').update('*')),
      )
      .action('view', (a) =>
        a
          .title({ key: 'approvals.authz.view', ns: 'nb3-oa' })
          .grant('leaveCancellations', read),
      ),
);
export default class CancellationProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/cancellation-provider';
  private jobs?: LifecycleJobs;
  public override register(): void {
    const c = this.app.container;
    c.singleton(cancellationServiceToken, () => {
      const service: CancellationService = createCancellationService({
        db: c.resolve(databaseManagerToken),
        balances: c.resolve(leaveBalanceServiceToken),
        leave: c.resolve(leaveServiceToken),
        org: c.resolve(orgServiceToken),

        audit: c.resolve(auditServiceToken),
        users: c.resolve(userAdministrationServiceToken),
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
        employees: c.resolve(employeeServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        calendar: c.resolve(calendarServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        rules: c.resolve(ruleServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
      });
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-cancellation'),
        schedule: executors.getScheduleExecutor('oa-cancellation'),
        jobName: 'oa-cancellation-effect',
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
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'leaveCancellations',
      title: { key: 'approvals.authz.cancellation', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.leaveCancellationReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('leaveCancellations')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await this.app.container
              .resolve(cancellationServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.compositeResources.define(cancellationResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.leaveCancellation' },
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
    if (!(await db.connection().collections.get('leaveCancellations'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-cancellation')
        .warn(
          'Cancellation tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(cancellationServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
