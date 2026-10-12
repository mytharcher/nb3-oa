import { RepositoryError, defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610110001_complete_asset_request_handling_reason',
  async up(context) {
    // Earlier installations executed the asset migration before this field was included.
    // The transaction-bound repository validates logical fields even on empty
    // tables. Probe only this field, without loading any business records.
    try {
      await context
        .repository('assetRequests')
        .withPolicy({
          read: {
            fields: ['handlingReason'],
            scope: (f) => f.and([f.string('id').eq(''), f.string('id').ne('')]),
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
        error.code !== 'FIELD_NOT_FOUND'
      )
        throw error;
    }
    await context.builder.addField('assetRequests', {
      name: 'handlingReason',
      type: 'text',
      nullable: true,
    });
  },
  async down() {
    // Forward-only reconciliation: the original creation migration also owns this
    // field, and removing it would lose handling evidence and break current grants.
  },
});
