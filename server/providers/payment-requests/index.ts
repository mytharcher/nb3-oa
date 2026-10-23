import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { contractLedgerServiceToken } from '../contracts/contract.js';
import { invoiceServiceToken } from '../invoices/contract.js';
import { dictionaryServiceToken } from '../platform/index.js';
import { purchaseOrderServiceToken } from '../purchases/contract.js';
import { vendorServiceToken } from '../vendors/contract.js';
import {
  assertPaymentAttachments,
  createPaymentAttachmentService,
  paymentAttachmentServiceToken,
} from './attachments.js';

import {
  anyScope,
  authorizationToken,
  condition,
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
  createPaymentRequestService,
  paymentRequestServiceToken,
  type PaymentRequestService,
} from './service.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('paymentRequests').read('*'),
);
export const paymentRequestResource = defineCompositeResource(
  'oa.payment',
  (r) =>
    r
      .title({ key: 'paymentRequests.authz.resource', ns: 'nb3-oa' })
      .action('submit', (a) =>
        a
          .title({ key: 'paymentRequests.authz.submit', ns: 'nb3-oa' })
          .grant('paymentRequests', read.create('*').update('*')),
      )
      .action('delegate', (a) =>
        a
          .title({ key: 'paymentRequests.authz.delegate', ns: 'nb3-oa' })
          .grant('paymentRequests', read.create('*').update('*')),
      )
      .action('voucherEvidence', (a) =>
        a
          .title({ key: 'paymentRequests.authz.voucherEvidence', ns: 'nb3-oa' })
          .grant('paymentRequests', read.update(['voucherAttachments'])),
      )
      .action('paymentAccount', (a) =>
        a
          .title({ key: 'paymentRequests.authz.paymentAccount', ns: 'nb3-oa' })
          .grant('paymentRequests', read),
      )
      .action('view', (a) =>
        a
          .title({ key: 'paymentRequests.authz.view', ns: 'nb3-oa' })
          .grant('paymentRequests', read),
      ),
);
export default class PaymentRequestProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/payment-requests-provider';
  private jobs?: LifecycleJobs;
  public override register(): void {
    const c = this.app.container;
    c.singleton(paymentRequestServiceToken, () => {
      const service: PaymentRequestService = createPaymentRequestService({
        db: c.resolve(databaseManagerToken),
        orders: c.resolve(purchaseOrderServiceToken),
        contracts: c.resolve(contractLedgerServiceToken),
        vendors: c.resolve(vendorServiceToken),
        invoices: c.resolve(invoiceServiceToken),
        validateAttachments: (record, purpose, connection) =>
          assertPaymentAttachments(
            connection,
            record.id,
            purpose === 'invoice'
              ? record.attachments
              : record.voucherAttachments,
            purpose,
          ),
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
        jobs: executors.getJobExecutor('oa-payment-requests'),
        schedule: executors.getScheduleExecutor('oa-payment-requests'),
        jobName: 'oa-payment-requests-effect',
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
    c.singleton(paymentAttachmentServiceToken, () =>
      createPaymentAttachmentService(
        c.resolve(databaseManagerToken),
        c.resolve(paymentRequestServiceToken) as PaymentRequestService,
      ),
    );
  }
  public override async boot(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'paymentRequests',
      title: { key: 'paymentRequests.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.paymentReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('paymentRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const service = this.app.container.resolve(
              paymentRequestServiceToken,
            ) as PaymentRequestService;
            return await service.readableScope(principal.id);
          }),
      ),
    );
    authz.compositeResources.define(paymentRequestResource);
    authz.recordAccess.define(
      defineRecordAccess('oa.paymentOwn', (a) =>
        a
          .title({ key: 'paymentRequests.authz.ownScope', ns: 'nb3-oa' })
          .collections('paymentRequests')
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
    authz.ui.place(
      { type: 'composite', id: 'oa.payment' },
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
    if (!(await db.connection().collections.get('paymentRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-payment-requests')
        .warn(
          'PaymentRequest tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(
      paymentRequestServiceToken,
    ) as PaymentRequestService;
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
