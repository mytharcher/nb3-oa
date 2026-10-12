import { RepositoryError, defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610110009_complete_reimbursement_attachment_collection',
  irreversible: true,
  async up(context) {
    // Older installations ran the reimbursement migration before the file
    // collection was included. Probe metadata without loading any file records.
    try {
      await context
        .repository('reimbursementAttachmentFiles')
        .withPolicy({
          read: {
            fields: ['id'],
            scope: (f) =>
              f.and([
                f.string('id').eq('00000000-0000-0000-0000-000000000000'),
                f.string('id').ne('00000000-0000-0000-0000-000000000000'),
              ]),
          },
          create: false,
          update: false,
          delete: false,
        })
        .findMany({ limit: 1 });
      return;
    } catch (error) {
      if (
        !(error instanceof RepositoryError) ||
        error.code !== 'COLLECTION_NOT_FOUND'
      )
        throw error;
    }
    await context.builder.createCollection(
      'reimbursementAttachmentFiles',
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
        c.string('reimbursementId', { length: 64 }).notNull();
        c.string('ownerId', { length: 64 }).notNull();
        c.integer('uploadVersion').notNull();
        c.index('reimbursementId');
      },
    );
  },
});
