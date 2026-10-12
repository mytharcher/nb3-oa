import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610101501_create_outings',
  async up({ builder }) {
    await builder.createCollection('outingRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.datetimeTz('startAt', { nullable: false });
      c.datetimeTz('endAt', { nullable: false });
      c.text('location', { nullable: false });
      c.text('reason', { nullable: false });
      c.json('ruleSnapshot', { nullable: true });
      c.json('hrRecipients', { nullable: false });
      c.string('managerApproverId', { length: 64, nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'startAt', 'status']);
    });
    await builder.createCollection('attendanceActivities', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('applicationId', { length: 64, nullable: false });
      c.string('kind', { length: 64, nullable: false });
      c.unique(['kind', 'applicationId']);
      c.string('userId', { length: 64, nullable: false });
      c.datetimeTz('startAt', { nullable: false });
      c.datetimeTz('endAt', { nullable: false });
      c.datetimeTz('actualEndAt', { nullable: true });
      c.boolean('active', { nullable: false, defaultValue: true });
      c.string('status', { length: 32, nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['userId', 'startAt', 'endAt']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('attendanceActivities');
    await builder.dropCollection('outingRequests');
  },
});
export default migration;
