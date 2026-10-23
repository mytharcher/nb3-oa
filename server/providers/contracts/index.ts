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
import { orgServiceToken } from '../org/contract.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import { vendorServiceToken } from '../vendors/contract.js';
import {
  assertContractAttachments,
  assertContractText,
  contractAttachmentServiceToken,
  createContractAttachmentService,
} from './attachments.js';
import {
  contractLedgerServiceToken,
  contractServiceToken,
} from './contract.js';
import { createContractLedgerService } from './ledger.js';
import { contractHttpServiceToken, createContractService } from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('contractRequests').read('*'),
);
export const contractResource = defineCompositeResource('oa.contract', (r) =>
  r
    .title({ key: 'contracts.authz.resource', ns: 'nb3-oa' })
    .action('view', (a) =>
      a
        .title({ key: 'contracts.authz.view', ns: 'nb3-oa' })
        .grant('contractRequests', read),
    )
    .action('submit', (a) =>
      a
        .title({ key: 'contracts.authz.submit', ns: 'nb3-oa' })
        .grant('contractRequests', read.create('*').update('*')),
    )
    .action('ledger', (a) =>
      a
        .title({ key: 'contracts.authz.ledger', ns: 'nb3-oa' })
        .grant(
          'contracts',
          defineDatabasePermission((p) => p.collection('contracts').read('*')),
        )
        .grant(
          'contractVersions',
          defineDatabasePermission((p) =>
            p.collection('contractVersions').read('*'),
          ),
        ),
    )
    .action('historicalEntry', (a) =>
      a
        .title({ key: 'contracts.authz.historicalEntry', ns: 'nb3-oa' })
        .grant('contractRequests', read.update('*')),
    ),
);
export default class ContractsProvider extends ServiceProvider<Application> {
  readonly name = 'oa/contracts-provider';
  private jobs?: LifecycleJobs;
  override register() {
    const c = this.app.container;
    c.singleton(contractLedgerServiceToken, () =>
      createContractLedgerService(
        c.resolve(databaseManagerToken),
        c.resolve(auditServiceToken),
      ),
    );
    c.singleton(contractHttpServiceToken, () => {
      const service = createContractService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        org: c.resolve(orgServiceToken),
        employees: c.resolve(employeeServiceToken),
        users: c.resolve(userAdministrationServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        calendar: c.resolve(calendarServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        rules: c.resolve(ruleServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        vendors: c.resolve(vendorServiceToken),
        ledger: c.resolve(contractLedgerServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
        validateFiles: async (record, tx) => {
          await assertContractAttachments(tx, record.id, record.attachments);
          await assertContractText(tx, record.id, record.textVersionId);
        },
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
      });
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-contracts'),
        schedule: executors.getScheduleExecutor('oa-contracts'),
        jobName: 'oa-contracts-effect',
        sweepEveryMs: 10 * 60_000,
        onSweep: async () => {
          const kit = await service.initialize();
          await service.sweep();
          await kit.runtime.prune({
            olderThan: new Date(Date.now() - 30 * 24 * 60 * 60_000),
          });
        },
      });
      return service;
    });
    c.singleton(contractServiceToken, () =>
      c.resolve(contractHttpServiceToken),
    );
    c.singleton(contractAttachmentServiceToken, () =>
      createContractAttachmentService(
        c.resolve(databaseManagerToken),
        c.resolve(contractHttpServiceToken),
      ),
    );
  }
  override async boot() {
    const c = this.app.container,
      authz = c.resolve(authorizationToken);
    for (const name of ['contractRequests', 'contracts', 'contractVersions'])
      authz.database.collections.add({
        name,
        title: { key: 'contracts.authz.resource', ns: 'nb3-oa' },
      });
    authz.recordAccess.define(
      defineRecordAccess('oa.contractReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('contractRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await c
              .resolve(contractHttpServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.contractOwned', (a) =>
        a
          .title({ key: 'approvals.authz.ownScope', ns: 'nb3-oa' })
          .collections('contractRequests')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? anyScope([
                  condition('applicantId', '$eq', principal.id),
                  condition('creatorId', '$eq', principal.id),
                ])
              : false,
          ),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.contractLedgerOwned', (a) =>
        a
          .title({ key: 'approvals.authz.ownScope', ns: 'nb3-oa' })
          .collections('contracts')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('applicantId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.contractVersionOwned', (a) =>
        a
          .title({ key: 'approvals.authz.ownScope', ns: 'nb3-oa' })
          .collections('contractVersions')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const rows = await c
              .resolve(databaseManagerToken)
              .repository<{ id: string; applicantId: string }>('contracts')
              .findMany({ filter: { applicantId: principal.id } });
            return rows.length
              ? anyScope(
                  rows.map((row) => condition('contractId', '$eq', row.id)),
                )
              : false;
          }),
      ),
    );
    authz.compositeResources.define(contractResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.contract' },
      { section: 'oa.approvals' },
    );
  }
  override async start() {
    const kit = await this.app.container
      .resolve(contractHttpServiceToken)
      .initialize();
    await this.jobs?.start(kit.runtime);
  }
  override async shutdown() {
    await this.jobs?.shutdown();
  }
}
