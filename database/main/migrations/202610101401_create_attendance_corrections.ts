import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610101401_create_attendance_corrections',
  async up({ builder }) {
    await builder.createCollection('attendanceRecords', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('userId', { length: 64, nullable: false });
      c.date('date', { nullable: false });
      c.string('punchKind', { length: 16, nullable: false });
      c.datetimeTz('punchedAt', { nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.integer('version', { nullable: false, defaultValue: 0 });
      c.string('source', { length: 64, nullable: false });
      c.string('sourceKey', { length: 255, nullable: false });
      c.unique(['source', 'sourceKey']);
      c.json('sourceData', { nullable: false });
      c.string('correctedByRequestId', { length: 64, nullable: true });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['userId', 'date']);
    });
    await builder.createCollection('attendanceCorrections', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('applicationId', { length: 64, nullable: false });
      c.unique('applicationId');
      c.string('originalId', { length: 64, nullable: false });
      c.unique('originalId');
      c.integer('originalVersion', { nullable: false });
      c.datetimeTz('punchedAt', { nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
    });
    await builder.createCollection('attendanceChangeRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const key of ['applicantId', 'createdById', 'originalAttendanceId'])
        c.string(key, { length: 64, nullable: false });
      c.integer('originalVersion', { nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.date('date', { nullable: false });
      c.datetimeTz('correctionAt', { nullable: false });
      c.text('reason', { nullable: false });
      c.text('proof', { nullable: false });
      c.json('ruleSnapshot', { nullable: true });
      c.json('hrRecipients', { nullable: false });
      c.string('managerApproverId', { length: 64, nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'date', 'status']);
      c.index(['originalAttendanceId', 'status']);
    });
  },
  async down({ builder }) {
    for (const name of [
      'attendanceChangeRequests',
      'attendanceCorrections',
      'attendanceRecords',
    ])
      await builder.dropCollection(name);
  },
});
export default migration;
