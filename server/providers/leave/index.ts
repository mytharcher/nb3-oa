import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';

import { leaveAttachmentServiceToken } from '../leave-attachments/service.js';
import { leaveBalanceServiceToken } from '../leave-balances/contract.js';
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
import { createApprovalJobs } from '../approval-notifications/jobs.js';
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
  createLeaveService,
  leaveServiceToken,
  type LeaveService,
} from './service.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('leaveRequests').read('*'),
);
export const leaveResource = defineCompositeResource('oa.leave', (r) =>
  r
    .title({ key: 'approvals.authz.leave', ns: 'nb3-oa' })
    .action('submit', (a) =>
      a
        .title({ key: 'approvals.authz.submit', ns: 'nb3-oa' })
        .grant('leaveRequests', read.create('*').update('*')),
    )
    .action('delegate', (a) =>
      a
        .title({ key: 'approvals.authz.delegate', ns: 'nb3-oa' })
        .grant('leaveRequests', read.create('*').update('*')),
    )
    .action('view', (a) =>
      a
        .title({ key: 'approvals.authz.view', ns: 'nb3-oa' })
        .grant('leaveRequests', read),
    ),
);
export default class LeaveProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/leave-provider';
  private jobs?: LifecycleJobs;
  public override register(): void {
    const c = this.app.container;
    c.singleton(leaveServiceToken, () => {
      const service: LeaveService = createLeaveService({
        db: c.resolve(databaseManagerToken),
        balances: c.resolve(leaveBalanceServiceToken),
        attachments: {
          assertLinked: (...args) =>
            c.resolve(leaveAttachmentServiceToken).assertLinked(...args),
        },
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
      this.jobs = createApprovalJobs(
        c.resolve(jobExecutorServiceToken),
        () => service.runtime,
        () => service.maintenance(),
      );
      return service;
    });
  }
  public override async boot(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'leaveRequests',
      title: { key: 'approvals.authz.leave', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.leaveReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('leaveRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const ids = await this.app.container
              .resolve(leaveServiceToken)
              .readableIds(principal.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('id', '$eq', id)))
              : false;
          }),
      ),
    );
    authz.compositeResources.define(leaveResource);
    authz.ui.sections.add({
      name: 'oa.approvals',
      parent: 'administration',
      title: { key: 'approvals.authz.section', ns: 'nb3-oa' },
    });
    authz.ui.place(
      { type: 'composite', id: 'oa.leave' },
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
    if (!(await db.connection().collections.get('leaveRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-leave')
        .warn(
          'Leave tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(leaveServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
