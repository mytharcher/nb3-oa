import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610220001_legacy_backfills',
  async up({ builder, query }) {
    await builder.createCollection('oaTaskCenterBackfills', (c) => {
      c.string('id', { nullable: true, length: 128 });
      c.string('cursor', { nullable: true, length: 256 });
      c.boolean('done', { nullable: false, defaultValue: false });
    });
    await query.table('oaTaskCenterBackfills').insert({
      id: 'approval.test',
      cursor: 'record-100',
      done: false,
    });
  },
  async down({ builder }) {
    await builder.dropCollection('oaTaskCenterBackfills');
  },
});
