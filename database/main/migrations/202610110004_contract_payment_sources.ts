import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610110004_contract_payment_sources',
  irreversible: true,
  async up({ builder }) {
    await builder.alterCollection('paymentRequests', (c) => {
      c.string('sourceContractId', { length: 64, nullable: true });
      c.integer('sourceContractVersion', { nullable: true });
      c.integer('contractVersion', { nullable: true });
    });
    await builder.alterCollection('paymentRequestLedger', (c) => {
      c.string('contractId', { length: 64, nullable: true });
      c.alterField('vendorId', { type: 'string', length: 64, nullable: true });
    });
    await builder.alterCollection('contractPaymentReservations', (c) => {
      c.boolean('requiresFullApproval', {
        nullable: false,
        defaultValue: false,
      });
    });
  },
  // Payment and immutable ledger history must survive: this forward migration is irreversible.
});
