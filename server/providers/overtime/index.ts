import { registerOwnedRequestSearch } from '../request-search/owned-source.js';
import { attendanceActivitySourcesToken } from '../attendance/activity-sources.js';
import { overtimeAttendanceEvidence } from './attendance-evidence.js';
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
import { orgServiceToken } from '../org/contract.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import {
  createOvertimeService,
  overtimeServiceToken,
  type OvertimeService,
} from './service.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('overtimeRequests').read('*'),
);
export const overtimeResource = defineCompositeResource('oa.overtime', (r) =>
  r
    .title({ key: 'overtime.authz.resource', ns: 'nb3-oa' })
    .action('submit', (a) =>
      a
        .title({ key: 'approvals.authz.submit', ns: 'nb3-oa' })
        .grant('overtimeRequests', read.create('*').update('*')),
    )
    .action('delegate', (a) =>
      a
        .title({ key: 'approvals.authz.delegate', ns: 'nb3-oa' })
        .grant('overtimeRequests', read.create('*').update('*')),
    )
    .action('view', (a) =>
      a
        .title({ key: 'approvals.authz.view', ns: 'nb3-oa' })
        .grant('overtimeRequests', read),
    ),
);
export default class OvertimeProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/overtime-provider';
  private jobs?: LifecycleJobs;
  public override register(): void {
    const c = this.app.container;
    c.singleton(overtimeServiceToken, () => {
      const service: OvertimeService = createOvertimeService({
        db: c.resolve(databaseManagerToken),
        balances: c.resolve(leaveBalanceServiceToken),
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
        jobs: executors.getJobExecutor('oa-overtime'),
        schedule: executors.getScheduleExecutor('oa-overtime'),
        jobName: 'oa-overtime-effect',
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
      kind: 'oa.overtime',
      resource: 'oa.overtime',
      collection: 'overtimeRequests',
      titleField: 'reason',
      validate: (id, actorId, policy) =>
        this.app.container
          .resolve(overtimeServiceToken)
          .searchVisible(id, actorId, policy),
    });
    this.app.container
      .resolve(attendanceActivitySourcesToken)
      .register('overtime', (userId, date, connection) =>
        overtimeAttendanceEvidence(userId, date, connection),
      );
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'overtimeRequests',
      title: { key: 'overtime.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.overtimeReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('overtimeRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await this.app.container
              .resolve(overtimeServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.compositeResources.define(overtimeResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.overtime' },
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
    if (!(await db.connection().collections.get('overtimeRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-overtime')
        .warn(
          'Overtime tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(overtimeServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
