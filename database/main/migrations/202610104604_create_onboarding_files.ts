import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104604_create_onboarding_files',
  async up({ builder }) {
    await builder.createCollection('onboardingFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('onboardingId').notNull();
      c.string('taskId').notNull();
      c.string('ownerId').notNull();
      c.integer('uploadVersion').notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('onboardingFiles');
  },
});
