// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610104801_create_attendance_schedules', {
  sources: [
    {
      packageName: 'attendance-candidate',
      directory: path.resolve(
        import.meta.dirname,
        '../../fixtures/attendance/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('attendanceShifts').toHaveField('currentRevision', {
      nullable: false,
    });
    await expectCollection('attendanceShiftRevisions').toHaveField(
      'intervals',
      { nullable: false },
    );
    await expectCollection('attendanceShiftRevisions').toHaveField('timeZone', {
      nullable: false,
    });
    await expectCollection('attendanceSchedules').toHaveField(
      'currentRevisionId',
      { nullable: false },
    );
    await expectCollection('attendanceScheduleRevisions').toHaveField(
      'shiftRevisionId',
      { nullable: true },
    );
    await expectCollection('attendanceScheduleRevisions').toHaveField(
      'restDay',
      { nullable: false },
    );
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'attendanceScheduleRevisions',
      'attendanceSchedules',
      'attendanceShiftRevisions',
      'attendanceShifts',
    ])
      await expectCollection(name).not.toExist();
  },
});
