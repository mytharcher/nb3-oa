import { registerOwnedRequestSearch } from '../request-search/owned-source.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  anyScope,
  authorizationToken,
  condition,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
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
import { salaryGradeServiceToken } from '../job-grades/contract.js';
import { organizationServiceToken } from '../org/index.js';
import { calendarServiceToken, ruleServiceToken } from '../platform/index.js';
import type { TransferRecord } from './approval.js';
import { createTransferService, transferServiceToken } from './service.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('transferRequests').read('*'),
);
export const transferResource = defineCompositeResource('oa.transfer', (r) => {
  let resource = r.title({ key: 'transfer.authz.resource', ns: 'nb3-oa' });
  for (const name of ['view', 'operate', 'viewSalary'])
    resource = resource.action(name, (a) =>
      a
        .title({ key: `transfer.authz.${name}`, ns: 'nb3-oa' })
        .grant('transferRequests', read),
    );
  for (const name of ['submit', 'reviewEdit', 'cancel', 'rebind'])
    resource = resource.action(name, (a) =>
      a
        .title({ key: `transfer.authz.${name}`, ns: 'nb3-oa' })
        .grant(
          'transferRequests',
          name === 'submit' ? read.create('*').update('*') : read.update('*'),
        ),
    );
  return resource;
});
export default class TransferProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/transfer-provider';
  private jobs?: LifecycleJobs;
  public override register() {
    const c = this.app.container;
    c.singleton(transferServiceToken, () => {
      const service = createTransferService({
        db: c.resolve(databaseManagerToken),
        employees: c.resolve(employeeServiceToken),
        org: c.resolve(organizationServiceToken),
        headcounts: c.resolve(headcountServiceToken),
        grades: c.resolve(salaryGradeServiceToken),
        calendar: c.resolve(calendarServiceToken),
        rules: c.resolve(ruleServiceToken),
        audit: c.resolve(auditServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        users: c.resolve(userAdministrationServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
      });
      const jobs = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: jobs.getJobExecutor('oa-transfer'),
        schedule: jobs.getScheduleExecutor('oa-transfer'),
        jobName: 'oa-transfer-effect',
        sweepEveryMs: 600000,
        onSweep: async () => {
          await service.maintenance();
        },
      });
      return service;
    });
  }
  public override async boot() {
    registerOwnedRequestSearch(this.app, {
      kind: 'oa.transfer',
      resource: 'oa.transfer',
      collection: 'transferRequests',
      titleField: 'reason',
      numberField: null,
      validate: (id, actorId, policy) =>
        this.app.container
          .resolve(transferServiceToken)
          .searchVisible(id, actorId, policy),
    });
    const c = this.app.container,
      authz = c.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'transferRequests',
      title: { key: 'transfer.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.transferReadable', (a) =>
        a
          .title({ key: 'transfer.authz.readable', ns: 'nb3-oa' })
          .collections('transferRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return c.resolve(transferServiceToken).readableScope(principal.id);
          }),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.transferSalaryReadable', (a) =>
        a
          .title({ key: 'transfer.authz.viewSalary', ns: 'nb3-oa' })
          .collections('transferRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const org = c.resolve(organizationServiceToken);
            if (
              (await org.hasDutyRole(principal.id, 'hr')) ||
              (await org.hasDutyRole(principal.id, 'gm'))
            )
              return true;
            const rows = await c
              .resolve(databaseManagerToken)
              .repository<TransferRecord>('transferRequests')
              .findMany();
            const ids = rows
              .filter((row) => row.snapshot?.executiveId === principal.id)
              .map((row) => row.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('id', '$eq', id)))
              : false;
          }),
      ),
    );
    authz.compositeResources.define(transferResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.transfer' },
      { section: 'oa.approvals' },
    );
  }
  public override async start() {
    const c = this.app.container;
    if (
      !(await c
        .resolve(databaseManagerToken)
        .connection()
        .collections.get('transferCommands'))
    )
      return;
    const service = c.resolve(transferServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown() {
    await this.jobs?.shutdown();
  }
}
