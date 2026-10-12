import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104201_create_knowledge',
  async up({ builder }) {
    await builder.createCollection('knowledgeFolders', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('parentId', { length: 64 });
      c.string('title', { length: 200, nullable: false });
      c.integer('version', { nullable: false });
      c.index('parentId');
    });
    await builder.createCollection('knowledgeDocuments', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('folderId', { length: 64 });
      c.string('title', { length: 200, nullable: false });
      c.string('ownerId', { length: 64, nullable: false });
      c.string('latestVersionId', { length: 64, nullable: false });
      c.integer('version', { nullable: false });
      c.boolean('active', { nullable: false });
      c.json('departmentIds', { nullable: false });
      c.json('dutyRoleCodes', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
      c.index('folderId');
    });
    await builder.createCollection('knowledgeVersions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('documentId', { length: 64, nullable: false });
      c.integer('version', { nullable: false });
      c.string('kind', { length: 16, nullable: false });
      c.text('markdown');
      c.string('fileId', { length: 64 });
      c.string('authorId', { length: 64, nullable: false });
      c.datetime('createdAt', { nullable: false });
      c.unique(['documentId', 'version']);
    });
    await builder.createCollection('knowledgeFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('ownerId', { length: 64 });
      c.string('uploadKey', { length: 64 });
      c.string('payloadHash', { length: 64 });
      c.unique('uploadKey');
    });
    await builder.createCollection('knowledgeCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('payloadHash', { length: 64, nullable: false });
      c.json('result', { nullable: false });
    });
    await builder.createCollection('knowledgeTreeLock', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.integer('version', { nullable: false });
    });
  },
  async down({ builder }) {
    for (const n of [
      'knowledgeCommands',
      'knowledgeTreeLock',
      'knowledgeFiles',
      'knowledgeVersions',
      'knowledgeDocuments',
      'knowledgeFolders',
    ])
      await builder.dropCollection(n);
  },
});
