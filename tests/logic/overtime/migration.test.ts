// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
const names = [
  'overtimeRequests',
  'overtimeAttendance',
  'overtimeMinuteLots',
  'overtimeMinuteConversions',
];
describeMigration('202610101001_create_overtime', {
  sources: [
    {
      packageName: 'overtime-migration-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    for (const name of names) await expectCollection(name).toExist();
    await expectCollection('overtimeRequests').toHaveField('minutes', {
      nullable: false,
    });
    await expectCollection('overtimeMinuteLots').toHaveField(
      'remainingMinutes',
      { nullable: false },
    );
  },
  down: async ({ expectCollection }) => {
    for (const name of names) await expectCollection(name).not.toExist();
  },
});
