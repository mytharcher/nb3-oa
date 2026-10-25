import { registerAttendanceSchedule } from './schedule.js';
import { registerAttendanceResultPermissions } from './result-permissions.js';
import {
  attendanceActivitySourcesToken,
  createAttendanceActivitySources,
} from './activity-sources.js';
import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { employeeServiceToken } from '../employees/contract.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../audit/index.js';
import { calendarServiceToken } from '../platform/index.js';
import { orgServiceToken } from '../org/contract.js';
import { attendanceEvaluationServiceToken } from './evaluation-contract.js';
import { createAttendanceEvaluationService } from './evaluation.js';
export * from './evaluation-contract.js';
import { attendanceServiceToken } from './contract.js';
import { createAttendanceService } from './service.js';
export * from './contract.js';
export * from './service.js';
export default class AttendanceProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/attendance-provider';
  public override register(): void {
    const c = this.app.container;
    c.singleton(
      attendanceActivitySourcesToken,
      createAttendanceActivitySources,
    );
    c.singleton(attendanceEvaluationServiceToken, () =>
      createAttendanceEvaluationService({
        sources: c.resolve(attendanceActivitySourcesToken),
        attendance: c.resolve(attendanceServiceToken),
        db: c.resolve(databaseManagerToken),
        users: c.resolve(userAdministrationServiceToken),
        employees: c.resolve(employeeServiceToken),
        org: c.resolve(orgServiceToken),
        calendar: c.resolve(calendarServiceToken),
        audit: c.resolve(auditServiceToken),
      }),
    );
    c.singleton(attendanceServiceToken, () =>
      createAttendanceService({
        db: c.resolve(databaseManagerToken),
        users: c.resolve(userAdministrationServiceToken),
        employees: c.resolve(employeeServiceToken),
        audit: c.resolve(auditServiceToken),
        calendar: c.resolve(calendarServiceToken),
      }),
    );
  }
  public override async boot(): Promise<void> {
    registerAttendanceResultPermissions(this.app);
    await registerAttendanceSchedule(this.app);
    const authz = this.app.container.resolve(authorizationToken);
    const title = (key: string) => ({
      key: `attendanceManagement.authz.${key}`,
      ns: 'nb3-oa',
    });
    authz.database.collections.add({
      name: 'attendanceRecords',
      title: title('attendanceRecords'),
    });
    const fields = [
      'id',
      'userId',
      'date',
      'punchKind',
      'punchedAt',
      'status',
      'version',
      'source',
      'sourceKey',
      'sourceData',
      'correctedByRequestId',
      'createdAt',
      'updatedAt',
    ];
    authz.compositeResources.define(
      defineCompositeResource('oa.attendanceImport', (r) =>
        r.title(title('importResource')).action('ingest', (a) =>
          a.title(title('ingest')).grant(
            'attendanceRecords',
            defineDatabasePermission((p) =>
              p
                .collection('attendanceRecords')
                .read((read) => read.fields(...fields))
                .create((create) => create.fields(...fields)),
            ),
          ),
        ),
      ),
    );
    authz.ui.place(
      { type: 'composite', id: 'oa.attendanceImport' },
      { section: 'oa.attendanceManagement' },
    );
  }
}
