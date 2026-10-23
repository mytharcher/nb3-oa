import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { budgetServiceToken } from '../budgets/contract.js';
import { dictionaryServiceToken } from '../platform/index.js';
import { vendorServiceToken } from '../vendors/contract.js';
import {
  createPurchaseAttachmentService,
  PurchaseAttachmentError,
  purchaseAttachmentServiceToken,
} from './attachments.js';
import { purchaseOrderServiceToken } from './contract.js';
import { createPurchaseOrderService } from './orders.js';

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
  createPurchaseService,
  purchaseServiceToken,
  type PurchaseService,
} from './service.js';
export * from './attachments.js';
export * from './contract.js';
export { PurchaseOrderError } from './orders.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('purchaseRequests').read('*'),
);
export const purchaseResource = defineCompositeResource('oa.purchase', (r) =>
  r
    .title({ key: 'purchases.authz.resource', ns: 'nb3-oa' })
    .action('submit', (a) =>
      a
        .title({ key: 'purchases.authz.submit', ns: 'nb3-oa' })
        .grant('purchaseRequests', read.create('*').update('*')),
    )
    .action('view', (a) =>
      a
        .title({ key: 'purchases.authz.view', ns: 'nb3-oa' })
        .grant('purchaseRequests', read),
    )
    .action('orders', (a) =>
      a.title({ key: 'purchases.authz.orders', ns: 'nb3-oa' }).grant(
        'purchaseOrders',
        defineDatabasePermission((p) =>
          p.collection('purchaseOrders').read('*'),
        ),
      ),
    )
    .action('accept', (a) =>
      a.title({ key: 'purchases.authz.accept', ns: 'nb3-oa' }).grant(
        'purchaseOrders',
        defineDatabasePermission((p) =>
          p.collection('purchaseOrders').read('*').update('*'),
        ),
      ),
    ),
);
export default class PurchaseProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/purchases-provider';
  private jobs?: LifecycleJobs;
  private unsubscribe?: () => void;
  public override register(): void {
    const c = this.app.container;
    c.singleton(purchaseOrderServiceToken, () =>
      createPurchaseOrderService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        budgets: c.resolve(budgetServiceToken),
        vendors: c.resolve(vendorServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
      }),
    );
    c.singleton(purchaseAttachmentServiceToken, () =>
      createPurchaseAttachmentService({
        db: c.resolve(databaseManagerToken),
        purchase: {
          detail: (...args) => c.resolve(purchaseServiceToken).detail(...args),
        },
        directory: c.resolve(approvalDirectoryServiceToken),
        vendors: c.resolve(vendorServiceToken),
      }),
    );
    c.singleton(purchaseServiceToken, () => {
      const service: PurchaseService = createPurchaseService({
        db: c.resolve(databaseManagerToken),
        budgets: c.resolve(budgetServiceToken),
        vendors: c.resolve(vendorServiceToken),
        orders: c.resolve(purchaseOrderServiceToken),
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
        jobs: executors.getJobExecutor('oa-purchases'),
        schedule: executors.getScheduleExecutor('oa-purchases'),
        jobName: 'oa-purchases-effect',
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
      name: 'purchaseRequests',
      title: { key: 'purchases.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.purchaseReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('purchaseRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await this.app.container
              .resolve(purchaseServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.database.collections.add({
      name: 'purchaseOrders',
      title: { key: 'purchases.ordersTitle', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.purchaseOrderReadable', (scope) =>
        scope
          .title({ key: 'purchases.authz.orderScope', ns: 'nb3-oa' })
          .collections('purchaseOrders')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const ids = await this.app.container
              .resolve(purchaseServiceToken)
              .readableIds(principal.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('purchaseId', '$eq', id)))
              : false;
          }),
      ),
    );
    authz.compositeResources.define(purchaseResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.purchase' },
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
    if (!(await db.connection().collections.get('purchaseRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-purchases')
        .warn(
          'Purchase tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(purchaseServiceToken);
    await service.initialize();
    const audit = this.app.container.resolve(auditServiceToken);
    this.unsubscribe = db.connection().onRepositoryMutation(
      { id: 'oa/purchase-quote-upload', collections: ['purchaseQuoteFiles'] },
      {
        inTransaction: async (event, connection) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'purchaseQuoteFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await connection
              .repository<{
                id: string;
                purchaseId: string;
                vendorId: string;
                ownerId: string;
                uploadVersion: number;
                quoteBasisHash: string;
              }>('purchaseQuoteFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            if (!file)
              throw new PurchaseAttachmentError(
                'PURCHASE_ATTACHMENT_INVALID',
                'Uploaded quote metadata is missing.',
              );
            const expectedBasis = await this.app.container
              .resolve(purchaseAttachmentServiceToken)
              .assertUpload(
                connection,
                file.purchaseId,
                file.vendorId,
                file.ownerId,
                file.uploadVersion,
              );
            if (file.quoteBasisHash !== expectedBasis)
              throw new PurchaseAttachmentError(
                'PURCHASE_ATTACHMENT_INVALID',
                'The quote basis changed during upload.',
              );
            await audit.record(
              {
                actorId: file.ownerId,
                action: 'purchase.quoteUpload',
                targetType: 'purchaseRequests',
                targetId: file.purchaseId,
                after: { fileId: file.id, vendorId: file.vendorId },
              },
              connection,
            );
          }
        },
      },
    );
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    this.unsubscribe?.();
    await this.jobs?.shutdown();
  }
}
