import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610290001_create_it_repairs',
  async up({ builder }) {
    await builder.createCollection('itRepairs', (c) => {
      c.uuid('id').primary().notNull();
      c.string('requesterId', { length: 64 }).notNull();
      c.string('number', { length: 64 });
      c.string('title', { length: 120 }).notNull();
      c.text('description').notNull();
      c.string('category', { length: 32 }).notNull();
      c.string('impact', { length: 32 }).notNull();
      c.string('location', { length: 200 }).notNull();
      c.string('contact', { length: 200 }).notNull();
      c.string('assetId', { length: 64 });
      c.datetimeTz('occurredAt');
      c.string('groupId', { length: 64 });
      c.string('priority', { length: 2 });
      c.string('status', { length: 32 }).notNull();
      c.integer('version').notNull();
      c.json('submissionSnapshot');
      c.json('calendarSnapshot');
      c.json('ruleSnapshot');
      for (const f of ['createdAt', 'updatedAt', 'statusChangedAt'])
        c.datetimeTz(f).notNull();
      for (const f of ['submittedAt', 'responseDueAt', 'resolutionDueAt'])
        c.datetimeTz(f);
      c.unique('number');
      c.index(['requesterId', 'createdAt']);
      c.index(['requesterId', 'updatedAt']);
      c.index(['groupId', 'status', 'updatedAt']);
    });
    await builder.createCollection('itRepairCommands', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('actorId', { length: 64 }).notNull();
      c.string('repairId', { length: 64 });
      c.string('payloadHash', { length: 64 }).notNull();
      c.json('result').notNull();
      c.datetimeTz('createdAt').notNull();
    });
    await builder.createCollection('itRepairGroups', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('title', { length: 120 }).notNull();
      c.json('leaderIds').notNull();
      c.json('engineerIds').notNull();
      c.json('categories').notNull();
      c.boolean('active').notNull();
      c.integer('version').notNull();
      c.datetimeTz('updatedAt').notNull();
    });
    await builder.createCollection('itRepairFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.string('repairId', { length: 64 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.string('purpose', { length: 32 }).notNull();
      c.string('visibility', { length: 16 }).notNull();
      c.index(['repairId', 'purpose']);
    });
  },
  async down({ builder }) {
    for (const name of [
      'itRepairFiles',
      'itRepairGroups',
      'itRepairCommands',
      'itRepairs',
    ])
      await builder.dropCollection(name);
  },
});
