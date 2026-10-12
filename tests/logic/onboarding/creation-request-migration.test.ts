// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610104605_onboarding_creation_requests', {
  sources: [
    {
      packageName: 'main',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('onboardings').toHaveField('mentorName', {
      nullable: true,
    });
    await expectCollection('onboardings').toHaveField('mentorEmployeeId', {
      nullable: true,
    });
    await expectCollection('onboardings').toHaveField(
      'workstationRequirement',
      { nullable: true },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('onboardings').not.toHaveField('mentorName');
    await expectCollection('onboardings').not.toHaveField('mentorEmployeeId');
    await expectCollection('onboardings').not.toHaveField(
      'workstationRequirement',
    );
  },
});
