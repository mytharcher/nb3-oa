import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610102701_create_payment_requests',
  async up({ builder }) {
    await builder.createCollection('paymentRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const name of ['applicantId', 'createdById'])
        c.string(name, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.string('sourceMode', { length: 16, nullable: false });
      c.text('reason', { nullable: false });
      c.text('noPriorApprovalReason', { nullable: false });
      for (const name of [
        'purchaseOrderId',
        'contractId',
        'vendorId',
        'departmentId',
        'sourceOrderId',
        'headApproverId',
        'executiveApproverId',
        'gmApproverId',
        'paymentId',
      ])
        c.string(name, { length: 64, nullable: true });
      c.bigInt('amountCents', { nullable: false, defaultValue: 0 });
      c.bigInt('sourceHeldCents', { nullable: false, defaultValue: 0 });
      for (const name of ['sourceApprovedCents', 'sourceCumulativeCents'])
        c.bigInt(name, { nullable: true });
      c.text('invoiceNumber', { nullable: false });
      c.string('paymentMethod', { length: 64, nullable: false });
      for (const name of ['attachments', 'voucherAttachments'])
        c.json(name, { nullable: false, defaultValue: [] });
      for (const name of ['ruleSnapshot', 'vendorSnapshot', 'gmMerged'])
        c.json(name, { nullable: true });
      c.boolean('fullApprovalRequired', {
        nullable: false,
        defaultValue: false,
      });
      for (const name of [
        'headApprovedAt',
        'financeApprovedAt',
        'executiveApprovedAt',
        'gmApprovedAt',
        'approvalGrantedAt',
        'paidAt',
      ])
        c.datetimeTz(name, { nullable: true });
      c.string('voucherNumber', { length: 128, nullable: true });
      c.string('exceptionContentHash', { length: 128, nullable: true });
      c.text('handlingFailureReason', { nullable: true });
      c.text('forcedReason', { nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
      c.index(['sourceOrderId', 'status']);
    });
    await builder.createCollection('paymentPayees', (c) => {
      c.string('requestId', { length: 64, nullable: false });
      c.primary('requestId');
      for (const name of ['bankName', 'bankAccount', 'bankAccountName'])
        c.text(name, { nullable: false });
      c.integer('version', { nullable: false, defaultValue: 1 });
    });
    await builder.createCollection('paymentRequestLedger', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestId', { length: 64, nullable: false });
      c.unique('requestId');
      c.string('purchaseOrderId', { length: 64, nullable: true });
      c.string('vendorId', { length: 64, nullable: false });
      c.bigInt('cents', { nullable: false });
      c.string('voucherNumber', { length: 128, nullable: true });
      c.json('voucherAttachments', { nullable: false });
      c.boolean('forced', { nullable: false });
      c.text('reason', { nullable: true });
      c.string('actorId', { length: 64, nullable: false });
      c.datetimeTz('paidAt', { nullable: false });
    });
    await builder.createCollection('paymentCreationCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('requestKey', { length: 128, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.string('recordId', { length: 64, nullable: false });
      c.unique(['actorId', 'requestKey']);
    });
    await builder.createCollection('paymentAttachmentFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('paymentRequestId', { length: 64 }).notNull();
      c.string('purpose', { length: 16 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.integer('sourceVersion').notNull();
      c.index(['paymentRequestId', 'purpose']);
    });
  },
  async down({ builder }) {
    for (const name of [
      'paymentAttachmentFiles',
      'paymentCreationCommands',
      'paymentRequestLedger',
      'paymentPayees',
      'paymentRequests',
    ])
      await builder.dropCollection(name);
  },
});
