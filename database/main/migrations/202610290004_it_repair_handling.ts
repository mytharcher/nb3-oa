import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610290004_it_repair_handling',
  async up({ builder }) {
    await builder.alterCollection('itRepairGroups', (c) =>
      c.string('routingCursor', { length: 64 }),
    );
    await builder.alterCollection('itRepairs', (c) => {
      c.string('assigneeId', { length: 64 });
      c.json('processing');
      c.datetimeTz('nextDueAt');
      c.index(['assigneeId', 'status']);
      c.index('nextDueAt');
    });
    await builder.createCollection('itRepairLinks', (c) => {
      c.uuid('id').primary().notNull();
      c.string('repairId', { length: 64 }).notNull();
      c.string('kind', { length: 32 }).notNull();
      c.string('sourceId', { length: 64 }).notNull();
      c.integer('cursor').notNull();
      c.json('receipts').notNull();
      c.datetimeTz('nextCheckAt');
      c.datetimeTz('createdAt').notNull();
      c.unique(['repairId', 'kind', 'sourceId']);
      c.index('nextCheckAt');
    });
    await builder.createCollection('itRepairEvents', (c) => {
      c.uuid('id').primary().notNull();
      c.string('repairId', { length: 64 }).notNull();
      c.string('eventKey', { length: 255 }).notNull();
      c.string('type', { length: 64 }).notNull();
      c.string('actorId', { length: 64 });
      c.string('visibility', { length: 16 }).notNull();
      c.json('data').notNull();
      c.datetimeTz('createdAt').notNull();
      c.unique('eventKey');
      c.index(['repairId', 'createdAt']);
    });
  },
  async down({ builder }) {
    await builder.alterCollection('itRepairGroups', (c) =>
      c.dropField('routingCursor'),
    );
    await builder.dropCollection('itRepairEvents');
    await builder.dropCollection('itRepairLinks');
    await builder.alterCollection('itRepairs', (c) => {
      for (const field of ['assigneeId', 'processing', 'nextDueAt'])
        c.dropField(field);
    });
  },
});
