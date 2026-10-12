import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610101701_create_budget_ledger',
  async up({ builder }) {
    await builder.createCollection('budgets', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('departmentId', { length: 64, nullable: false });
      c.integer('year', { nullable: false });
      c.string('subject', { length: 64, nullable: false });
      // Coordination only: financial totals come from immutable ledger deltas.
      c.integer('version', { nullable: false, defaultValue: 0 });
      c.unique(['departmentId', 'year', 'subject']);
    });
    await builder.createCollection('budgetOperations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('budgetId', { length: 64, nullable: false });
      c.string('requestKey', { length: 255, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.unique(['budgetId', 'requestKey']);
    });
    await builder.createCollection('budgetLedger', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('budgetId', { length: 64, nullable: false });
      c.string('kind', { length: 16, nullable: false });
      c.string('requestKey', { length: 255, nullable: false });
      c.string('reference', { length: 255, nullable: false });
      for (const field of ['allocatedDelta', 'heldDelta', 'usedDelta'])
        c.bigInt(field, { nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.datetimeTz('at', { nullable: false });
      c.index(['budgetId', 'at']);
      c.index(['budgetId', 'reference']);
    });
  },
  async down({ builder }) {
    for (const name of ['budgetLedger', 'budgetOperations', 'budgets'])
      await builder.dropCollection(name);
  },
});
export default migration;
