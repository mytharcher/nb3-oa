import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104501_create_work_items',
  async up({ builder }) {
    await builder.createCollection('workItems', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      for (const field of [
        'creatorUserId',
        'targetUserId',
        'dutyRoleCode',
        'assigneeUserId',
      ])
        c.string(field, { length: 64 });
      c.string('title', { length: 200 }).notNull();
      c.text('description').notNull();
      c.string('status', { length: 32 }).notNull();
      c.datetime('dueAt').notNull();
      c.boolean('requiresConfirmation').notNull();
      c.json('attachments').notNull();
      c.json('resultAttachments').notNull();
      c.text('result');
      c.text('reason');
      c.boolean('forced').notNull();
      c.datetime('completedAt');
      c.datetime('statusChangedAt').notNull();
      c.integer('version').notNull();
      c.index('creatorUserId');
      c.index('assigneeUserId');
      c.index(['dutyRoleCode', 'status']);
    });
    await builder.createCollection('workItemCommands', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('actorId', { length: 64 }).notNull();
      c.string('payloadHash', { length: 64 }).notNull();
      c.json('result').notNull();
    });
    await builder.createCollection('workItemFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('workItemId', { length: 64 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.integer('uploadVersion').notNull();
      c.string('purpose', { length: 32 }).notNull();
      c.index('workItemId');
    });
  },
  async down({ builder }) {
    for (const name of ['workItemFiles', 'workItemCommands', 'workItems'])
      await builder.dropCollection(name);
  },
});
