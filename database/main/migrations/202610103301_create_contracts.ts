import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610103301_create_contracts',
  async up({ builder }) {
    await builder.createCollection('contracts', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.string('requestId', { length: 64, nullable: false });
      c.unique('requestId');
      c.string('applicantId', { length: 64, nullable: false });
      c.string('departmentId', { length: 64, nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.integer('version', { nullable: false, defaultValue: 0 });
      // Funds locking is deliberately separate from the immutable business version.
      c.integer('lockVersion', { nullable: false, defaultValue: 0 });
      c.bigInt('amountCents', { nullable: false });
      c.json('facts', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['applicantId', 'status']);
    });
    await builder.createCollection('contractVersions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('contractId', { length: 64, nullable: false });
      c.integer('version', { nullable: false });
      c.unique(['contractId', 'version']);
      c.string('requestId', { length: 64, nullable: false });
      c.unique('requestId');
      c.json('facts', { nullable: false });
      c.bigInt('amountCents', { nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.datetimeTz('at', { nullable: false });
    });
    await builder.createCollection('contractPaymentReservations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('contractId', { length: 64, nullable: false });
      c.string('reference', { length: 255, nullable: false });
      c.unique('reference');
      c.bigInt('cents', { nullable: false });
      c.string('state', { length: 32, nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['contractId', 'state']);
    });
    await builder.createCollection('contractMoneyLedger', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('contractId', { length: 64, nullable: false });
      c.string('reference', { length: 255, nullable: false });
      c.string('kind', { length: 32, nullable: false });
      c.bigInt('heldDelta', { nullable: false });
      c.bigInt('paidDelta', { nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.datetimeTz('at', { nullable: false });
      c.index(['contractId', 'at']);
    });
    await builder.createCollection('contractCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('requestKey', { length: 128, nullable: false });
      c.text('fingerprint', { nullable: false });
      c.string('targetId', { length: 64, nullable: false });
      c.json('result', { nullable: true });
      c.unique(['actorId', 'requestKey']);
    });
    await builder.createCollection('contractRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('creatorId', { length: 64, nullable: false });
      c.string('applicantId', { length: 64, nullable: false });
      c.string('departmentId', { length: 64, nullable: false });
      c.string('number', { length: 64, nullable: true });
      c.string('operation', { length: 32, nullable: false });
      c.string('contractId', { length: 64, nullable: false });
      c.integer('baseVersion', { nullable: false });
      c.string('contractType', { length: 64, nullable: false });
      c.json('counterparty', { nullable: false });
      c.bigInt('amountCents', { nullable: false });
      c.string('startsOn', { length: 10, nullable: false });
      c.string('endsOn', { length: 10, nullable: false });
      c.text('paymentTerms', { nullable: false });
      c.boolean('standardTemplate', { nullable: false });
      c.string('textVersionId', { length: 64, nullable: true });
      c.json('attachments', { nullable: false });
      c.text('reason', { nullable: false });
      c.json('ruleSnapshot', { nullable: false });
      c.boolean('nonStandard', { nullable: true });
      c.string('status', { length: 32, nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetimeTz('statusChangedAt', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('submittedAt', { nullable: true });
      c.index(['applicantId', 'status']);
      c.index(['contractId', 'baseVersion']);
    });
    await builder.createCollection('contractTextVersions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestId', { length: 64, nullable: false });
      c.integer('version', { nullable: false });
      c.unique(['requestId', 'version']);
      c.string('fileId', { length: 64, nullable: false });
      c.string('actorId', { length: 64, nullable: false });
      c.datetimeTz('at', { nullable: false });
    });
    await builder.createCollection('contractAttachmentFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('requestId', { length: 64 }).notNull();
      c.string('ownerId', { length: 64 }).notNull();
      c.integer('uploadVersion').notNull();
      c.string('purpose', { length: 32 }).notNull();
      c.index('requestId');
    });
  },
  async down({ builder }) {
    for (const name of [
      'contractAttachmentFiles',
      'contractTextVersions',
      'contractRequests',
      'contractCommands',
      'contractMoneyLedger',
      'contractPaymentReservations',
      'contractVersions',
      'contracts',
    ])
      await builder.dropCollection(name);
  },
});
