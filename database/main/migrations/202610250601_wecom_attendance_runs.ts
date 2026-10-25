import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610250601_wecom_attendance_runs',
  irreversible: true,
  async up({ builder }) {
    await builder.createCollection('wecomAttendanceRuns', (c) => {
      c.string('id', { primaryKey: true, length: 64 });
      c.string('actorId', { length: 64 });
      c.string('requestKey', { length: 128 });
      c.date('startDate');
      c.date('endDate');
      c.string('state', { length: 20 });
      c.string('errorCode', { length: 64, nullable: true });
      c.string('configurationHash', { length: 64 });
      c.text('reason');
      c.integer('committedRecords');
      c.integer('completedBatches');
      c.integer('attempts');
      c.json('completedKeys');
      c.string('leaseToken', { length: 64, nullable: true });
      c.datetimeTz('leaseUntil', { nullable: true });
      c.datetimeTz('createdAt');
      c.datetimeTz('updatedAt');
      c.unique(['actorId', 'requestKey']);
    });
  },
});
