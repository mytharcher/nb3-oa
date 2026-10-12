import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610105002_create_transfer_requests',
  async up({ builder }) {
    await builder.createCollection('transferRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of [
        'applicantId',
        'employeeId',
        'targetDepartmentId',
        'targetPositionId',
        'targetGradeId',
        'privateSalaryRevisionId',
      ])
        c.string(field, { length: 64, nullable: false });
      c.string('targetManagerId', { length: 64 });
      c.string('sourceAccountId', { length: 64 });
      c.string('targetAccountId', { length: 64 });
      c.json('kinds', { nullable: false });
      c.date('effectiveDate', { nullable: false });
      c.text('reason', { nullable: false });
      c.json('snapshot');
      c.string('cancelConfirmerId', { length: 64 });
      c.text('cancellationReason');
      c.string('executionFailureCode', { length: 64 });
      c.string('status', { length: 32, nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['employeeId', 'status']);
      c.index(['applicantId', 'status']);
      c.index(['status', 'effectiveDate']);
    });
    await builder.createCollection('transferSalaryRevisions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestId', { length: 64, nullable: false });
      c.integer('version', { nullable: false });
      c.unique(['requestId', 'version']);
      c.bigInt('targetCents', { nullable: false });
      c.bigInt('currentCents');
      c.string('currentCompensationId', { length: 64 });
      c.string('gradeRevisionId', { length: 64 });
      c.integer('gradeTableVersion');
      c.json('band');
      c.string('createdById', { length: 64, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
    await builder.createCollection('transferCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestId', { length: 64, nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.string('action', { length: 64, nullable: false });
      c.string('fingerprint', { length: 64, nullable: false });
      c.json('result', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('transferCommands');
    await builder.dropCollection('transferSalaryRevisions');
    await builder.dropCollection('transferRequests');
  },
});
