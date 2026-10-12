import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610101402_create_attendance_change_attachments',
  async up({ builder }) {
    await builder.addField('attendanceChangeRequests', {
      name: 'attachments',
      type: 'json',
      nullable: false,
      defaultValue: '[]',
    });
    await builder.createCollection('attendanceChangeAttachmentFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('attendanceChangeId', { length: 64 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.integer('uploadVersion').notNull();
      c.index('attendanceChangeId');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('attendanceChangeAttachmentFiles');
    await builder.dropField('attendanceChangeRequests', 'attachments');
  },
});
export default migration;
