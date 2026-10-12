import { i18nToken } from '@nocobase/app-server/i18n';
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
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import { auditServiceToken } from '../audit/index.js';
import { orgServiceToken } from '../org/contract.js';
import { employeeServiceToken } from '../employees/contract.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { approvalNotificationServiceToken } from '../approval-notifications/contract.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  sequenceServiceToken,
  ruleServiceToken,
} from '../platform/index.js';
import { vendorServiceToken } from '../vendors/contract.js';
import { vendorQualificationServiceToken } from './contract.js';
import {
  createVendorQualificationService,
  vendorQualificationHttpServiceToken,
} from './service.js';
import {
  assertVendorQualificationAttachments,
  createVendorQualificationAttachmentService,
  vendorQualificationAttachmentServiceToken,
} from './attachments.js';
const read = defineDatabasePermission((p) =>
  p.collection('vendorQualifications').read('*'),
);
export const vendorQualificationResource = defineCompositeResource(
  'oa.vendorQualification',
  (r) =>
    r
      .title({ key: 'vendorQualifications.authz.resource', ns: 'nb3-oa' })
      .action('view', (a) =>
        a
          .title({ key: 'vendorQualifications.authz.view', ns: 'nb3-oa' })
          .grant('vendorQualifications', read),
      )
      .action('submit', (a) =>
        a
          .title({ key: 'vendorQualifications.authz.submit', ns: 'nb3-oa' })
          .grant('vendorQualifications', read.create('*').update('*')),
      )
      .action('paymentAccount', (a) =>
        a
          .title({
            key: 'vendorQualifications.authz.paymentAccount',
            ns: 'nb3-oa',
          })
          .grant('vendorQualifications', read),
      )
      .action('updatePaymentAccount', (a) =>
        a
          .title({
            key: 'vendorQualifications.authz.updatePaymentAccount',
            ns: 'nb3-oa',
          })
          .grant('vendorQualifications', read.update(['lifecycleVersion'])),
      )
      .action('manage', (a) =>
        a
          .title({ key: 'vendorQualifications.authz.manage', ns: 'nb3-oa' })
          .grant(
            'vendorCommitteeVersions',
            defineDatabasePermission((p) =>
              p.collection('vendorCommitteeVersions').read('*').create('*'),
            ),
          )
          .grant(
            'vendorCommitteeAssignments',
            defineDatabasePermission((p) =>
              p
                .collection('vendorCommitteeAssignments')
                .read('*')
                .create('*')
                .update('*'),
            ),
          )
          .grant(
            'vendorRemovalConfiguration',
            defineDatabasePermission((p) =>
              p
                .collection('vendorRemovalConfiguration')
                .read('*')
                .create('*')
                .update('*'),
            ),
          ),
      ),
);
export default class VendorQualificationProvider extends ServiceProvider<Application> {
  readonly name = 'oa/vendor-qualification-provider';
  private jobs?: LifecycleJobs;
  override register(): void {
    const c = this.app.container;
    c.singleton(vendorQualificationHttpServiceToken, () => {
      const service = createVendorQualificationService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        org: c.resolve(orgServiceToken),
        employees: c.resolve(employeeServiceToken),
        users: c.resolve(userAdministrationServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        calendar: c.resolve(calendarServiceToken),
        rules: c.resolve(ruleServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        vendors: c.resolve(vendorServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
        validateAttachments: (record, tx) =>
          assertVendorQualificationAttachments(
            tx,
            record.id,
            record.attachments,
          ),
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
      });
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-vendor-qualification'),
        schedule: executors.getScheduleExecutor('oa-vendor-qualification'),
        jobName: 'oa-vendor-qualification-effect',
        sweepEveryMs: 10 * 60_000,
        onSweep: async () => {
          await service.sweep();
          const kit = await service.initialize();
          await kit.runtime.prune({
            olderThan: new Date(Date.now() - 30 * 24 * 60 * 60_000),
          });
        },
      });
      return service;
    });
    c.singleton(vendorQualificationServiceToken, () =>
      c.resolve(vendorQualificationHttpServiceToken),
    );
    c.singleton(vendorQualificationAttachmentServiceToken, () =>
      createVendorQualificationAttachmentService(
        c.resolve(databaseManagerToken),
        c.resolve(vendorQualificationHttpServiceToken),
      ),
    );
  }
  override async boot(): Promise<void> {
    const c = this.app.container,
      authz = c.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'vendorQualifications',
      title: { key: 'vendorQualifications.authz.resource', ns: 'nb3-oa' },
    });
    for (const name of [
      'vendorCommitteeVersions',
      'vendorCommitteeAssignments',
      'vendorRemovalConfiguration',
    ])
      authz.database.collections.add({
        name,
        title: { key: 'vendorQualifications.authz.manage', ns: 'nb3-oa' },
      });
    authz.recordAccess.define(
      defineRecordAccess('oa.vendorQualificationReadable', (access) =>
        access
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('vendorQualifications')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const ids = await c
              .resolve(vendorQualificationHttpServiceToken)
              .readableIds(principal.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('id', '$eq', id)))
              : false;
          }),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.vendorQualificationOwned', (access) =>
        access
          .title({ key: 'approvals.authz.ownScope', ns: 'nb3-oa' })
          .collections('vendorQualifications')
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
    authz.compositeResources.define(vendorQualificationResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.vendorQualification' },
      { section: 'oa.approvals' },
    );
    const scheduler = c.resolve(schedulerServiceToken);
    const i18n = c.resolve(i18nToken),
      locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    const t = i18n.getFixedT('nb3-oa', locale);
    scheduler.registerTarget({
      type: 'app.vendor-qualification-expiry',
      title: t('vendorQualifications.schedule.title'),
      validate: (config) =>
        config !== null &&
        typeof config === 'object' &&
        !Array.isArray(config) &&
        Object.keys(config).length === 0
          ? { valid: true }
          : { valid: false, reason: 'empty-config-required' },
      start: async () => ({
        state: 'completed',
        outcome: 'succeeded',
        result: await c
          .resolve(vendorQualificationHttpServiceToken)
          .expiryReminders(),
      }),
    });
    await c.resolve(calendarServiceToken).reload();
    scheduler.defineSchedule({
      key: 'oa.vendor-qualification.expiry',
      title: t('vendorQualifications.schedule.title'),
      schedule: {
        cron: '30 0 * * *',
        timezone: c.resolve(calendarServiceToken).timeZone(),
      },
      target: { type: 'app.vendor-qualification-expiry', config: {} },
    });
  }
  override async start(): Promise<void> {
    if (
      !(await this.app.container
        .resolve(databaseManagerToken)
        .connection()
        .collections.get('vendorQualifications'))
    )
      return;
    const kit = await this.app.container
      .resolve(vendorQualificationHttpServiceToken)
      .initialize();
    await this.jobs?.start(kit.runtime);
  }
  override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
