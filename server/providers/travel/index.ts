import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { attendanceServiceToken } from '../attendance/contract.js';
import { expenseAuthorizationServiceToken } from '../expense-authorizations/contract.js';
import { loanRequestServiceToken } from '../loan-requests/contract.js';
import { dictionaryServiceToken } from '../platform/index.js';

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
  createTravelAttachmentService,
  TravelAttachmentError,
  travelAttachmentServiceToken,
} from './attachments.js';
import type { TravelRecord } from './contract.js';
import {
  createTravelService,
  travelServiceToken,
  type TravelService,
} from './service.js';
export * from './attachments.js';
export * from './service.js';
const read = defineDatabasePermission((p) =>
  p.collection('travelRequests').read('*'),
);
export const travelResource = defineCompositeResource('oa.travel', (r) =>
  r
    .title({ key: 'travel.authz.resource', ns: 'nb3-oa' })
    .action('submit', (a) =>
      a
        .title({ key: 'travel.authz.submit', ns: 'nb3-oa' })
        .grant('travelRequests', read.create('*').update('*')),
    )
    .action('delegate', (a) =>
      a
        .title({ key: 'travel.authz.delegate', ns: 'nb3-oa' })
        .grant('travelRequests', read.create('*').update('*')),
    )
    .action('view', (a) =>
      a
        .title({ key: 'travel.authz.view', ns: 'nb3-oa' })
        .grant('travelRequests', read),
    ),
);
export default class TravelProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/travel-provider';
  private jobs?: LifecycleJobs;
  private unsubscribe?: () => void;
  public override register(): void {
    const c = this.app.container;
    c.singleton(travelAttachmentServiceToken, () =>
      createTravelAttachmentService(c.resolve(databaseManagerToken), {
        detail: (...args) => c.resolve(travelServiceToken).detail(...args),
      }),
    );
    c.singleton(travelServiceToken, () => {
      const service: TravelService = createTravelService({
        db: c.resolve(databaseManagerToken),
        attendance: c.resolve(attendanceServiceToken),
        authorizations: c.resolve(expenseAuthorizationServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        loans: () => c.resolve(loanRequestServiceToken),
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
        jobs: executors.getJobExecutor('oa-travel'),
        schedule: executors.getScheduleExecutor('oa-travel'),
        jobName: 'oa-travel-effect',
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
      name: 'travelRequests',
      title: { key: 'travel.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.travelReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('travelRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            return await this.app.container
              .resolve(travelServiceToken)
              .readableScope(principal.id);
          }),
      ),
    );
    authz.compositeResources.define(travelResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.travel' },
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
    if (!(await db.connection().collections.get('travelRequests'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-travel')
        .warn(
          'Travel tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(travelServiceToken);
    this.unsubscribe = db.connection().onRepositoryMutation(
      { id: 'oa/travel-upload', collections: ['travelAttachmentFiles'] },
      {
        inTransaction: async (event, connection) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'travelAttachmentFiles' ||
              change.kind !== 'created'
            )
              continue;
            const file = await connection
              .repository<{
                id: string;
                travelId: string;
                ownerId: string;
                uploadVersion: number;
              }>('travelAttachmentFiles')
              .findOne({ filter: { id: String(change.key.id) } });
            const before = file
              ? await connection
                  .repository<TravelRecord>('travelRequests')
                  .findOne({ filter: { id: file.travelId } })
              : undefined;
            if (!file || !before)
              throw new TravelAttachmentError(
                'TRAVEL_ATTACHMENT_DENIED',
                'The owning draft no longer exists.',
              );
            await lockUserForAdministration(connection, before.applicantId);
            const row = await connection
              .repository<TravelRecord>('travelRequests')
              .findOne({ filter: { id: file.travelId } });
            if (
              !row ||
              !['draft', 'revision'].includes(row.status) ||
              row.lifecycleVersion !== file.uploadVersion ||
              ![row.applicantId, row.createdById].includes(file.ownerId)
            )
              throw new TravelAttachmentError(
                'TRAVEL_ATTACHMENT_DENIED',
                'The draft changed during upload.',
              );
            await this.app.container.resolve(auditServiceToken).record(
              {
                actorId: file.ownerId,
                action: 'travelAttachment.upload',
                targetType: 'travelRequests',
                targetId: file.travelId,
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
