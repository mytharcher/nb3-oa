import { travelServiceToken } from './contract.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';

import { orgServiceToken } from '../org/contract.js';
import { auditServiceToken } from '../audit/index.js';
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
import { loggingToken } from '@nocobase/app-server/logging';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { createLifecycleJobs } from '@nocobase/lifecycle/jobs';
import type { LifecycleJobs } from '@nocobase/lifecycle/jobs';
import { approvalNotificationServiceToken } from '../approval-notifications/contract.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { employeeServiceToken } from '../employees/contract.js';
import {
  calendarServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import {
  createTravelCancellationService,
  travelCancellationServiceToken,
  type TravelCancellationService,
} from './cancellation-service.js';
export * from './cancellation-service.js';
const read = defineDatabasePermission((p) =>
  p.collection('travelCancellations').read('*'),
);
export const travelCancellationResource = defineCompositeResource(
  'oa.travelCancellation',
  (r) =>
    r
      .title({ key: 'travelCancellations.authz.resource', ns: 'nb3-oa' })
      .action('submit', (a) =>
        a
          .title({ key: 'travelCancellations.authz.submit', ns: 'nb3-oa' })
          .grant('travelCancellations', read.create('*').update('*')),
      )
      .action('delegate', (a) =>
        a
          .title({ key: 'travelCancellations.authz.delegate', ns: 'nb3-oa' })
          .grant('travelCancellations', read.create('*').update('*')),
      )
      .action('view', (a) =>
        a
          .title({ key: 'travelCancellations.authz.view', ns: 'nb3-oa' })
          .grant('travelCancellations', read),
      ),
);
export default class TravelCancellationProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/travelCancellation-provider';
  private jobs?: LifecycleJobs;
  public override register(): void {
    const c = this.app.container;
    c.singleton(travelCancellationServiceToken, () => {
      const service: TravelCancellationService =
        createTravelCancellationService({
          db: c.resolve(databaseManagerToken),
          travel: () => c.resolve(travelServiceToken),
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
        jobs: executors.getJobExecutor('oa-travelCancellation'),
        schedule: executors.getScheduleExecutor('oa-travelCancellation'),
        jobName: 'oa-travelCancellation-effect',
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
      name: 'travelCancellations',
      title: { key: 'travelCancellations.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.travelCancellationReadable', (a) =>
        a
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('travelCancellations')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const ids = await this.app.container
              .resolve(travelCancellationServiceToken)
              .readableIds(principal.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('id', '$eq', id)))
              : false;
          }),
      ),
    );
    authz.compositeResources.define(travelCancellationResource);
    authz.ui.place(
      { type: 'composite', id: 'oa.travelCancellation' },
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
    if (!(await db.connection().collections.get('travelCancellations'))) {
      this.app.container
        .resolve(loggingToken)
        .getLogger('oa-travelCancellation')
        .warn(
          'TravelCancellation tables are not installed; approval maintenance is deferred.',
        );
      return;
    }
    const service = this.app.container.resolve(travelCancellationServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown(): Promise<void> {
    await this.jobs?.shutdown();
  }
}
