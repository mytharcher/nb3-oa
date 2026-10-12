import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104401_create_seals',
  async up({ builder }) {
    await builder.createCollection('sealRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const f of ['applicantId', 'createdById', 'departmentId'])
        c.string(f, { length: 64, nullable: false });
      for (const f of [
        'number',
        'contractId',
        'contractTextVersionId',
        'sealId',
        'ledgerId',
        'approvedFingerprint',
      ])
        c.string(f, { length: 128 });
      c.integer('contractVersion');
      c.integer('copies', { nullable: false });
      c.integer('actualCopies');
      c.boolean('external', { nullable: false });
      c.string('sealType', { length: 64, nullable: false });
      c.json('fileIds', { nullable: false });
      c.text('purpose', { nullable: false });
      c.text('contact', { nullable: false });
      c.text('exceptionReason');
      c.text('administrativeReason');
      for (const f of [
        'returnDueAt',
        'approvedAt',
        'sealedAt',
        'borrowedAt',
        'returnedAt',
        'submittedAt',
      ])
        c.datetime(f);
      c.json('ruleSnapshot', { nullable: false });
      c.string('status', { length: 40, nullable: false });
      c.integer('lifecycleVersion', { nullable: false });
      for (const f of ['createdAt', 'statusChangedAt'])
        c.datetime(f, { nullable: false });
      c.index('applicantId');
      c.index('contractId');
    });
    await builder.createCollection('seals', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('code', { length: 64, nullable: false });
      c.unique('code');
      c.string('name', { length: 200, nullable: false });
      c.string('sealType', { length: 64, nullable: false });
      c.boolean('active', { nullable: false });
      c.integer('version', { nullable: false });
    });
    await builder.createCollection('sealLedger', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const f of [
        'requestId',
        'sealId',
        'applicantId',
        'departmentId',
        'registeredById',
      ])
        c.string(f, { length: 64, nullable: false });
      c.unique('requestId');
      c.string('contractId', { length: 64 });
      c.integer('contractVersion');
      c.string('contractTextVersionId', { length: 64 });
      c.integer('approvedCopies', { nullable: false });
      c.integer('actualCopies');
      c.boolean('external', { nullable: false });
      c.datetime('borrowedAt');
      c.datetime('sealedAt');
      c.datetime('registeredAt', { nullable: false });
      c.index('sealId');
      c.index('applicantId');
    });
    await builder.createCollection('sealReceipts', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const f of ['ledgerId', 'requestId', 'sealId', 'confirmedById'])
        c.string(f, { length: 64, nullable: false });
      c.unique('ledgerId');
      c.datetime('returnedAt', { nullable: false });
      c.datetime('sealedAt', { nullable: false });
      c.integer('actualCopies', { nullable: false });
      c.string('contractConfirmation', { length: 32, nullable: false });
      c.text('reason', { nullable: false });
    });
    await builder.createCollection('sealFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
      c.string('ownerId', { length: 64 });
      c.string('requestId', { length: 64 });
      c.string('uploadKey', { length: 64 });
      c.unique('uploadKey');
      c.string('payloadHash', { length: 64 });
    });
    await builder.createCollection('sealCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('requestId', { length: 64 });
      c.string('payloadHash', { length: 64, nullable: false });
      c.json('result', { nullable: false });
    });
    await builder.createCollection('sealReminderDeliveries', (c) => {
      c.string('id', { length: 128, nullable: false });
      c.primary('id');
      c.string('ledgerId', { length: 64, nullable: false });
      c.string('date', { length: 10, nullable: false });
      c.datetime('deliveredAt');
    });
  },
  async down({ builder }) {
    for (const n of [
      'sealReminderDeliveries',
      'sealCommands',
      'sealFiles',
      'sealReceipts',
      'sealLedger',
      'seals',
      'sealRequests',
    ])
      await builder.dropCollection(n);
  },
});
