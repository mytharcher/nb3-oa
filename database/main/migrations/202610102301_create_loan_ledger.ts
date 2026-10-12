import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610102301_create_loan_ledger',
  async up({ builder }) {
    await builder.createCollection('loans', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('sourceId', { length: 64, nullable: false });
      c.unique('sourceId');
      c.string('applicantId', { length: 64, nullable: false });
      c.bigInt('principalCents', { nullable: false });
      c.string('dueDate', { length: 10, nullable: false });
      c.datetimeTz('issuedAt', { nullable: false });
      c.integer('version', { nullable: false, defaultValue: 0 });
      c.index(['applicantId', 'dueDate']);
    });
    await builder.createCollection('loanReservations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('loanId', { length: 64, nullable: false });
      c.string('reference', { length: 255, nullable: false });
      c.unique('reference');
      c.string('kind', { length: 32, nullable: false });
      c.bigInt('cents', { nullable: false });
      c.string('state', { length: 32, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['loanId', 'state']);
    });
    await builder.createCollection('loanOperations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('loanId', { length: 64, nullable: false });
      c.string('requestKey', { length: 128, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.unique(['loanId', 'requestKey']);
    });
    await builder.createCollection('loanLedger', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('loanId', { length: 64, nullable: false });
      c.string('reservationId', { length: 64, nullable: true });
      c.string('reference', { length: 255, nullable: false });
      c.string('kind', { length: 32, nullable: false });
      c.bigInt('heldDelta', { nullable: false });
      c.bigInt('repaidDelta', { nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.datetimeTz('at', { nullable: false });
      c.index(['loanId', 'at']);
    });
  },
  async down({ builder }) {
    for (const collection of [
      'loanLedger',
      'loanOperations',
      'loanReservations',
      'loans',
    ])
      await builder.dropCollection(collection);
  },
});
