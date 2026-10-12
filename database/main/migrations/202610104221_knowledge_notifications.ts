import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610104221_knowledge_notifications',
  async up({ builder }) {
    await builder.createCollection('knowledgeVersionNotices', (c) => {
      c.string('id', { length: 64, nullable: false }).primary();
      c.string('documentId', { length: 64, nullable: false });
      c.json('targets', { nullable: false });
      c.json('delivery', { nullable: false });
      c.string('status', { length: 16, nullable: false });
      c.datetime('statusChangedAt', { nullable: false });
      c.integer('version', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('knowledgeVersionNotices');
  },
});
