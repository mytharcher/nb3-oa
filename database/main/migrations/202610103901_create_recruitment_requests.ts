import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103901_create_recruitment_requests',
  async up({ builder }) {
    await builder.createCollection('recruitmentRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of [
        'applicantId',
        'departmentId',
        'positionId',
        'gradeId',
        'accountId',
        'privateSalaryRevisionId',
      ])
        c.string(field, { length: 64, nullable: false });
      c.integer('quantity', { nullable: false });
      c.integer('year', { nullable: false });
      c.string('kind', { length: 32, nullable: false });
      c.json('replacementEmployeeIds', { nullable: false });
      c.date('expectedStartDate', { nullable: false });
      c.text('jobDescription', { nullable: false });
      c.text('reason', { nullable: false });
      c.json('snapshot');
      c.string('status', { length: 32, nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['departmentId', 'status']);
      c.index(['applicantId', 'status']);
    });
    await builder.createCollection('recruitmentSalaryRevisions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestId', { length: 64, nullable: false });
      c.integer('version', { nullable: false });
      c.unique(['requestId', 'version']);
      c.bigInt('minimumCents', { nullable: false });
      c.bigInt('maximumCents', { nullable: false });
      c.string('gradeRevisionId', { length: 64 });
      c.integer('gradeTableVersion');
      c.json('band');
      c.datetimeTz('createdAt', { nullable: false });
      c.string('createdById', { length: 64, nullable: false });
    });
    await builder.createCollection('requisitions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestId', { length: 64, nullable: false });
      c.unique('requestId');
      for (const field of [
        'departmentId',
        'positionId',
        'gradeId',
        'accountId',
      ])
        c.string(field, { length: 64, nullable: false });
      c.integer('originalQuantity', { nullable: false });
      c.integer('remaining', { nullable: false });
      c.integer('consumed', { nullable: false });
      c.integer('sourceYear', { nullable: false });
      c.integer('sourceVersion', { nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.integer('version', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['departmentId', 'status']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('requisitions');
    await builder.dropCollection('recruitmentSalaryRevisions');
    await builder.dropCollection('recruitmentRequests');
  },
});
