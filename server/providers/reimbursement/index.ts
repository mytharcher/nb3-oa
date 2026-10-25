import { driveManagerToken } from '@nocobase/app-server/drive';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import {
  createReimbursementInvoiceSource,
  reimbursementInvoiceSourceToken,
} from './invoice-source.js';
import { registerOwnedRequestSearch } from '../request-search/owned-source.js';
import {
  lockUserForAdministration,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import { expenseAuthorizationServiceToken } from '../expense-authorizations/contract.js';
import { financeAssignmentServiceToken } from '../finance-assignments/contract.js';
import { invoiceServiceToken } from '../invoices/contract.js';
import { loanLedgerServiceToken } from '../loan-ledger/contract.js';
import { dictionaryServiceToken } from '../platform/index.js';
import {
  assertReimbursementAttachments,
  createReimbursementAttachmentService,
  ReimbursementAttachmentError,
  reimbursementAttachmentServiceToken,
} from './attachments.js';
import type { ReimbursementRecord } from './contract.js';
import {
  createExpenseSummary,
  reimbursementExpenseSummaryToken,
} from './expense-summary.js';
export * from './attachments.js';
export * from './expense-summary.js';
export * from './service.js';

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
  createReimbursementService,
  reimbursementServiceToken,
  type ReimbursementService,
} from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('reimbursementRequests').read('*'),
);
export const reimbursementResource = defineCompositeResource(
  'oa.reimbursement',
  (r) =>
    r
      .title({ key: 'reimbursementRequests.authz.resource', ns: 'nb3-oa' })
      .action('submit', (a) =>
        a
          .title({ key: 'reimbursementRequests.authz.submit', ns: 'nb3-oa' })
          .grant('reimbursementRequests', read.create('*').update('*')),
      )
      .action('delegate', (a) =>
        a
          .title({ key: 'reimbursementRequests.authz.delegate', ns: 'nb3-oa' })
          .grant('reimbursementRequests', read.create('*').update('*')),
      )
      .action('paymentAccount', (a) =>
        a
          .title({
            key: 'reimbursementRequests.authz.paymentAccount',
            ns: 'nb3-oa',
          })
          .grant('reimbursementRequests', read),
      )
      .action('view', (a) =>
        a
          .title({ key: 'reimbursementRequests.authz.view', ns: 'nb3-oa' })
          .grant('reimbursementRequests', read),
      ),
);
export default class ReimbursementProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/reimbursement-provider';
  private jobs?: LifecycleJobs;
  private unsubscribe?: () => void;
  public override register(): void {
    const c = this.app.container;
    c.singleton(reimbursementExpenseSummaryToken, () =>
      createExpenseSummary(
        c.resolve(databaseManagerToken),
        c.resolve(calendarServiceToken),
      ),
    );
    c.singleton(reimbursementServiceToken, () => {
      const service: ReimbursementService = createReimbursementService({
        db: c.resolve(databaseManagerToken),
        invoices: c.resolve(invoiceServiceToken),
        loans: c.resolve(loanLedgerServiceToken),
        accountants: c.resolve(financeAssignmentServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        validateAttachments: async (record, connection) => {
          for (const line of record.lines)
            if (
              line.attachmentIds.length > 10 ||
              new Set(line.attachmentIds).size !== line.attachmentIds.length
            )
              throw new ReimbursementAttachmentError(
                'REIMBURSEMENT_ATTACHMENT_INVALID',
                'Each expense line requires at most ten distinct attachments.',
              );
          await assertReimbursementAttachments(
            connection,
            record.id,
            record.lines.flatMap((line) => line.attachmentIds),
          );
        },
        authorizations: c.resolve(expenseAuthorizationServiceToken),
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
        jobs: executors.getJobExecutor('oa-reimbursement'),
        schedule: executors.getScheduleExecutor('oa-reimbursement'),
        jobName: 'oa-reimbursement-effect',
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
    c.singleton(reimbursementInvoiceSourceToken, () =>
      createReimbursementInvoiceSource(
        c.resolve(reimbursementAttachmentServiceToken),
        c.resolve(reimbursementServiceToken),
        c.resolve(serverFileRepositoryManagerToken),
        c.resolve(driveManagerToken),
      ),
    );
    c.singleton(reimbursementAttachmentServiceToken, () =>
      createReimbursementAttachmentService(
        c.resolve(databaseManagerToken),
        c.resolve(reimbursementServiceToken),
      ),
    );
  }
  public override async boot(): Promise<void> {
    registerOwnedRequestSearch(this.app, {
      kind: 'oa.reimbursement',
      resource: 'oa.reimbursement',
      collection: 'reimbursementRequests',
      titleField: 'reason',
      validate: (id, actorId, policy) =>
        this.app.container
          .resolve(reimbursementServiceToken)
          .searchVisible(id, actorId, policy),
    });
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'reimbursementRequests',
      title: { key: 'reimbursementRequests.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.reimbursementReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('reimbursementRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await this.app.container
              .resolve(reimbursementServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.reimbursementOwned', (a) =>
        a
          .title({
            key: 'reimbursementRequests.actionForm.ownedScope',
            ns: 'nb3-oa',
          })
          .collections('reimbursementRequests')
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
    authz.compositeResources.define(reimbursementResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.reimbursement' },
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
    if (!(await db.connection().collections.get('reimbursementRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-reimbursement')
        .warn(
          'Reimbursement tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(reimbursementServiceToken);
    this.unsubscribe = db.connection().onRepositoryMutation(
      {
        id: 'oa/reimbursement-upload',
        collections: ['reimbursementAttachmentFiles'],
      },
      {
        inTransaction: async (event, connection) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'reimbursementAttachmentFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await connection
              .repository<{
                id: string;
                reimbursementId: string;
                ownerId: string;
                uploadVersion: number;
              }>('reimbursementAttachmentFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            const before = file
              ? await connection
                  .repository<ReimbursementRecord>('reimbursementRequests')
                  .findOne({ filter: { id: file.reimbursementId } })
              : undefined;
            if (!file || !before)
              throw new ReimbursementAttachmentError(
                'REIMBURSEMENT_ATTACHMENT_DENIED',
                'The owning draft no longer exists.',
              );
            await lockUserForAdministration(connection, before.applicantId);
            const row = await connection
              .repository<ReimbursementRecord>('reimbursementRequests')
              .findOne({ filter: { id: file.reimbursementId } });
            if (
              !row ||
              !['draft', 'revision'].includes(row.status) ||
              row.lifecycleVersion !== file.uploadVersion ||
              ![row.applicantId, row.createdById].includes(file.ownerId)
            )
              throw new ReimbursementAttachmentError(
                'REIMBURSEMENT_ATTACHMENT_DENIED',
                'The draft changed during upload.',
              );
            await this.app.container.resolve(auditServiceToken).record(
              {
                actorId: file.ownerId,
                action: 'reimbursementAttachment.upload',
                targetType: 'reimbursementRequests',
                targetId: file.reimbursementId,
                after: { fileId: file.id },
              },
              connection,
            );
          }
        },
      },
    );
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    this.unsubscribe?.();
    await this.jobs?.shutdown();
  }
}
