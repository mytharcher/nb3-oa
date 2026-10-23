import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';

import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
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
  createGeneralAttachmentService,
  GeneralAttachmentError,
  generalAttachmentServiceToken,
} from './attachments.js';
import type { GeneralRequestRecord } from './service.js';
import {
  createGeneralRequestService,
  generalServiceToken,
  type GeneralRequestService,
} from './service.js';
export * from './attachments.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('generalRequests').read('*'),
);
export const generalResource = defineCompositeResource('oa.general', (r) =>
  r
    .title({ key: 'general.authz.resource', ns: 'nb3-oa' })
    .action('submit', (a) =>
      a
        .title({ key: 'general.authz.submit', ns: 'nb3-oa' })
        .grant('generalRequests', read.create('*').update('*')),
    )
    .action('delegate', (a) =>
      a
        .title({ key: 'general.authz.delegate', ns: 'nb3-oa' })
        .grant('generalRequests', read.create('*').update('*')),
    )
    .action('view', (a) =>
      a
        .title({ key: 'general.authz.view', ns: 'nb3-oa' })
        .grant('generalRequests', read),
    ),
);
export default class GeneralRequestProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/general-provider';
  private jobs?: LifecycleJobs;
  private unsubscribe?: () => void;
  public override register(): void {
    const c = this.app.container;
    c.singleton(generalAttachmentServiceToken, () =>
      createGeneralAttachmentService(c.resolve(databaseManagerToken), {
        detail: (...args) => c.resolve(generalServiceToken).detail(...args),
      }),
    );
    c.singleton(generalServiceToken, () => {
      const service: GeneralRequestService = createGeneralRequestService({
        db: c.resolve(databaseManagerToken),
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
        jobs: executors.getJobExecutor('oa-general'),
        schedule: executors.getScheduleExecutor('oa-general'),
        jobName: 'oa-general-effect',
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
      name: 'generalRequests',
      title: { key: 'general.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.generalReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('generalRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await this.app.container
              .resolve(generalServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.compositeResources.define(generalResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.general' },
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
    if (!(await db.connection().collections.get('generalRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-general')
        .warn(
          'GeneralRequest tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(generalServiceToken);
    this.unsubscribe = db.connection().onRepositoryMutation(
      { id: 'oa/general-upload', collections: ['generalAttachmentFiles'] },
      {
        inTransaction: async (event, connection) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'generalAttachmentFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await connection
              .repository<{
                id: string;
                generalId: string;
                ownerId: string;
                uploadVersion: number;
              }>('generalAttachmentFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            const before = file
              ? await connection
                  .repository<GeneralRequestRecord>('generalRequests')
                  .findOne({ filter: { id: file.generalId } })
              : undefined;
            if (!file || !before)
              throw new GeneralAttachmentError(
                'GENERAL_ATTACHMENT_DENIED',
                'The owning draft no longer exists.',
              );
            await lockUserForAdministration(connection, before.applicantId);
            const row = await connection
              .repository<GeneralRequestRecord>('generalRequests')
              .findOne({ filter: { id: file.generalId } });
            if (
              !row ||
              !['draft', 'revision'].includes(row.status) ||
              row.lifecycleVersion !== file.uploadVersion ||
              ![row.applicantId, row.createdById].includes(file.ownerId)
            )
              throw new GeneralAttachmentError(
                'GENERAL_ATTACHMENT_DENIED',
                'The draft changed during upload.',
              );
            await this.app.container.resolve(auditServiceToken).record(
              {
                actorId: file.ownerId,
                action: 'generalAttachment.upload',
                targetType: 'generalRequests',
                targetId: file.generalId,
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
