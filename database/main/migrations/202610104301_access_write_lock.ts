import { defineMigration } from '@nocobase/db';

// Application-owned coordination, never a second source of permission definitions.
export default defineMigration({
  name: '202610104301_access_write_lock',
  async up({ builder, query }) {
    await builder.createCollection('accessWriteLock', (c) => {
      c.string('id', { length: 32, nullable: false });
      c.primary('id');
      c.integer('version', { nullable: false });
    });
    await query
      .insertInto('accessWriteLock')
      .values({ id: 'permissions', version: 0 })
      .execute();
  },
  async down({ builder }) {
    await builder.dropCollection('accessWriteLock');
  },
});
