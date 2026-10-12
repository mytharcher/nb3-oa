import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610101801_create_supplies',
  async up({ builder }) {
    await builder.createCollection('supplyRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.json('items', { nullable: false });
      c.text('purpose', { nullable: false });
      c.json('itemSnapshot', { nullable: true });
      c.json('ruleSnapshot', { nullable: true });
      c.json('hrRecipients', { nullable: false });
      for (const field of [
        'managerApproverId',
        'issuedById',
        'approvedFingerprint',
      ])
        c.string(field, { length: 128, nullable: true });
      c.datetimeTz('approvedAt', { nullable: true });
      c.boolean('forcedClosed', { nullable: false, defaultValue: false });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
    });
    await builder.createCollection('supplyIssueLedger', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('applicationId', { length: 64, nullable: false });
      c.integer('line', { nullable: false });
      c.unique(['applicationId', 'line']);
      c.string('number', { length: 64, nullable: true });
      c.json('itemLabel', { nullable: false });
      for (const field of ['recipientName', 'issuerName'])
        c.string(field, { length: 500, nullable: false });
      c.string('itemCode', { length: 64, nullable: false });
      c.integer('requestedQuantity', { nullable: false });
      c.integer('actualQuantity', { nullable: true });
      c.json('printInfo', { nullable: true });
      for (const field of ['recipientId', 'issuerId'])
        c.string(field, { length: 64, nullable: false });
      c.string('outcome', { length: 32, nullable: false });
      c.text('reason', { nullable: true });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['recipientId', 'createdAt']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('supplyIssueLedger');
    await builder.dropCollection('supplyRequests');
  },
});
