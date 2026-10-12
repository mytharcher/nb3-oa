import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
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
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { i18nToken } from '@nocobase/app-server/i18n';
import { departureCustodyClearanceToken } from '../departure/contract.js';
import { auditServiceToken } from '../audit/index.js';
import {
  registerDepartmentScopes,
  organizationServiceToken,
} from '../org/index.js';
import { orgServiceToken } from '../org/contract.js';
import { employeeServiceToken } from '../employees/contract.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { approvalNotificationServiceToken } from '../approval-notifications/contract.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import { contractLedgerServiceToken } from '../contracts/contract.js';
import { createSealApplication } from './service.js';
import { printSourceRegistryToken } from '../template-print/contract.js';
import { createSealRegistrationPrintSource } from './print-source.js';
import {
  sealRequestServiceToken,
  sealServiceToken,
  SEAL_KIND,
} from './contract.js';
export * from './contract.js';
const title = (key: string) => ({ key: `seals.authz.${key}`, ns: 'nb3-oa' });
const read = defineDatabasePermission((p) =>
  p.collection('sealRequests').read('*'),
);
export const sealRequestResource = defineCompositeResource(
  'oa.sealRequests',
  (r) =>
    r
      .title(title('requests'))
      .action('view', (a) => a.title(title('view')).grant('sealRequests', read))
      .action('create', (a) =>
        a.title(title('create')).grant('sealRequests', read.create('*')),
      )
      .action('edit', (a) =>
        a.title(title('edit')).grant('sealRequests', read.update('*')),
      )
      .action('operate', (a) =>
        a.title(title('operate')).grant('sealRequests', read.update('*')),
      )
      .action('actualReturn', (a) =>
        a.title(title('actualReturn')).grant('sealRequests', read.update('*')),
      ),
);
export const sealLedgerResource = defineCompositeResource(
  'oa.sealLedger',
  (r) =>
    r.title(title('ledger')).action('view', (a) =>
      a
        .title(title('view'))
        .grant(
          'sealLedger',
          defineDatabasePermission((p) => p.collection('sealLedger').read('*')),
        )
        .grant(
          'sealReceipts',
          defineDatabasePermission((p) =>
            p.collection('sealReceipts').read('*'),
          ),
        ),
    ),
);
export const sealInstancesResource = defineCompositeResource('oa.seals', (r) =>
  r
    .title(title('instances'))
    .action('view', (a) =>
      a.title(title('view')).grant(
        'seals',
        defineDatabasePermission((p) => p.collection('seals').read('*')),
      ),
    )
    .action('manage', (a) =>
      a.title(title('manage')).grant(
        'seals',
        defineDatabasePermission((p) =>
          p.collection('seals').read('*').create('*').update('*'),
        ),
      ),
    ),
);
export default class SealsProvider extends ServiceProvider<Application> {
  readonly name = 'oa/seals-provider';
  private service?: ReturnType<typeof createSealApplication>;
  private jobs?: LifecycleJobs;
  private offUploads?: () => void;
  override register() {
    const c = this.app.container;
    const get = () => {
      if (this.service) return this.service;
      this.service = createSealApplication({
        db: c.resolve(databaseManagerToken),
        users: c.resolve(userAdministrationServiceToken),
        audit: c.resolve(auditServiceToken),
        org: c.resolve(orgServiceToken),
        employees: c.resolve(employeeServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
        calendar: c.resolve(calendarServiceToken),
        rules: c.resolve(ruleServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        contracts: c.resolve(contractLedgerServiceToken),
        files: c.resolve(serverFileRepositoryManagerToken),
        drive: c.resolve(driveManagerToken),
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
      });
      const jobs = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: jobs.getJobExecutor('oa-seals'),
        schedule: jobs.getScheduleExecutor('oa-seals'),
        jobName: 'oa-seals-effect',
        sweepEveryMs: 10 * 60_000,
        onSweep: async () => {
          await this.service!.requests.sweep();
          await this.service!.requests.runtime.prune({
            olderThan: new Date(Date.now() - 30 * 86400_000),
          });
        },
      });
      return this.service;
    };
    c.singleton(sealRequestServiceToken, () => get().requests);
    c.singleton(sealServiceToken, () => get().ledger);
  }
  override async boot() {
    const c = this.app.container,
      a = c.resolve(authorizationToken);
    c.resolve(departureCustodyClearanceToken).register(
      'seals',
      async (employeeId, tx) => {
        const employee = await c
          .resolve(employeeServiceToken)
          .getById(employeeId, tx);
        if (!employee?.userId)
          throw new Error('SEAL_CUSTODY_EMPLOYEE_REQUIRED');
        if (
          (
            await c
              .resolve(sealServiceToken)
              .outstandingFor(employee.userId, tx)
          ).length
        )
          throw new Error('SEAL_CUSTODY_OUTSTANDING');
      },
    );
    for (const name of ['sealRequests', 'seals', 'sealLedger', 'sealReceipts'])
      a.database.collections.add({ name, title: title('requests') });
    registerDepartmentScopes(a, c.resolve(organizationServiceToken), {
      prefix: 'oa.seals',
      targets: [
        { collection: 'sealRequests', departmentField: 'departmentId' },
        { collection: 'sealLedger', departmentField: 'departmentId' },
      ],
    });
    a.compositeResources.define(sealRequestResource);
    a.compositeResources.define(sealLedgerResource);
    a.compositeResources.define(sealInstancesResource);
    c.resolve(printSourceRegistryToken).add(
      createSealRegistrationPrintSource({
        db: c.resolve(databaseManagerToken),
        authz: a,
        service: () => c.resolve(sealServiceToken),
      }),
    );
    a.recordAccess.define(
      defineRecordAccess('oa.sealRequestsOwned', (s) =>
        s
          .title(title('owned'))
          .collections('sealRequests')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('applicantId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    a.recordAccess.define(
      defineRecordAccess('oa.sealRequestsReadable', (s) =>
        s
          .title(title('readable'))
          .collections('sealRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const ids: string[] = [],
              service = c.resolve(sealRequestServiceToken);
            for (const row of await c
              .resolve(databaseManagerToken)
              .repository<{ id: string; applicantId: string }>('sealRequests')
              .findMany()) {
              if (
                row.applicantId === principal.id ||
                (
                  await this.service!.engine.query(() =>
                    this.service!.engine.approvals.involvementOf(
                      SEAL_KIND,
                      row.id,
                      principal.id,
                    ),
                  )
                ).length ||
                (
                  await this.service!.engine.query(() =>
                    service.approvals.actionsFor(SEAL_KIND, row.id, {
                      id: principal.id,
                    }),
                  )
                ).some((offer) => offer.actions.length > 0)
              )
                ids.push(row.id);
            }
            return anyScope([
              condition('applicantId', '$eq', principal.id),
              ...ids.map((id) => condition('id', '$eq', id)),
            ]);
          }),
      ),
    );
    a.recordAccess.define(
      defineRecordAccess('oa.sealLedgerOwned', (s) =>
        s
          .title(title('owned'))
          .collections('sealLedger')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('applicantId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    a.recordAccess.define(
      defineRecordAccess('oa.sealReceiptsOwned', (s) =>
        s
          .title(title('owned'))
          .collections('sealReceipts')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            // Receipts carry immutable ledger identity, not an applicant duplicate.
            // Resolve only the current actor's owned ledger IDs; never grant every receipt.
            const owned = await c
              .resolve(databaseManagerToken)
              .repository<{ id: string; applicantId: string }>('sealLedger')
              .findMany({
                filter: { applicantId: principal.id },
                select: (s) => s.fields('id'),
              });
            return owned.length
              ? anyScope(
                  owned.map((row) => condition('ledgerId', '$eq', row.id)),
                )
              : false;
          }),
      ),
    );
    const scheduler = c.resolve(schedulerServiceToken),
      i18n = c.resolve(i18nToken),
      locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    const t = i18n.getFixedT('nb3-oa', locale);
    scheduler.registerTarget({
      type: 'app.seal-return-reminders',
      title: t('seals.schedule.title'),
      validate: (config) =>
        config &&
        typeof config === 'object' &&
        !Array.isArray(config) &&
        Object.keys(config).length === 0
          ? { valid: true }
          : { valid: false, reason: 'seal-reminder-config-must-be-empty' },
      start: async () => ({
        state: 'completed',
        outcome: 'succeeded',
        result: await c.resolve(sealRequestServiceToken).remindOverdue(),
      }),
    });
    const calendar = c.resolve(calendarServiceToken);
    await calendar.reload();
    scheduler.defineSchedule({
      key: 'oa.seals.return-reminders',
      title: t('seals.schedule.title'),
      description: t('seals.schedule.description'),
      schedule: { cron: '0 9 * * *', timezone: calendar.timeZone() },
      target: { type: 'app.seal-return-reminders', config: {} },
    });
  }
  override async start() {
    const c = this.app.container,
      db = c.resolve(databaseManagerToken),
      audit = c.resolve(auditServiceToken);
    c.resolve(sealRequestServiceToken);
    this.offUploads = db.connection().onRepositoryMutation(
      { id: 'oa/seal-upload-audit', collections: ['sealFiles'] },
      {
        inTransaction: async (event, tx) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (change.collection !== 'sealFiles' || change.kind !== 'created')
              continue;
            const file = await tx
              .repository<{ id: string; ownerId: string; requestId: string }>(
                'sealFiles',
              )
              .findOne({ filter: { id: String(change.key.id) } });
            if (!file) throw new Error('Missing seal upload metadata');
            const request = await tx
              .repository<{ id: string; applicantId: string; status: string }>(
                'sealRequests',
              )
              .findOne({ filter: { id: file.requestId } });
            if (
              !request ||
              request.applicantId !== file.ownerId ||
              !['draft', 'revision', 'exception'].includes(request.status)
            )
              throw new Error('Seal upload source became immutable');
            const employee = await c
                .resolve(employeeServiceToken)
                .getByUserId(file.ownerId, tx),
              user = await c
                .resolve(userAdministrationServiceToken)
                .withConnection(tx)
                .get(file.ownerId);
            if (
              !employee?.active ||
              employee.status === 'left' ||
              !user ||
              user.disabledAt
            )
              throw new Error('Seal upload owner is inactive');
            await audit.record(
              {
                actorId: file.ownerId,
                action: 'seal.file.upload',
                targetType: 'sealFiles',
                targetId: file.id,
                after: { requestId: file.requestId },
              },
              tx,
            );
          }
        },
      },
    );
    await this.jobs?.start(this.service!.requests.runtime);
  }
  override async shutdown() {
    this.offUploads?.();
    await this.jobs?.shutdown();
  }
}
