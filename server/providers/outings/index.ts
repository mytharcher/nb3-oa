import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';

import { attendanceServiceToken } from '../attendance/contract.js';
import { orgServiceToken } from '../org/contract.js';
import { auditServiceToken } from '../audit/index.js';
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
import { loggingToken } from '@nocobase/app-server/logging';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { createLifecycleJobs } from '@nocobase/lifecycle/jobs';
import type { LifecycleJobs } from '@nocobase/lifecycle/jobs';
import { approvalNotificationServiceToken } from '../approval-notifications/contract.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { employeeServiceToken } from '../employees/contract.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import {
  createOutingService,
  outingServiceToken,
  type OutingService,
} from './service.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('outingRequests').read('*'),
);
export const outingResource = defineCompositeResource('oa.outing', (r) =>
  r
    .title({ key: 'outings.authz.resource', ns: 'nb3-oa' })
    .action('submit', (a) =>
      a
        .title({ key: 'approvals.authz.submit', ns: 'nb3-oa' })
        .grant('outingRequests', read.create('*').update('*')),
    )
    .action('delegate', (a) =>
      a
        .title({ key: 'approvals.authz.delegate', ns: 'nb3-oa' })
        .grant('outingRequests', read.create('*').update('*')),
    )
    .action('view', (a) =>
      a
        .title({ key: 'approvals.authz.view', ns: 'nb3-oa' })
        .grant('outingRequests', read),
    ),
);
export default class OutingProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/outings-provider';
  private jobs?: LifecycleJobs;
  public override register(): void {
    const c = this.app.container;
    c.singleton(outingServiceToken, () => {
      const service: OutingService = createOutingService({
        db: c.resolve(databaseManagerToken),
        attendance: c.resolve(attendanceServiceToken),
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
        jobs: executors.getJobExecutor('oa-outing'),
        schedule: executors.getScheduleExecutor('oa-outing'),
        jobName: 'oa-outing-effect',
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
      name: 'outingRequests',
      title: { key: 'outings.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.outingReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('outingRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const ids = await this.app.container
              .resolve(outingServiceToken)
              .readableIds(principal.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('id', '$eq', id)))
              : false;
          }),
      ),
    );
    authz.compositeResources.define(outingResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.outing' },
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
    if (!(await db.connection().collections.get('outingRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-outing')
        .warn(
          'Outing tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(outingServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
