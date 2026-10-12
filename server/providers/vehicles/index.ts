import {
  ServiceProvider,
  createServiceToken,
} from '@nocobase/service-provider';
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
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { approvalNotificationServiceToken } from '../approval-notifications/contract.js';
import { employeeServiceToken } from '../employees/contract.js';
import { auditServiceToken } from '../audit/index.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import {
  createVehicleRequestService,
  type VehicleRequestService,
} from './requests.js';
import { vehicleServiceToken } from './contract.js';
import { departureCustodyClearanceToken } from '../departure/contract.js';
export * from './contract.js';
export * from './requests.js';
export const vehicleRequestServiceToken =
  createServiceToken<VehicleRequestService>('oa/vehicle-request-service');
const read = defineDatabasePermission((p) =>
  p.collection('vehicleRequests').read('*'),
);
export const vehicleRequestResource = defineCompositeResource(
  'oa.vehicleRequests',
  (r) =>
    r
      .title({ key: 'vehicles.authz.requests', ns: 'nb3-oa' })
      .action('view', (a) =>
        a
          .title({ key: 'approvals.authz.view', ns: 'nb3-oa' })
          .grant('vehicleRequests', read),
      )
      .action('submit', (a) =>
        a
          .title({ key: 'approvals.authz.submit', ns: 'nb3-oa' })
          .grant('vehicleRequests', read.create('*').update('*')),
      )
      .action('operate', (a) =>
        a
          .title({ key: 'approvals.authz.view', ns: 'nb3-oa' })
          .grant('vehicleRequests', read),
      )
      .action('viewCost', (a) =>
        a.title({ key: 'vehicles.authz.viewCost', ns: 'nb3-oa' }).grant(
          'vehicleUsageCosts',
          defineDatabasePermission((p) =>
            p.collection('vehicleUsageCosts').read('*'),
          ),
        ),
      ),
);
export const vehicleGarageResource = defineCompositeResource(
  'oa.vehicleGarage',
  (r) =>
    r
      .title({ key: 'vehicles.authz.garage', ns: 'nb3-oa' })
      .action('view', (a) =>
        a
          .title({ key: 'approvals.authz.view', ns: 'nb3-oa' })
          .grant(
            'vehicles',
            defineDatabasePermission((p) => p.collection('vehicles').read('*')),
          )
          .grant(
            'vehicleDrivers',
            defineDatabasePermission((p) =>
              p.collection('vehicleDrivers').read('*'),
            ),
          ),
      )
      .action('manage', (a) =>
        a
          .title({ key: 'vehicles.authz.manage', ns: 'nb3-oa' })
          .grant(
            'vehicles',
            defineDatabasePermission((p) =>
              p.collection('vehicles').read('*').create('*').update('*'),
            ),
          )
          .grant(
            'vehicleDrivers',
            defineDatabasePermission((p) =>
              p.collection('vehicleDrivers').read('*').create('*').update('*'),
            ),
          ),
      ),
);
export default class VehiclesProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/vehicles-provider';
  private jobs?: LifecycleJobs;
  public override register() {
    const c = this.app.container;
    c.singleton(vehicleRequestServiceToken, () => {
      const service = createVehicleRequestService({
        db: c.resolve(databaseManagerToken),
        users: c.resolve(userAdministrationServiceToken),
        employees: c.resolve(employeeServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        calendar: c.resolve(calendarServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        rules: c.resolve(ruleServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        audit: c.resolve(auditServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
      });
      const jobs = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: jobs.getJobExecutor('oa-vehicles'),
        schedule: jobs.getScheduleExecutor('oa-vehicles'),
        jobName: 'oa-vehicles-effect',
        sweepEveryMs: 10 * 60_000,
        onSweep: async () => {
          await service.maintenance();
          await service.runtime.prune({
            olderThan: new Date(Date.now() - 30 * 24 * 60 * 60_000),
          });
        },
      });
      return service;
    });
    c.singleton(
      vehicleServiceToken,
      () => c.resolve(vehicleRequestServiceToken).vehicles,
    );
  }
  public override async boot() {
    const c = this.app.container,
      authz = c.resolve(authorizationToken);
    c.resolve(departureCustodyClearanceToken).register(
      'vehicles',
      (employeeId, tx) =>
        c.resolve(vehicleServiceToken).assertDepartureCleared(employeeId, tx),
    );
    for (const name of [
      'vehicleRequests',
      'vehicles',
      'vehicleDrivers',
      'vehicleUsageCosts',
    ])
      authz.database.collections.add({
        name,
        title: { key: 'vehicles.authz.requests', ns: 'nb3-oa' },
      });
    authz.recordAccess.define(
      defineRecordAccess('oa.vehicleRequestsOwned', (s) =>
        s
          .title({ key: 'approvals.authz.ownScope', ns: 'nb3-oa' })
          .collections('vehicleRequests')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('applicantId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.vehicleRequestsReadable', (s) =>
        s
          .title({ key: 'approvals.authz.ownScope', ns: 'nb3-oa' })
          .collections('vehicleRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const service = c.resolve(vehicleRequestServiceToken),
              db = c.resolve(databaseManagerToken),
              ids: string[] = [];
            for (const r of await db
              .repository<{ id: string; applicantId: string }>(
                'vehicleRequests',
              )
              .findMany())
              if (
                r.applicantId === principal.id ||
                (await service.involvementForScope(r.id, principal.id)).length
              )
                ids.push(r.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('id', '$eq', id)))
              : false;
          }),
      ),
    );
    authz.compositeResources.define(vehicleRequestResource);
    authz.compositeResources.define(vehicleGarageResource);
  }
  public override async start() {
    const service = this.app.container.resolve(vehicleRequestServiceToken);
    await service.initialize();
    await this.jobs?.start(service.runtime);
  }
  public override async shutdown() {
    await this.jobs?.shutdown();
  }
}
