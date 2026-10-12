import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610104702_create_certificates',
  async up({ builder }) {
    await builder.createCollection('certificateRequests', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const key of [
        'applicantId',
        'createdById',
        'employeeId',
        'departmentId',
      ])
        c.string(key, { length: 64, nullable: false });
      c.string('certificateType', { length: 64, nullable: false });
      c.text('purpose', { nullable: false });
      c.integer('copies', { nullable: false });
      c.string('deliveryMethod', { length: 64, nullable: false });
      c.string('preparationId', { length: 64 });
      c.string('issueId', { length: 64 });
      c.text('exceptionReason');
      c.text('administrativeReason');
      c.string('approvedFingerprint', { length: 64 });
      c.string('status', { length: 40, nullable: false });
      c.integer('lifecycleVersion', { nullable: false });
      for (const key of ['createdAt', 'statusChangedAt'])
        c.datetime(key, { nullable: false });
      c.datetime('submittedAt');
      c.index('applicantId');
    });
    await builder.createCollection('certificatePreparations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const key of [
        'requestId',
        'templateId',
        'revisionId',
        'applicantId',
        'employeeId',
        'preparedById',
      ])
        c.string(key, { length: 64, nullable: false });
      c.string('number', { length: 128, nullable: false });
      c.unique('number');
      c.string('issueDate', { length: 10, nullable: false });
      for (const key of ['templateHash', 'sourceHash', 'requestHash'])
        c.string(key, { length: 64, nullable: false });
      c.integer('requestVersion', { nullable: false });
      c.string('runId', { length: 64, nullable: false });
      c.string('taskId', { length: 64, nullable: false });
      c.json('safeFacts', { nullable: false });
      c.string('sensitivity', { length: 16, nullable: false });
      c.string('status', { length: 24, nullable: false });
      c.datetime('preparedAt', { nullable: false });
      c.string('fileId', { length: 64 });
      c.string('fileHash', { length: 64 });
      c.index('requestId');
    });
    await builder.createCollection('certificatePreparationPrivate', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('monthlyCents', { length: 20, nullable: false });
      c.string('currency', { length: 3, nullable: false });
    });
    await builder.createCollection('certificateIssues', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const key of [
        'requestId',
        'preparationId',
        'fileId',
        'employeeId',
        'issuedById',
        'contentHash',
      ])
        c.string(key, { length: 64, nullable: false });
      c.unique('requestId');
      c.unique('preparationId');
      c.string('number', { length: 128, nullable: false });
      c.unique('number');
      c.string('issueDate', { length: 10, nullable: false });
      c.string('sensitivity', { length: 16, nullable: false });
      c.datetime('confirmedAt', { nullable: false });
    });
    await builder.createCollection('certificateCommands', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('actorId', { length: 64, nullable: false });
      c.string('bodyHash', { length: 64, nullable: false });
      c.string('requestId', { length: 64 });
      c.json('result');
    });
    await builder.createCollection('certificateFiles', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('preparationId', { length: 64, nullable: false });
      c.unique('preparationId');
      c.string('ownerId', { length: 64, nullable: false });
      c.string('contentHash', { length: 64, nullable: false });
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetime('createdAt').notNull();
      c.datetime('updatedAt').notNull();
    });
  },
  async down({ builder }) {
    for (const collection of [
      'certificateFiles',
      'certificateCommands',
      'certificateIssues',
      'certificatePreparationPrivate',
      'certificatePreparations',
      'certificateRequests',
    ])
      await builder.dropCollection(collection);
  },
});
