// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610101201_create_annual_leave_accruals', {
  sources: [
    {
      packageName: 'annual-leave-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('annualLeaveAccruals').toExist();
    await expectCollection('annualLeaveAccruals').toHaveField('units', {
      nullable: false,
    });
    await expectCollection('annualLeaveAccruals').toHaveField('snapshot', {
      nullable: false,
    });
    await expectCollection('annualLeaveAccruals').toHaveField('expiresAt', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('annualLeaveAccruals').not.toExist();
  },
});
