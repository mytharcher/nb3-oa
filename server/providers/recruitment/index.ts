import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  anyScope,
  authorizationToken,
  condition,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import {
  notificationServiceToken,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification/server';
import type { Application } from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
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
import { replacementNotificationsToken } from '../headcounts/notifications.js';
import { salaryGradeServiceToken } from '../job-grades/contract.js';
import { orgServiceToken } from '../org/contract.js';
import {
  organizationServiceToken,
  registerDepartmentScopes,
} from '../org/index.js';
import { calendarServiceToken, ruleServiceToken } from '../platform/index.js';
import { createRecruitmentReplacementOwner } from './notifications.js';
import { requisitionServiceToken } from './requisitions.js';
import {
  createRecruitmentService,
  recruitmentServiceToken,
} from './service.js';
export * from './requisitions.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('recruitmentRequests').read('*'),
);
export const recruitmentResource = defineCompositeResource(
  'oa.recruitment',
  (r) =>
    r
      .title({ key: 'recruitment.authz.resource', ns: 'nb3-oa' })
      .action('view', (a) =>
        a
          .title({ key: 'recruitment.authz.view', ns: 'nb3-oa' })
          .grant('recruitmentRequests', read),
      )
      .action('submit', (a) =>
        a
          .title({ key: 'recruitment.authz.submit', ns: 'nb3-oa' })
          .grant('recruitmentRequests', read.create('*').update('*')),
      )
      .action('operate', (a) =>
        a
          .title({ key: 'recruitment.authz.operate', ns: 'nb3-oa' })
          .grant('recruitmentRequests', read),
      )
      .action('reviewEdit', (a) =>
        a
          .title({ key: 'recruitment.authz.reviewEdit', ns: 'nb3-oa' })
          .grant('recruitmentRequests', read.update('*')),
      )
      .action('viewSalary', (a) =>
        a
          .title({ key: 'recruitment.authz.viewSalary', ns: 'nb3-oa' })
          .grant('recruitmentRequests', read),
      ),
);
export const requisitionResource = defineCompositeResource(
  'oa.requisitions',
  (r) =>
    r
      .title({ key: 'recruitment.authz.requisitions', ns: 'nb3-oa' })
      .action('view', (a) =>
        a.title({ key: 'recruitment.authz.view', ns: 'nb3-oa' }).grant(
          'requisitions',
          defineDatabasePermission((p) =>
            p.collection('requisitions').read('*'),
          ),
        ),
      )
      .action('close', (a) =>
        a.title({ key: 'recruitment.authz.close', ns: 'nb3-oa' }).grant(
          'requisitions',
          defineDatabasePermission((p) =>
            p
              .collection('requisitions')
              .read('*')
              .update((u) => u.fields('status')),
          ),
        ),
      ),
);
export default class RecruitmentProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/recruitment-provider';
  private jobs?: LifecycleJobs;
  public override register() {
    const c = this.app.container;
    c.singleton(
      requisitionServiceToken,
      () => c.resolve(recruitmentServiceToken).requisitions,
    );
    c.singleton(recruitmentServiceToken, () => {
      const service = createRecruitmentService({
        db: c.resolve(databaseManagerToken),
        org: c.resolve(orgServiceToken),
        departmentOptions: (tx) =>
          c.resolve(organizationServiceToken).listTree(tx),
        employees: c.resolve(employeeServiceToken),
        headcounts: c.resolve(headcountServiceToken),
        grades: c.resolve(salaryGradeServiceToken),
        rules: c.resolve(ruleServiceToken),
        calendar: c.resolve(calendarServiceToken),
        audit: c.resolve(auditServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
        users: c.resolve(userAdministrationServiceToken),
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
      });
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-recruitment'),
        schedule: executors.getScheduleExecutor('oa-recruitment'),
        jobName: 'oa-recruitment-effect',
        sweepEveryMs: 10 * 60_000,
        onSweep: async () => {
          await service.maintenance();
          await service.runtime.prune({
            olderThan: new Date(Date.now() - 30 * 24 * 60 * 60_000),
          });
        },
      });
      return service;
    });
  }
  public override async boot() {
    const c = this.app.container,
      authz = c.resolve(authorizationToken);
    c.resolve(replacementNotificationsToken).register(
      'oa.recruitment',
      createRecruitmentReplacementOwner({
        service: () => c.resolve(recruitmentServiceToken),
        db: c.resolve(databaseManagerToken),
        authz,
        users: c.resolve(userAdministrationServiceToken),
        notification: c.resolve(notificationServiceToken),
        channels:
          this.app.config.get<NotificationConfig>('notification')?.channels ??
          {},
        inbox: () =>
          this.app.config.get<{ inbox: string | null }>('oaApprovals')?.inbox ??
          null,
        delivery: async () => {
          const i18n = c.resolve(i18nToken),
            locale = i18n.getDefaultLocale();
          await i18n.ensureLocaleLoaded(locale);
          const t = i18n.getFixedT('nb3-oa', locale);
          return {
            channel:
              this.app.config.get<{ inbox: string | null }>('oaApprovals')
                ?.inbox ?? null,
            title: t('approvals.notifications.title'),
            body: t('recruitment.notifications.replacementBlocked'),
          };
        },
      }),
    );
    // Private salary revisions and command journals have no direct database grant or public CRUD exposure.
    for (const name of ['recruitmentRequests', 'requisitions'])
      authz.database.collections.add({
        name,
        title: { key: 'recruitment.authz.resource', ns: 'nb3-oa' },
      });
    registerDepartmentScopes(authz, c.resolve(organizationServiceToken), {
      prefix: 'oa.recruitment',
      targets: [
        { collection: 'recruitmentRequests', departmentField: 'departmentId' },
        { collection: 'requisitions', departmentField: 'departmentId' },
      ],
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.recruitmentReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('recruitmentRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return c
              .resolve(recruitmentServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.recruitmentSalaryReadable', (a) =>
        a
          .title({ key: 'recruitment.authz.viewSalary', ns: 'nb3-oa' })
          .collections('recruitmentRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const ids = await c
              .resolve(recruitmentServiceToken)
              .salaryReadableIds(principal.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('id', '$eq', id)))
              : false;
          }),
      ),
    );
    authz.compositeResources.define(recruitmentResource);
    authz.compositeResources.define(requisitionResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.recruitment' },
      { section: 'oa.approvals' },
    );
    authz.ui.place(
      { type: 'composite', id: 'oa.requisitions' },
      { section: 'oa.approvals' },
    );
  }
  public override async start() {
    const c = this.app.container;
    if (
      !(await c
        .resolve(databaseManagerToken)
        .connection()
        .collections.get('recruitmentCommands'))
    ) {
      c.resolve(loggingToken)
        .getLogger('oa-recruitment')
        .warn('Recruitment tables are not installed; maintenance is deferred.');
      return;
    }
    const service = c.resolve(recruitmentServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown() {
    await this.jobs?.shutdown();
  }
}
