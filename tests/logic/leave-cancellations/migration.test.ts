// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610101301_create_leave_cancellations', {
  sources: [
    {
      packageName: 'cancellation-migration-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('leaveCancellations').toExist();
    await expectCollection('leaveCancellations').toHaveField(
      'originalLeaveId',
      { nullable: false },
    );
    await expectCollection('leaveCancellations').toHaveField('baseline', {
      nullable: true,
    });
    await expectCollection('leaveAttendance').toHaveField('active', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('leaveCancellations').not.toExist();
  },
});
