import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610102101_finance_assignments_and_invoices',
  async up({ builder }) {
    await builder.createCollection('financeAssignments', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('departmentId', { length: 64, nullable: false });
      c.unique('departmentId');
      c.string('accountantId', { length: 64, nullable: false });
      c.boolean('active', { nullable: false, defaultValue: true });
      c.integer('version', { nullable: false, defaultValue: 1 });
      c.datetimeTz('updatedAt', { nullable: false });
    });
    await builder.createCollection('invoiceDocuments', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('applicantId', { length: 64 });
      c.string('state', { length: 16, nullable: false });
      c.integer('version', { nullable: false, defaultValue: 1 });
    });
    await builder.createCollection('invoices', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('number', { length: 64, nullable: false });
      c.unique('number');
      c.string('state', { length: 16, nullable: false });
      c.string('documentId', { length: 64 });
      c.string('lineId', { length: 64 });
      c.string('applicantId', { length: 64 });
      c.bigInt('cents', { nullable: false, defaultValue: 0 });
      c.json('attachmentIds', { nullable: false, defaultValue: '[]' });
      c.integer('version', { nullable: false, defaultValue: 1 });
      c.index(['documentId', 'state']);
    });
    await builder.createCollection('invoiceOperations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('documentId', { length: 64, nullable: false });
      c.string('requestKey', { length: 255, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.unique(['documentId', 'requestKey']);
    });
    await builder.createCollection('invoiceEvents', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('invoiceId', { length: 64, nullable: false });
      c.string('documentId', { length: 64, nullable: false });
      c.string('lineId', { length: 64, nullable: false });
      c.string('kind', { length: 16, nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.string('requestKey', { length: 255, nullable: false });
      c.json('before');
      c.json('after');
      c.datetimeTz('at', { nullable: false });
      c.index(['documentId', 'at']);
    });
  },
  async down({ builder }) {
    for (const name of [
      'invoiceEvents',
      'invoiceOperations',
      'invoices',
      'invoiceDocuments',
      'financeAssignments',
    ])
      await builder.dropCollection(name);
  },
});
export default migration;
