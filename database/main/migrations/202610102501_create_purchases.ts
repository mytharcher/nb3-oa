import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610102501_create_purchases',
  async up({ builder }) {
    await builder.createCollection('purchaseRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['applicantId', 'createdById'])
        c.string(field, { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.json('items', { nullable: false });
      c.string('subject', { length: 128, nullable: false });
      c.bigInt('estimatedCents', { nullable: false });
      c.string('expectedDate', { length: 10, nullable: false });
      c.text('purpose', { nullable: false });
      c.bigInt('actualCents', { nullable: true });
      c.json('quotes', { nullable: false, defaultValue: [] });
      for (const field of [
        'suggestedVendorId',
        'selectedVendorId',
        'departmentId',
        'headApproverId',
        'executiveApproverId',
        'gmApproverId',
        'handlingActorId',
        'orderId',
      ])
        c.string(field, { length: 64, nullable: true });
      c.unique('orderId');
      c.integer('year', { nullable: true });
      c.json('heldAccount', { nullable: true });
      c.bigInt('heldCents', { nullable: false, defaultValue: 0 });
      c.json('ruleSnapshot', { nullable: true });
      c.json('gmMerged', { nullable: true });
      c.text('handlingFailureReason', { nullable: true });
      c.string('approvedFingerprint', { length: 128, nullable: true });
      for (const field of [
        'financeEntered',
        'priceConfirmationRequired',
        'handlingForced',
      ])
        c.boolean(field, { nullable: false, defaultValue: false });
      c.string('status', { length: 32, nullable: false });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['applicantId', 'status']);
    });
    await builder.createCollection('purchaseOrders', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['purchaseId', 'applicantId', 'departmentId'])
        c.string(field, { length: 64, nullable: false });
      c.unique('purchaseId');
      c.string('number', { length: 64, nullable: false });
      c.unique('number');
      c.json('items', { nullable: false });
      c.bigInt('actualCents', { nullable: false });
      c.json('vendor', { nullable: false });
      c.json('account', { nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.integer('version', { nullable: false, defaultValue: 1 });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('acceptedAt', { nullable: true });
      c.string('acceptedById', { length: 64, nullable: true });
      c.string('receiptDate', { length: 10, nullable: true });
      c.text('receiptReason', { nullable: true });
      c.index(['applicantId', 'status']);
    });
    await builder.createCollection('purchasePaymentReferences', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('orderId', { length: 64, nullable: false });
      c.string('paymentId', { length: 64, nullable: false });
      c.unique('paymentId');
      c.bigInt('cents', { nullable: false });
      c.string('state', { length: 32, nullable: false });
      c.boolean('requiresAdditionalApproval', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['orderId', 'state']);
    });
    await builder.createCollection('purchaseQuoteFiles', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('disk', { length: 255, nullable: false });
      c.text('key', { nullable: false });
      c.text('filename', { nullable: false });
      c.string('ext', { length: 32, nullable: false });
      c.string('mimeType', { length: 255, nullable: false });
      c.bigInt('size', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      for (const field of ['purchaseId', 'vendorId', 'ownerId'])
        c.string(field, { length: 64, nullable: false });
      c.integer('uploadVersion', { nullable: false });
      c.string('quoteBasisHash', { nullable: false });
      c.index('purchaseId');
    });
  },
  async down({ builder }) {
    for (const name of [
      'purchaseQuoteFiles',
      'purchasePaymentReferences',
      'purchaseOrders',
      'purchaseRequests',
    ])
      await builder.dropCollection(name);
  },
});
