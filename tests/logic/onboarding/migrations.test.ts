// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
const sources = [
  {
    packageName: 'onboarding-candidate',
    directory: path.resolve(
      import.meta.dirname,
      '../../fixtures/onboarding/migrations',
    ),
  },
];
describeMigration('202610104601_create_employee_onboarding_origins', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('employeeOnboardingOrigins').toHaveField(
      'fingerprint',
      { nullable: false },
    );
    await expectCollection('employeeOnboardingOrigins').not.toHaveField(
      'baseSalary',
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('employeeOnboardingOrigins').not.toExist();
  },
});
describeMigration('202610104602_create_onboarding_facts', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('onboardings').toHaveField('employeeId', {
      nullable: false,
    });
    await expectCollection('onboardingTasks').toHaveField('dueDate', {
      nullable: false,
    });
    await expectCollection('onboardingPrivateFacts').toHaveField('facts', {
      nullable: false,
    });
    await expectCollection('onboardings').not.toHaveField('baseSalary');
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'onboardings',
      'onboardingTasks',
      'onboardingPrivateFacts',
      'onboardingCommands',
    ])
      await expectCollection(name).not.toExist();
  },
});

describeMigration('202610104603_create_onboarding_reminders', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('onboardingReminders').toHaveField('recipientIds', {
      nullable: false,
    });
    await expectCollection('onboardingReminders').not.toHaveField('baseSalary');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('onboardingReminders').not.toExist();
  },
});
