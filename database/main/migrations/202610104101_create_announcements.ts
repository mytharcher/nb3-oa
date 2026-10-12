import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104101_create_announcements',
  async up({ builder }) {
    await builder.createCollection('announcements', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('publisherUserId', { length: 64 }).notNull();
      c.string('title', { length: 200 }).notNull();
      c.text('body').notNull();
      c.string('status', { length: 32 }).notNull();
      c.json('audience').notNull();
      c.json('attachments').notNull();
      c.json('knowledgeLink');
      c.boolean('requiresConfirmation').notNull();
      c.boolean('pinned').notNull();
      c.datetime('validFrom').notNull();
      c.datetime('validUntil').notNull();
      c.datetime('publishedAt');
      c.datetime('statusChangedAt').notNull();
      c.integer('version').notNull();
      c.index('publisherUserId');
      c.index(['status', 'validUntil']);
    });
    await builder.createCollection('announcementReceipts', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('announcementId', { length: 64 }).notNull();
      c.string('userId', { length: 64 }).notNull();
      c.string('employeeId', { length: 64 }).notNull();
      c.string('name', { length: 200 }).notNull();
      c.string('status', { length: 32 }).notNull();
      c.datetime('confirmedAt');
      c.datetime('statusChangedAt').notNull();
      c.integer('version').notNull();
      c.unique(['announcementId', 'userId']);
      c.index('userId');
    });
    await builder.createCollection('announcementCommands', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('actorId', { length: 64 }).notNull();
      c.string('payloadHash', { length: 64 }).notNull();
      c.json('result').notNull();
    });
    await builder.createCollection('announcementFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('announcementId', { length: 64 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.integer('uploadVersion').notNull();
      c.index('announcementId');
    });
  },
  async down({ builder }) {
    for (const name of [
      'announcementFiles',
      'announcementCommands',
      'announcementReceipts',
      'announcements',
    ])
      await builder.dropCollection(name);
  },
});
