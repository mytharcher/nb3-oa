import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610250501_finance_integration',
  async up({ builder }) {
    await builder.createCollection(
      'financeIntegrationDispatches',
      (collection) => {
        collection.string('id', { length: 64, nullable: false });
        collection.primary('id');
        collection.string('kind', { length: 32, nullable: false });
        collection.string('recordId', { length: 128, nullable: false });
        collection.unique(['kind', 'recordId']);
        collection.string('destination', { length: 64, nullable: false });
        collection.string('idempotencyKey', { length: 128, nullable: false });
        collection.string('payloadHash', { length: 64, nullable: false });
        collection.json('payload', { nullable: false });
        collection.string('state', { length: 32, nullable: false });
        collection.string('externalId', { length: 128, nullable: true });
        collection.string('voucherNumber', { length: 128, nullable: true });
        collection.string('resultCode', { length: 64, nullable: true });
        collection.integer('attempts', { nullable: false });
        collection.string('leaseToken', { length: 64, nullable: true });
        collection.datetimeTz('leaseUntil', { nullable: true });
        collection.string('actorId', { length: 255, nullable: false });
        collection.datetimeTz('createdAt', { nullable: false });
        collection.datetimeTz('updatedAt', { nullable: false });
        collection.index(['state', 'updatedAt']);
      },
    );
  },
  async down({ builder }) {
    await builder.dropCollection('financeIntegrationDispatches');
  },
});
