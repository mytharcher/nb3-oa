import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610250006_hr_master_data',
  async up({ builder }) {
    await builder.createCollection('hrSyncSources', (c) => {
      c.string('id', { length: 80 }).notNull();
      c.primary('id');
      c.string('name', { length: 160 }).notNull();
      c.string('principalId', { length: 255 }).notNull();
      c.boolean('active').notNull();
      c.datetimeTz('updatedAt').notNull();
    });
    await builder.createCollection('hrSyncMappings', (c) => {
      c.string('id', { length: 64 }).notNull();
      c.primary('id');
      c.string('source', { length: 80 }).notNull();
      c.string('entity', { length: 20 }).notNull();
      c.string('externalId', { length: 160 }).notNull();
      c.string('localId', { length: 255 }).notNull();
      c.integer('revision').notNull();
      c.string('payloadHash', { length: 64 }).notNull();
      c.string('localHash', { length: 64 }).notNull();
      c.json('fields').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.unique(['source', 'entity', 'externalId']);
      c.unique(['entity', 'localId']);
    });
    await builder.createCollection('hrSyncBatches', (c) => {
      c.string('id', { length: 64 }).notNull();
      c.primary('id');
      c.string('source', { length: 80 }).notNull();
      c.string('eventId', { length: 160 }).notNull();
      c.string('payloadHash', { length: 64 }).notNull();
      c.json('payload').notNull();
      c.string('state', { length: 20 }).notNull();
      c.string('reasonCode', { length: 100 });
      c.integer('itemCount').notNull();
      c.string('actorId', { length: 255 }).notNull();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.unique(['source', 'eventId']);
    });
  },
  async down({ builder }) {
    for (const name of ['hrSyncBatches', 'hrSyncMappings', 'hrSyncSources'])
      await builder.dropCollection(name);
  },
});
