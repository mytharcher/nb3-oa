import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610100901_create_leave_attachments',
  async up({ builder }) {
    await builder.createCollection('leaveAttachmentFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('leaveId', { length: 64 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.integer('uploadVersion').notNull();
      c.index('leaveId');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('leaveAttachmentFiles');
  },
});
export default migration;
