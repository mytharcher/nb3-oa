import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610120201_create_personal_schedules',
  async up({ builder }) {
    await builder.createCollection('personalSchedules', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('ownerUserId', { length: 64, nullable: false });
      c.string('title', { length: 200, nullable: false });
      c.text('description', { nullable: false });
      c.datetime('startAt', { nullable: false });
      c.datetime('endAt', { nullable: false });
      c.integer('version', { nullable: false });
      c.index(['ownerUserId', 'startAt']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('personalSchedules');
  },
});
