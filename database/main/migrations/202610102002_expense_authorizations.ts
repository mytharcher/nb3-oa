import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610102002_expense_authorizations',
  async up({ builder }) {
    await builder.addField('budgetLedger', {
      name: 'consumptionReference',
      type: 'string',
      length: 255,
      nullable: true,
    });
    await builder.createCollection('budgetConsumptions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('consumptionReference', { length: 255, nullable: false });
      c.unique('consumptionReference');
      c.string('budgetId', { length: 64, nullable: false });
      c.string('sourceReference', { length: 255, nullable: false });
      c.bigInt('cents', { nullable: false });
      c.string('requestKey', { length: 255, nullable: false });
    });
    await builder.createCollection('expenseAuthorizations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceKind', { length: 32, nullable: false });
      c.string('sourceId', { length: 64, nullable: false });
      c.unique(['sourceKind', 'sourceId']);
      c.string('applicantId', { length: 64, nullable: false });
      c.string('budgetMode', { length: 16, nullable: false });
      c.string('departmentId', { length: 64, nullable: true });
      c.integer('year', { nullable: true });
      c.string('subject', { length: 64, nullable: true });
      c.string('sourceReference', { length: 255, nullable: false });
      c.bigInt('grantedCents', { nullable: false });
      c.datetimeTz('issuedAt', { nullable: false });
      c.string('deadline', { length: 10, nullable: false });
      c.string('state', { length: 16, nullable: false });
      c.integer('version', { nullable: false, defaultValue: 0 });
      c.index(['state', 'deadline']);
    });
    await builder.createCollection('expenseAuthorizationClaims', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('authorizationId', { length: 64, nullable: false });
      c.string('reimbursementId', { length: 64, nullable: false });
      c.unique(['reimbursementId']);
      c.bigInt('cents', { nullable: false });
      c.string('state', { length: 16, nullable: false });
      c.text('overrunReason', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['authorizationId', 'state']);
    });
    await builder.createCollection('expenseAuthorizationOperations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('authorizationId', { length: 64, nullable: false });
      c.string('requestKey', { length: 255, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.unique(['authorizationId', 'requestKey']);
    });
  },
  async down({ builder }) {
    for (const table of [
      'expenseAuthorizationOperations',
      'expenseAuthorizationClaims',
      'expenseAuthorizations',
      'budgetConsumptions',
    ])
      await builder.dropCollection(table);
    await builder.dropField('budgetLedger', 'consumptionReference');
  },
});
export default migration;
