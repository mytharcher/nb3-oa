import { RepositoryError, defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610110008_complete_reimbursement_draft_fields',
  irreversible: true,
  async up(context) {
    // Reconcile installations that ran the original creation migration before
    // these fields were added. Keep fresh installations and existing facts intact.
    const fields = [
      {
        name: 'lastSubmittedTotalCents',
        type: 'bigInt' as const,
        nullable: true,
      },
      {
        name: 'financeCorrectionLines',
        type: 'json' as const,
        nullable: false,
        defaultValue: [],
      },
      {
        name: 'bindingCaptured',
        type: 'boolean' as const,
        nullable: false,
        defaultValue: false,
      },
      {
        name: 'boundAuthorizationId',
        type: 'string' as const,
        length: 64,
        nullable: true,
      },
      {
        name: 'boundLoanId',
        type: 'string' as const,
        length: 64,
        nullable: true,
      },
      {
        name: 'debtHeldCents',
        type: 'bigInt' as const,
        nullable: false,
        defaultValue: 0,
      },
      {
        name: 'debtHoldRecorded',
        type: 'boolean' as const,
        nullable: false,
        defaultValue: false,
      },
    ];
    const missing = [];
    for (const field of fields) {
      try {
        await context
          .repository('reimbursementRequests')
          .withPolicy({
            read: {
              fields: [field.name],
              scope: (f) =>
                f.and([f.string('id').eq(''), f.string('id').ne('')]),
            },
            create: false,
            update: false,
            delete: false,
          })
          .findMany({ limit: 1 });
      } catch (error) {
        if (
          !(error instanceof RepositoryError) ||
          error.code !== 'FIELD_NOT_FOUND'
        )
          throw error;
        missing.push(field);
      }
    }
    if (!missing.length) return;
    // Draft defaults cannot reconstruct historical submitted amounts, frozen
    // links or actual debt holds. Refuse to invent those facts for submitted rows.
    const submitted = await context.query
      .selectFrom('reimbursementRequests')
      .select('id')
      .where('status', '!=', 'draft')
      .limit(1)
      .execute();
    if (submitted.length)
      throw new Error(
        'Legacy submitted reimbursements require reconciliation of submission and debt-hold facts before adding missing fields.',
      );
    for (const field of missing)
      await context.builder.addField('reimbursementRequests', field);
  },
});
