import { databaseManagerToken } from '@nocobase/db';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import {
  createReplacementNotifications,
  replacementNotificationsToken,
} from './notifications.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';
import { auditServiceToken } from '../audit/index.js';
import { employeeServiceToken } from '../employees/contract.js';
import {
  organizationServiceToken,
  registerDepartmentScopes,
} from '../org/index.js';
import { orgServiceToken } from '../org/contract.js';
import { calendarServiceToken } from '../platform/index.js';
import { headcountServiceToken } from './contract.js';
import { createHeadcountService } from './service.js';
export * from './contract.js';
export { HeadcountError, createHeadcountService } from './service.js';
export const HEADCOUNT_FIELDS = [
  'id',
  'departmentId',
  'positionId',
  'year',
  'limit',
  'initialized',
  'version',
  'createdAt',
  'updatedAt',
] as const;
export default class HeadcountsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/headcounts-provider';
  private jobs?: LifecycleJobs;
  public override register() {
    const c = this.app.container;
    c.singleton(replacementNotificationsToken, () => {
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-headcount-notices'),
        schedule: executors.getScheduleExecutor('oa-headcount-notices'),
        jobName: 'oa-headcount-replacement-notice',
        sweepEveryMs: 600000,
        onSweep: () =>
          c
            .resolve(headcountServiceToken)
            .recoverReplacementNotifications(
              c.resolve(databaseManagerToken).connection(),
            ),
      });
      return createReplacementNotifications({
        db: c.resolve(databaseManagerToken),
        dispatcher: this.jobs,
      });
    });
    c.singleton(headcountServiceToken, () =>
      createHeadcountService({
        audit: c.resolve(auditServiceToken),
        employees: c.resolve(employeeServiceToken),
        org: c.resolve(orgServiceToken),
        calendar: c.resolve(calendarServiceToken),
        notifications: c.resolve(replacementNotificationsToken),
      }),
    );
  }
  public override async start() {
    const notices = this.app.container.resolve(replacementNotificationsToken);
    await this.jobs!.start(notices.runtime);
    await this.app.container
      .resolve(headcountServiceToken)
      .recoverReplacementNotifications(
        this.app.container.resolve(databaseManagerToken).connection(),
      );
  }
  public override async shutdown() {
    await this.jobs?.shutdown();
  }
  public override async boot() {
    const c = this.app.container,
      authz = c.resolve(authorizationToken);
    for (const name of ['headcountAccounts', 'headcountJournal'])
      authz.database.collections.add({
        name,
        title: { key: 'headcounts.authz.title', ns: 'nb3-oa' },
      });
    registerDepartmentScopes(authz, c.resolve(organizationServiceToken), {
      prefix: 'oa.headcounts',
      targets: [
        { collection: 'headcountAccounts', departmentField: 'departmentId' },
        { collection: 'headcountJournal', departmentField: 'departmentId' },
      ],
    });
    const accountRead = defineDatabasePermission((p) =>
      p
        .collection('headcountAccounts')
        .read((r) => r.fields(...HEADCOUNT_FIELDS)),
    );
    authz.compositeResources.define(
      defineCompositeResource('oa.headcounts', (r) =>
        r
          .title({ key: 'headcounts.authz.title', ns: 'nb3-oa' })
          .action('view', (a) =>
            a
              .title({ key: 'headcounts.authz.view', ns: 'nb3-oa' })
              .grant('headcountAccounts', accountRead),
          )
          .action('manage', (a) =>
            a.title({ key: 'headcounts.authz.manage', ns: 'nb3-oa' }).grant(
              'headcountAccounts',
              defineDatabasePermission((p) =>
                p
                  .collection('headcountAccounts')
                  .read((r) => r.fields(...HEADCOUNT_FIELDS))
                  .create('*')
                  .update((u) =>
                    u.fields('limit', 'initialized', 'version', 'updatedAt'),
                  ),
              ),
            ),
          )
          .action('viewJournal', (a) =>
            a
              .title({ key: 'headcounts.authz.viewJournal', ns: 'nb3-oa' })
              .grant('headcountAccounts', accountRead)
              .grant(
                'headcountJournal',
                defineDatabasePermission((p) =>
                  p.collection('headcountJournal').read('*'),
                ),
              ),
          ),
      ),
    );
    authz.ui.sections.add({
      name: 'oa.headcounts',
      parent: 'administration',
      title: { key: 'headcounts.authz.title', ns: 'nb3-oa' },
    });
    authz.ui.place(
      { type: 'composite', id: 'oa.headcounts' },
      { section: 'oa.headcounts' },
    );
  }
}
