import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610101001_create_overtime',
  async up({ builder }) {
    await builder.createCollection('overtimeRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.date('date', { nullable: false });
      c.integer('minutes', { nullable: false });
      c.integer('monthlyMinutes', { nullable: false, defaultValue: 0 });
      c.string('settlement', { length: 32, nullable: false });
      c.text('reason', { nullable: false });
      c.json('ruleSnapshot', { nullable: true });
      c.json('hrRecipients', { nullable: false });
      c.string('managerApproverId', { length: 64, nullable: true });
      c.boolean('requiresHr', { nullable: false, defaultValue: false });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'date', 'status']);
    });
    await builder.createCollection('overtimeAttendance', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('applicationId', { length: 64, nullable: false });
      c.unique('applicationId');
      c.string('userId', { length: 64, nullable: false });
      c.date('date', { nullable: false });
      c.integer('minutes', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
    await builder.createCollection('overtimeMinuteLots', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('employeeId', { length: 64, nullable: false });
      c.string('applicationId', { length: 64, nullable: false });
      c.unique('applicationId');
      c.integer('originalMinutes', { nullable: false });
      c.integer('remainingMinutes', { nullable: false });
      c.integer('expiredMinutes', { nullable: false, defaultValue: 0 });
      c.datetimeTz('expiresAt', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['employeeId', 'expiresAt']);
    });
    await builder.createCollection('overtimeMinuteConversions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('applicationId', { length: 64, nullable: false });
      c.string('reference', { length: 255, nullable: false });
      c.unique('reference');
      c.json('sources', { nullable: false });
      c.datetimeTz('expiresAt', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    for (const name of [
      'overtimeMinuteConversions',
      'overtimeMinuteLots',
      'overtimeAttendance',
      'overtimeRequests',
    ])
      await builder.dropCollection(name);
  },
});
export default migration;
