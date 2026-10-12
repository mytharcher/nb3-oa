import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { orgServiceToken } from '../org/contract.js';
import {
  organizationServiceToken,
  registerDepartmentScopes,
} from '../org/index.js';
import { auditServiceToken } from '../audit/index.js';
import { calendarServiceToken } from '../platform/index.js';
import { attendanceManagementServiceToken } from './contract.js';
import { createAttendanceManagementService } from './service.js';
export * from './contract.js';
/** Candidate provider: permission actions and HTTP must be composed before main registration. */
export default class AttendanceManagementProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/attendance-management-provider';
  public override register(): void {
    const c = this.app.container;
    c.singleton(attendanceManagementServiceToken, () =>
      createAttendanceManagementService({
        org: c.resolve(orgServiceToken),
        audit: c.resolve(auditServiceToken),
        calendar: c.resolve(calendarServiceToken),
      }),
    );
  }
  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    const fields = {
      attendanceShifts: [
        'id',
        'code',
        'name',
        'enabled',
        'currentRevision',
        'version',
      ],
      attendanceShiftRevisions: [
        'id',
        'shiftId',
        'revision',
        'name',
        'timeZone',
        'intervals',
        'lateToleranceMinutes',
        'earlyToleranceMinutes',
        'absenceThresholdMinutes',
        'actorId',
        'createdAt',
      ],
      attendanceSchedules: [
        'id',
        'departmentId',
        'date',
        'currentRevisionId',
        'version',
      ],
      attendanceScheduleRevisions: [
        'id',
        'scheduleId',
        'revision',
        'shiftRevisionId',
        'restDay',
        'actorId',
        'reason',
        'createdAt',
      ],
    };
    const title = (key: string) => ({
      key: `attendanceManagement.authz.${key}`,
      ns: 'nb3-oa',
    });
    for (const name of Object.keys(fields))
      authz.database.collections.add({ name, title: title(name) });
    authz.compositeResources.define(
      defineCompositeResource('oa.attendanceManagement', (r) =>
        r
          .title(title('resource'))
          .action('view', (a) =>
            a
              .title(title('view'))
              .grant(
                'attendanceShifts',
                defineDatabasePermission((p) =>
                  p
                    .collection('attendanceShifts')
                    .read((read) => read.fields(...fields.attendanceShifts)),
                ),
              )
              .grant(
                'attendanceShiftRevisions',
                defineDatabasePermission((p) =>
                  p
                    .collection('attendanceShiftRevisions')
                    .read((read) =>
                      read.fields(...fields.attendanceShiftRevisions),
                    ),
                ),
              )
              .grant(
                'attendanceSchedules',
                defineDatabasePermission((p) =>
                  p
                    .collection('attendanceSchedules')
                    .read((read) => read.fields(...fields.attendanceSchedules)),
                ),
              )
              .grant(
                'attendanceScheduleRevisions',
                defineDatabasePermission((p) =>
                  p
                    .collection('attendanceScheduleRevisions')
                    .read((read) =>
                      read.fields(...fields.attendanceScheduleRevisions),
                    ),
                ),
              ),
          )
          .action('manage', (a) =>
            a
              .title(title('manage'))
              .grant(
                'attendanceShifts',
                defineDatabasePermission((p) =>
                  p
                    .collection('attendanceShifts')
                    .read((read) => read.fields(...fields.attendanceShifts))
                    .create((create) =>
                      create.fields(...fields.attendanceShifts),
                    )
                    .update((update) =>
                      update.fields(
                        'name',
                        'enabled',
                        'currentRevision',
                        'version',
                      ),
                    ),
                ),
              )
              .grant(
                'attendanceShiftRevisions',
                defineDatabasePermission((p) =>
                  p
                    .collection('attendanceShiftRevisions')
                    .read((read) =>
                      read.fields(...fields.attendanceShiftRevisions),
                    )
                    .create((create) =>
                      create.fields(...fields.attendanceShiftRevisions),
                    ),
                ),
              )
              .grant(
                'attendanceSchedules',
                defineDatabasePermission((p) =>
                  p
                    .collection('attendanceSchedules')
                    .read((read) => read.fields(...fields.attendanceSchedules))
                    .create((create) =>
                      create.fields(...fields.attendanceSchedules),
                    )
                    .update((update) =>
                      update.fields('currentRevisionId', 'version'),
                    ),
                ),
              )
              .grant(
                'attendanceScheduleRevisions',
                defineDatabasePermission((p) =>
                  p
                    .collection('attendanceScheduleRevisions')
                    .read((read) =>
                      read.fields(...fields.attendanceScheduleRevisions),
                    )
                    .create((create) =>
                      create.fields(...fields.attendanceScheduleRevisions),
                    ),
                ),
              ),
          ),
      ),
    );
    registerDepartmentScopes(
      authz,
      this.app.container.resolve(organizationServiceToken),
      {
        prefix: 'oa.attendanceManagement',
        targets: [
          {
            collection: 'attendanceSchedules',
            departmentField: 'departmentId',
          },
        ],
      },
    );
    authz.ui.sections.add({
      name: 'oa.attendanceManagement',
      parent: 'administration',
      order: 48,
      title: title('resource'),
    });
    authz.ui.place(
      { type: 'composite', id: 'oa.attendanceManagement' },
      { section: 'oa.attendanceManagement' },
    );
  }
}
