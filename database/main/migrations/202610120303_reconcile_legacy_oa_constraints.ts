import { defineMigration, RepositoryError } from '@nocobase/db';

// Preserve historical values while aligning early physical constraints with the
// registered contracts. No old migration is edited or replayed.
export default defineMigration({
  name: '202610120303_reconcile_legacy_oa_constraints',
  irreversible: true,
  async up(context) {
    const { builder } = context;
    for (const field of ['allocatedDelta', 'heldDelta', 'usedDelta'])
      await builder.alterField('budgetLedger', field, {
        type: 'bigInt',
        nullable: false,
      });
    await builder.alterField('expenseAuthorizations', 'departmentId', {
      type: 'string',
      length: 64,
      nullable: true,
    });
    await builder.alterField('expenseAuthorizations', 'year', {
      type: 'integer',
      nullable: true,
    });
    await builder.alterField('expenseAuthorizations', 'subject', {
      type: 'string',
      length: 64,
      nullable: true,
    });
    await builder.alterField('printTemplateCommands', 'receipt', {
      type: 'json',
      nullable: true,
    });
    try {
      // Probe logical metadata without reading records; missing-field validation
      // occurs before SQL, leaving the migration's PostgreSQL transaction usable.
      await context
        .repository('vendorQualifications')
        .withPolicy({
          read: {
            fields: ['stateEnteredAt'],
            scope: (f) => f.and([f.string('id').eq(''), f.string('id').ne('')]),
          },
          create: false,
          update: false,
          delete: false,
        })
        .findMany({ limit: 1 });
    } catch (error) {
      if (error instanceof RepositoryError && error.code === 'FIELD_NOT_FOUND')
        return;
      throw error;
    }
    // Retain the old timestamp as archival evidence. New writes use statusChangedAt.
    await builder.alterField('vendorQualifications', 'stateEnteredAt', {
      type: 'datetime',
      nullable: true,
    });
  },
});
