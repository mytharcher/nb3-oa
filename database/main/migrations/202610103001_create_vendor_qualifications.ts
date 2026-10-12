import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103001_create_vendor_qualifications',
  async up({ builder }) {
    await builder.addField('vendors', {
      name: 'qualificationExpiry',
      type: 'string',
      length: 10,
      nullable: true,
    });
    await builder.addField('vendors', {
      name: 'qualificationId',
      type: 'string',
      length: 64,
      nullable: true,
    });
    await builder.createCollection('vendorQualifications', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const key of ['applicantId', 'createdById', 'vendorId'])
        c.string(key, { length: 64, nullable: false });
      c.string('departmentId', { length: 64, nullable: true });
      c.string('number', { length: 64, nullable: true });
      c.unique('number');
      c.string('operation', { length: 16, nullable: false });
      c.string('name', { length: 255, nullable: false });
      c.string('category', { length: 64, nullable: false });
      for (const key of ['reason', 'cases']) c.text(key, { nullable: false });
      c.bigInt('quoteCents', { nullable: false, defaultValue: 0 });
      for (const key of ['contactName', 'contactPhone', 'contactEmail'])
        c.string(key, { length: 255, nullable: false });
      c.json('attachments', { nullable: false, defaultValue: [] });
      c.string('qualificationExpiry', { length: 10, nullable: true });
      c.integer('sourceVendorVersion', { nullable: true });
      c.integer('committeeVersion', { nullable: true });
      c.json('committeeSnapshot', { nullable: true });
      c.json('ruleSnapshot', { nullable: false, defaultValue: {} });
      c.string('status', { length: 64, nullable: false });
      c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
      c.datetime('statusChangedAt', { nullable: false });
      c.datetime('createdAt', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
      c.index(['applicantId', 'status']);
      c.index(['vendorId', 'status']);
    });
    await builder.createCollection('vendorQualificationBanks', (c) => {
      c.string('requestId', { length: 64, nullable: false });
      c.primary('requestId');
      for (const key of ['bankName', 'bankAccount', 'bankAccountName'])
        c.string(key, { length: 255, nullable: false });
      c.integer('version', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
    });
    await builder.createCollection('vendorCommitteeVersions', (c) => {
      c.integer('version', { nullable: false });
      c.primary('version');
      c.integer('min', { nullable: false });
      c.string('settle', { length: 16, nullable: false });
      c.json('seats', { nullable: false });
      c.string('createdById', { length: 64, nullable: false });
      c.datetime('createdAt', { nullable: false });
    });
    await builder.createCollection('vendorCommitteeAssignments', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.integer('committeeVersion', { nullable: false });
      c.string('seatKey', { length: 64, nullable: false });
      c.string('personId', { length: 64, nullable: true });
      c.integer('version', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
      c.unique(['committeeVersion', 'seatKey']);
    });
    await builder.createCollection(
      'vendorQualificationAttachmentFiles',
      (c) => {
        c.uuid('id').primary().notNull();
        c.string('disk', { length: 255 }).notNull();
        c.text('key').notNull();
        c.text('filename').notNull();
        c.string('ext', { length: 32 }).notNull();
        c.string('mimeType', { length: 255 }).notNull();
        c.bigInt('size').notNull();
        c.datetime('createdAt').notNull();
        c.datetime('updatedAt').notNull();
        c.string('qualificationId', { length: 64 }).notNull();
        c.string('ownerId', { length: 64 }).notNull();
        c.integer('uploadVersion').notNull();
        c.index('qualificationId');
      },
    );
    await builder.createCollection('vendorRemovalConfiguration', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('personId', { length: 64, nullable: true });
      c.integer('version', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
    });
    await builder.createCollection(
      'vendorQualificationCreationCommands',
      (c) => {
        c.string('id', { length: 64, nullable: false });
        c.primary('id');
        c.string('actorId', { length: 64, nullable: false });
        c.string('requestKey', { length: 128, nullable: false });
        c.string('requestId', { length: 64, nullable: false });
        c.text('fingerprint', { nullable: false });
        c.datetime('createdAt', { nullable: false });
        c.unique(['actorId', 'requestKey']);
      },
    );
  },
  async down({ builder }) {
    await builder.dropField('vendors', 'qualificationId');
    await builder.dropField('vendors', 'qualificationExpiry');
    for (const name of [
      'vendorQualificationCreationCommands',
      'vendorRemovalConfiguration',
      'vendorQualificationAttachmentFiles',
      'vendorCommitteeAssignments',
      'vendorCommitteeVersions',
      'vendorQualificationBanks',
      'vendorQualifications',
    ])
      await builder.dropCollection(name);
  },
});
