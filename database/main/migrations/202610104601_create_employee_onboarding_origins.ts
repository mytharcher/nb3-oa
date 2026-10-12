import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104601_create_employee_onboarding_origins',
  async up({ builder }) {
    await builder.createCollection('employeeOnboardingOrigins', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('employeeId', { nullable: false });
      c.unique(['employeeId']);
      c.string('fingerprint', { length: 64, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('employeeOnboardingOrigins');
  },
});
