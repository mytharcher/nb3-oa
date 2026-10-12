import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610101201_create_annual_leave_accruals',
  async up({ builder }) {
    await builder.createCollection('annualLeaveAccruals', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('employeeId', { length: 64, nullable: false });
      c.integer('year', { nullable: false });
      c.integer('units', { nullable: false });
      c.json('snapshot', { nullable: false });
      c.datetimeTz('expiresAt', { nullable: false });
      c.datetimeTz('grantedAt', { nullable: false });
      c.unique(['employeeId', 'year']);
      c.index('year');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('annualLeaveAccruals');
  },
});
