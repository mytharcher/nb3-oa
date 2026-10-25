import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610250701_invoice_recognition',
  async up({ builder }) {
    await builder.createCollection('invoiceRecognitionOperations', (c) => {
      c.string('id', { length: 128, nullable: false });
      c.primary('id');
      c.string('operation', { length: 16, nullable: false });
      c.string('recordId', { length: 128, nullable: false });
      c.string('lineId', { length: 128, nullable: false });
      c.string('fileId', { length: 128, nullable: false });
      c.string('ownerId', { length: 255, nullable: false });
      c.string('destination', { length: 64, nullable: false });
      c.string('contentHash', { length: 64, nullable: false });
      c.json('envelope', { nullable: false });
      c.string('state', { length: 32, nullable: false });
      c.json('result', { nullable: true });
      c.integer('attempts', { nullable: false });
      c.string('leaseToken', { length: 64, nullable: true });
      c.datetimeTz('leaseUntil', { nullable: true });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.datetimeTz('receivedAt', { nullable: true });
      c.index(['recordId', 'lineId', 'updatedAt']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('invoiceRecognitionOperations');
  },
});
