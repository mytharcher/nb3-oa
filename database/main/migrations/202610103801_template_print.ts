import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103801_template_print',
  async up({ builder }) {
    await builder.createCollection('printTemplates', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('name', { length: 120, nullable: false });
      c.string('source', { length: 40, nullable: false });
      c.boolean('active', { nullable: false });
      c.string('currentRevisionId', { length: 64 });
      c.integer('version', { nullable: false });
      c.string('createdById', { length: 64, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
    });
    await builder.createCollection('printTemplateFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('templateId', { length: 64, nullable: false });
      c.string('ownerId', { length: 64, nullable: false });
      c.string('uploadKey', { length: 64, nullable: false });
      c.unique('uploadKey');
    });
    await builder.createCollection('printTemplateRevisions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('templateId', { length: 64, nullable: false });
      c.integer('number', { nullable: false });
      c.string('fileId', { length: 36, nullable: false });
      c.string('contentHash', { length: 64, nullable: false });
      c.json('paths', { nullable: false });
      c.integer('schemaVersion', { nullable: false });
      c.string('createdById', { length: 64, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.unique(['templateId', 'number']);
      c.unique('fileId');
    });
    await builder.createCollection('printTemplateCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('requestKey', { length: 128, nullable: false });
      c.string('bodyHash', { length: 64, nullable: false });
      c.json('receipt');
      c.datetimeTz('createdAt', { nullable: false });
      c.unique(['actorId', 'requestKey']);
    });
  },
  async down({ builder }) {
    for (const name of [
      'printTemplateCommands',
      'printTemplateRevisions',
      'printTemplateFiles',
      'printTemplates',
    ])
      await builder.dropCollection(name);
  },
});
