import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103501_create_headcounts',
  async up(context) {
    const { builder } = context;
    await builder.createCollection('headcountGuards', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.integer('version', { nullable: false });
      c.primary('id');
    });
    await builder.createCollection('headcountAccounts', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('departmentId', { length: 64, nullable: false });
      c.string('positionId', { length: 64, nullable: false });
      c.integer('year', { nullable: false });
      c.integer('limit', { nullable: false });
      c.boolean('initialized', { nullable: false });
      c.integer('version', { nullable: false });
      c.datetime('createdAt', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
      c.unique(['departmentId', 'positionId', 'year']);
    });
    await builder.createCollection('headcountOccupancies', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('accountId', { length: 64, nullable: false });
      c.string('employeeId', { length: 64, nullable: false });
      c.string('state', { length: 32, nullable: false });
      c.string('claimSeatId', { length: 64 });
      c.string('sourceReference', { length: 192, nullable: false });
      c.datetime('createdAt', { nullable: false });
      c.datetime('releasedAt');
      c.string('activeKey', { length: 64, nullable: false });
      c.string('releaseKind', { length: 32 });
      c.integer('generation', { nullable: false });
      c.unique('activeKey');
      c.index(['accountId', 'employeeId']);
      c.index(['employeeId', 'state']);
    });
    await builder.createCollection('headcountSources', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceKind', { length: 64, nullable: false });
      c.string('sourceId', { length: 128, nullable: false });
      c.string('accountId', { length: 64, nullable: false });
      c.string('mode', { length: 32, nullable: false });
      c.string('state', { length: 32, nullable: false });
      c.integer('quantity', { nullable: false });
      c.datetime('createdAt', { nullable: false });
      c.unique(['sourceKind', 'sourceId']);
    });
    await builder.createCollection('headcountSeats', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceReference', { length: 64, nullable: false });
      c.string('accountId', { length: 64, nullable: false });
      c.integer('ordinal', { nullable: false });
      c.string('state', { length: 32, nullable: false });
      c.string('replacementOccupancyId', { length: 64 });
      c.string('employeeId', { length: 64 });
      c.datetime('createdAt', { nullable: false });
      c.unique(['sourceReference', 'ordinal']);
      c.index(['accountId', 'state']);
    });
    await builder.createCollection('headcountCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestKey', { length: 128, nullable: false });
      c.string('fingerprint', { length: 64, nullable: false });
      c.json('result', { nullable: false });
      c.datetime('createdAt', { nullable: false });
    });
    await builder.createCollection('headcountJournal', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('accountId', { length: 64, nullable: false });
      c.string('departmentId', { length: 64, nullable: false });
      c.string('action', { length: 32, nullable: false });
      c.string('sourceReference', { length: 192 });
      c.string('actorId', { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.json('evidence', { nullable: false });
      c.datetime('at', { nullable: false });
      c.index(['accountId', 'at']);
    });
    // Repository handles field naming/encoding for this required singleton lock record.
    await context.repository('headcountGuards').createOne({
      values: { id: 'mutation', version: 0 },
    });
  },
  async down({ builder }) {
    for (const name of [
      'headcountJournal',
      'headcountCommands',
      'headcountSeats',
      'headcountSources',
      'headcountOccupancies',
      'headcountAccounts',
      'headcountGuards',
    ])
      await builder.dropCollection(name);
  },
});
