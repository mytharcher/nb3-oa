import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610220001_task_center_integration',
  async up({ builder }) {
    await builder.createCollection('oaTaskCenterTargets', (c) => {
      c.increments('id');
      c.string('sourceType', { nullable: false, length: 128 });
      c.string('sourceKey', { nullable: false, length: 256 });
      c.string('subject', { nullable: false, length: 128 });
      c.string('recordId', { nullable: false, length: 128 });
      c.unique(['sourceType', 'sourceKey']);
    });
    await builder.createCollection('oaTaskCenterTimers', (c) => {
      c.string('id', { nullable: false, length: 128 });
      c.primary('id');
      c.datetime('dueAt', { nullable: false });
      c.index('dueAt');
    });
    await builder.createCollection('oaTaskCenterBackfills', (c) => {
      c.string('id', { nullable: false, length: 128 });
      c.primary('id');
      c.string('cursor', { nullable: true, length: 256 });
      c.boolean('done', { nullable: false, defaultValue: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('oaTaskCenterBackfills');
    await builder.dropCollection('oaTaskCenterTimers');
    await builder.dropCollection('oaTaskCenterTargets');
  },
});
