import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610102102_create_reimbursements',
  async up({ builder }) {
    await builder.createCollection('reimbursementRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const name of ['applicantId', 'createdById'])
        c.string(name, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.text('reason', { nullable: false });
      c.text('overrunReason', { nullable: false });
      c.json('lines', { nullable: false });
      for (const name of ['totalCents', 'offsetCents'])
        c.bigInt(name, { nullable: false, defaultValue: 0 });
      c.bigInt('lastSubmittedTotalCents', { nullable: true });
      c.bigInt('debtHeldCents', { nullable: false, defaultValue: 0 });
      c.boolean('bindingCaptured', { nullable: false, defaultValue: false });
      c.boolean('debtHoldRecorded', { nullable: false, defaultValue: false });
      for (const name of [
        'authorizationId',
        'loanId',
        'boundAuthorizationId',
        'boundLoanId',
        'departmentId',
        'managerId',
        'headId',
        'accountantId',
        'executiveId',
        'gmId',
        'paymentId',
      ])
        c.string(name, { length: 64, nullable: true });
      for (const name of [
        'ruleSnapshot',
        'managerReviewBasis',
        'headReviewBasis',
      ])
        c.json(name, { nullable: true });
      c.json('financeLineFacts', { nullable: false });
      c.json('financeCorrectionLines', { nullable: false, defaultValue: [] });
      c.string('exceptionContentHash', { length: 128, nullable: true });
      c.text('handlingFailureReason', { nullable: true });
      c.text('forcedReason', { nullable: true });
      c.string('voucherNumber', { length: 128, nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
      c.index(['departmentId', 'createdAt']);
    });
    await builder.createCollection('reimbursementAttachmentFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('reimbursementId', { length: 64 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.integer('uploadVersion').notNull();
      c.index('reimbursementId');
    });
    // Bank details never enter the public application record or plugin run snapshots.
    await builder.createCollection('reimbursementPayees', (c) => {
      c.string('requestId', { length: 64, nullable: false });
      c.primary('requestId');
      c.string('bankName', { length: 128, nullable: true });
      c.string('bankAccount', { length: 64, nullable: true });
      c.string('bankAccountName', { length: 128, nullable: true });
      c.integer('version', { nullable: false, defaultValue: 0 });
    });
    await builder.createCollection('reimbursementPayments', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestId', { length: 64, nullable: false });
      c.unique('requestId');
      c.string('actorId', { length: 64, nullable: false });
      for (const name of ['grossCents', 'offsetCents', 'netCents'])
        c.bigInt(name, { nullable: false });
      c.string('voucherNumber', { length: 128, nullable: true });
      c.boolean('forced', { nullable: false });
      c.text('reason', { nullable: true });
      c.datetimeTz('at', { nullable: false });
    });
  },
  async down({ builder }) {
    for (const collection of [
      'reimbursementAttachmentFiles',
      'reimbursementPayments',
      'reimbursementPayees',
      'reimbursementRequests',
    ])
      await builder.dropCollection(collection);
  },
});
