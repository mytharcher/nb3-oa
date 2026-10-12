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
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { auditServiceToken } from '../audit/index.js';
import { orgServiceToken } from '../org/contract.js';
import { employeeServiceToken } from '../employees/contract.js';
import {
  employeeArchiveServiceToken,
  createEmployeeArchiveService,
} from '../employees/archive.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { approvalNotificationServiceToken } from '../approval-notifications/contract.js';
import {
  calendarServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import {
  printSourceRegistryToken,
  templatePrintServiceToken,
} from '../template-print/contract.js';
import {
  certificatePrintServiceToken,
  certificateRequestServiceToken,
} from './contract.js';
import { sourceFields } from '../template-print/sources.js';
import { CertificateError } from './errors.js';
import type { RepositoryPolicy } from '@nocobase/db';
import { createCertificateApplication } from './service.js';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import { CERTIFICATE_KIND } from './contract.js';
export * from './contract.js';
const title = (key: string) => ({
  key: `certificates.authz.${key}`,
  ns: 'nb3-oa',
});
const read = defineDatabasePermission((p) =>
  p.collection('certificateRequests').read('*'),
);
export const certificateResource = defineCompositeResource(
  'oa.certificateRequests',
  (r) =>
    r
      .title(title('requests'))
      .action('view', (a) =>
        a.title(title('view')).grant('certificateRequests', read),
      )
      .action('create', (a) =>
        a.title(title('create')).grant('certificateRequests', read.create('*')),
      )
      .action('edit', (a) =>
        a.title(title('edit')).grant('certificateRequests', read.update('*')),
      )
      .action('operate', (a) =>
        a
          .title(title('operate'))
          .grant('certificateRequests', read.update('*')),
      )
      .action('issue', (a) =>
        a
          .title(title('issue'))
          .grant(
            'certificateRequests',
            read.update(['preparationId', 'issueId']),
          ),
      )
      .action('viewIncome', (a) =>
        a.title(title('income')).grant(
          'certificatePreparationPrivate',
          defineDatabasePermission((p) =>
            p.collection('certificatePreparationPrivate').read('*').create('*'),
          ),
        ),
      ),
);
export default class CertificatesProvider extends ServiceProvider<Application> {
  readonly name = 'oa/certificates-provider';
  private service?: ReturnType<typeof createCertificateApplication>;
  private jobs?: LifecycleJobs;
  private offUploads?: () => void;
  override register() {
    const c = this.app.container;
    // Dedicated immutable archive facade; no EmployeeService contract mutation.
    c.singleton(employeeArchiveServiceToken, () =>
      createEmployeeArchiveService({
        employees: c.resolve(employeeServiceToken),
        audit: c.resolve(auditServiceToken),
      }),
    );
    const get = () => {
      if (this.service) return this.service;
      this.service = createCertificateApplication({
        db: c.resolve(databaseManagerToken),
        users: c.resolve(userAdministrationServiceToken),
        audit: c.resolve(auditServiceToken),
        org: c.resolve(orgServiceToken),
        employees: c.resolve(employeeServiceToken),
        archive: c.resolve(employeeArchiveServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
        calendar: c.resolve(calendarServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        templates: c.resolve(templatePrintServiceToken),
        files: c.resolve(serverFileRepositoryManagerToken),
        drive: c.resolve(driveManagerToken),
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
      });
      const jobs = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: jobs.getJobExecutor('oa-certificates'),
        schedule: jobs.getScheduleExecutor('oa-certificates'),
        jobName: 'oa-certificates-effect',
        sweepEveryMs: 600_000,
        onSweep: async () => {
          await this.service!.requests.sweep();
        },
      });
      return this.service;
    };
    c.singleton(certificateRequestServiceToken, () => get().requests);
    c.singleton(certificatePrintServiceToken, () => get().print);
  }
  override async boot() {
    const a = this.app.container.resolve(authorizationToken);
    for (const name of ['certificateRequests', 'certificatePreparationPrivate'])
      a.database.collections.add({ name, title: title('requests') });
    a.compositeResources.define(certificateResource);
    this.app.container.resolve(printSourceRegistryToken).add({
      name: 'certificates',
      schemaVersion: 1,
      collection: 'certificateRequests',
      viewResource: 'oa.certificateRequests',
      fields: sourceFields.certificates,
      load: async ({ recordId, actorId, policy, paths, locale }) => {
        if (paths.some((path) => !(path in sourceFields.certificates)))
          throw new CertificateError('CERTIFICATE_ACCESS_DENIED');
        const principal = { type: 'user', id: actorId };
        const subjects = await a.subjects.resolveFor(principal);
        const current = a.for({ principal, subjects });
        const resolve = async (
          action: string,
          collection: string,
          optional = false,
          resource = 'oa.certificateRequests',
        ) => {
          const decision = await current.authorize({
            resource: { type: 'composite', id: resource },
            action,
          });
          const granted =
            decision.effect === 'deny'
              ? undefined
              : (
                  decision.conditions?.database as
                    | Record<string, RepositoryPolicy | false | undefined>
                    | undefined
                )?.[collection];
          if (!granted && !optional)
            throw new CertificateError('CERTIFICATE_ACCESS_DENIED');
          return granted || undefined;
        };
        const access = {
          view: (await resolve('view', 'certificateRequests'))!,
          issue: (await resolve('issue', 'certificateRequests'))!,
          income: await resolve(
            'viewIncome',
            'certificatePreparationPrivate',
            true,
          ),
        };
        const printing = this.app.container.resolve(
          certificatePrintServiceToken,
        );
        // The caller's source-print policy and the owner's current grants must both allow the DTO.
        await printing.source(recordId, actorId, access, locale);
        const sourcePolicy = (await resolve(
          'printCertificates',
          'certificateRequests',
          false,
          'oa.templatePrint',
        ))!;
        await printing.source(
          recordId,
          actorId,
          { ...access, view: sourcePolicy },
          locale,
        );
        return {
          ...(await printing.source(
            recordId,
            actorId,
            { ...access, view: policy },
            locale,
          )),
        };
      },
    });
    a.recordAccess.define(
      defineRecordAccess('oa.certificateRequestsOwned', (s) =>
        s
          .title(title('owned'))
          .collections('certificateRequests')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('applicantId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    a.recordAccess.define(
      defineRecordAccess('oa.certificateRequestsReadable', (s) =>
        s
          .title(title('readable'))
          .collections('certificateRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const conditions = [condition('applicantId', '$eq', principal.id)];
            const requests = this.app.container.resolve(
              certificateRequestServiceToken,
            );
            for (const row of await this.app.container
              .resolve(databaseManagerToken)
              .repository<{ id: string }>('certificateRequests')
              .findMany()) {
              if (
                (
                  await requests.query(() =>
                    requests.approvals.involvementOf(
                      CERTIFICATE_KIND,
                      row.id,
                      principal.id,
                    ),
                  )
                ).length ||
                (
                  await requests.query(() =>
                    requests.approvals.actionsFor(CERTIFICATE_KIND, row.id, {
                      id: principal.id,
                    }),
                  )
                ).some((offer) => offer.actions.length)
              )
                conditions.push(condition('id', '$eq', row.id));
            }
            return anyScope(conditions);
          }),
      ),
    );
  }
  override async start() {
    const c = this.app.container,
      db = c.resolve(databaseManagerToken),
      audit = c.resolve(auditServiceToken);
    c.resolve(certificateRequestServiceToken);
    this.offUploads = db.connection().onRepositoryMutation(
      {
        id: 'oa/certificate-artifact-audit',
        collections: ['certificateFiles'],
      },
      {
        inTransaction: async (event, tx) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'certificateFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await tx
              .repository<{
                id: string;
                preparationId: string;
                ownerId: string;
              }>('certificateFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            if (!file) throw new Error('Certificate artifact metadata missing');
            const prep = await tx
              .repository<{
                id: string;
                requestId: string;
                preparedById: string;
              }>('certificatePreparations')
              .findOne({ filter: { id: file.preparationId } });
            const request =
              prep &&
              (await tx
                .repository<{
                  id: string;
                  status: string;
                  preparationId: string | null;
                }>('certificateRequests')
                .findOne({ filter: { id: prep.requestId } }));
            const directory = await c
              .resolve(approvalDirectoryServiceToken)
              .snapshot(tx);
            if (
              !prep ||
              prep.preparedById !== file.ownerId ||
              !request ||
              request.status !== 'issuing' ||
              request.preparationId !== prep.id ||
              !directory.isActive(file.ownerId) ||
              !directory.hasRole(file.ownerId, 'hr')
            )
              throw new Error(
                'Certificate artifact source is no longer eligible',
              );
            await audit.record(
              {
                actorId: file.ownerId,
                action: 'certificate.file.generated',
                targetType: 'certificateFiles',
                targetId: file.id,
                after: { preparationId: prep.id, requestId: prep.requestId },
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
