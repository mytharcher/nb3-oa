import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103502_headcount_replacement_notifications',
  async up({ builder }) {
    await builder.createCollection('headcountReplacementNotices', (c) => {
      c.string('id', { length: 64, nullable: false }).primary();
      c.string('sourceKind', { length: 64, nullable: false });
      c.string('sourceId', { length: 128, nullable: false });
      c.json('recipients', { nullable: false });
      c.json('delivery', { nullable: false });
      c.string('status', { length: 16, nullable: false });
      c.datetime('statusChangedAt', { nullable: false });
      c.integer('version', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('headcountReplacementNotices');
  },
});
