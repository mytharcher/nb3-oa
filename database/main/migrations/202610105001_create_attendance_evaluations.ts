import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610105001_create_attendance_evaluations',
  async up({ builder }) {
    await builder.createCollection('attendanceEvaluations', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('userId', { length: 64 }).notNull();
      c.date('date').notNull();
      c.string('currentRevisionId', { length: 64 }).notNull();
      c.integer('version').notNull();
      c.unique(['userId', 'date']);
    });
    await builder.createCollection('attendanceEvaluationRevisions', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('evaluationId', { length: 64 }).notNull();
      c.integer('revision').notNull();
      c.string('requestKey', { length: 128 }).notNull();
      c.string('actorId', { length: 64 }).notNull();
      c.text('reason').notNull();
      c.datetime('createdAt').notNull();
      c.json('snapshot').notNull();
      c.json('result').notNull();
      c.unique(['evaluationId', 'revision']);
      c.unique(['evaluationId', 'requestKey']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('attendanceEvaluationRevisions');
    await builder.dropCollection('attendanceEvaluations');
  },
});
