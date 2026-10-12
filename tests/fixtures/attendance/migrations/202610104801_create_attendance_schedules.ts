import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610104801_create_attendance_schedules',
  async up({ builder }) {
    await builder.createCollection('attendanceShifts', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('code', { length: 64 }).notNull().unique();
      c.string('name', { length: 200 }).notNull();
      c.boolean('enabled').notNull();
      c.integer('currentRevision').notNull();
      c.integer('version').notNull();
    });
    await builder.createCollection('attendanceShiftRevisions', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('shiftId', { length: 64 }).notNull();
      c.integer('revision').notNull();
      c.string('name', { length: 200 }).notNull();
      c.string('timeZone', { length: 100 }).notNull();
      c.json('intervals').notNull();
      c.integer('lateToleranceMinutes').notNull();
      c.integer('earlyToleranceMinutes').notNull();
      c.integer('absenceThresholdMinutes').notNull();
      c.string('actorId', { length: 64 }).notNull();
      c.datetime('createdAt').notNull();
      c.unique(['shiftId', 'revision']);
    });
    await builder.createCollection('attendanceSchedules', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('departmentId', { length: 64 }).notNull();
      c.date('date').notNull();
      c.string('currentRevisionId', { length: 64 }).notNull();
      c.integer('version').notNull();
      c.unique(['departmentId', 'date']);
    });
    await builder.createCollection('attendanceScheduleRevisions', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('scheduleId', { length: 64 }).notNull();
      c.integer('revision').notNull();
      c.string('shiftRevisionId', { length: 64 });
      c.boolean('restDay').notNull();
      c.string('actorId', { length: 64 }).notNull();
      c.text('reason').notNull();
      c.datetime('createdAt').notNull();
      c.unique(['scheduleId', 'revision']);
    });
  },
  async down({ builder }) {
    for (const collection of [
      'attendanceScheduleRevisions',
      'attendanceSchedules',
      'attendanceShiftRevisions',
      'attendanceShifts',
    ])
      await builder.dropCollection(collection);
  },
});
