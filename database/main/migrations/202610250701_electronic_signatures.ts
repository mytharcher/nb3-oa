import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610250701_electronic_signatures',
  async up({ builder }) {
    await builder.alterCollection('sealRequests', (c) => {
      c.string('executionMode', {
        length: 20,
        nullable: false,
        defaultValue: 'physical',
      });
      c.string('electronicEvidenceId', { length: 64, nullable: true });
    });
    await builder.createCollection('signatureEnvelopes', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const field of ['kind', 'state'])
        c.string(field, { length: 32, nullable: false });
      c.string('recordId', { length: 64, nullable: false });
      c.string('sourceVersion', { length: 128, nullable: false });
      c.unique(['kind', 'recordId', 'sourceVersion']);
      for (const field of ['destination', 'payloadHash', 'documentHash'])
        c.string(field, { length: 64, nullable: false });
      c.string('idempotencyKey', { length: 128, nullable: false });
      c.json('payload', { nullable: false });
      c.string('externalId', { length: 128, nullable: true });
      c.string('signingPath', { length: 2000, nullable: true });
      c.string('signedHash', { length: 64, nullable: true });
      c.string('fileId', { length: 64, nullable: true });
      c.string('resultCode', { length: 64, nullable: true });
      c.string('leaseToken', { length: 64, nullable: true });
      c.datetimeTz('leaseUntil', { nullable: true });
      c.datetimeTz('signedAt', { nullable: true });
      c.datetimeTz('archivedAt', { nullable: true });
      c.string('actorId', { length: 255, nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
    });
    await builder.createCollection('signatureArchiveFiles', (c) => {
      c.uuid('id').primary().notNull();
      c.string('disk', { length: 255 }).notNull();
      c.text('key').notNull();
      c.text('filename').notNull();
      c.string('ext', { length: 32 }).notNull();
      c.string('mimeType', { length: 255 }).notNull();
      c.bigInt('size').notNull();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
    });
    await builder.createCollection('electronicSealLedger', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('requestId', { length: 64, nullable: false });
      c.unique(['requestId']);
      for (const field of [
        'envelopeId',
        'fileId',
        'documentHash',
        'signedHash',
      ])
        c.string(field, { length: 64, nullable: false });
      c.string('externalId', { length: 128, nullable: false });
      c.string('contractId', { length: 64, nullable: true });
      c.integer('contractVersion', { nullable: true });
      c.string('contractTextVersionId', { length: 64, nullable: true });
      c.datetimeTz('signedAt', { nullable: false });
      c.string('confirmedById', { length: 255, nullable: false });
      c.datetimeTz('confirmedAt', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('electronicSealLedger');
    await builder.dropCollection('signatureArchiveFiles');
    await builder.dropCollection('signatureEnvelopes');
    await builder.alterCollection('sealRequests', (c) => {
      c.dropField('electronicEvidenceId');
      c.dropField('executionMode');
    });
  },
});
