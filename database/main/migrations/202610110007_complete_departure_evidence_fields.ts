import { RepositoryError, defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610110007_complete_departure_evidence_fields',
  irreversible: true,
  async up(context) {
    // Existing installations recorded the original migrations before these
    // fields were included. Probe logical metadata without reading business
    // rows: Query alone cannot establish the Repository field contract.
    for (const field of [
      { name: 'settlementDate', type: 'string' as const, length: 10 },
      { name: 'settlementNote', type: 'text' as const },
      { name: 'cancellationReason', type: 'text' as const },
    ]) {
      try {
        await context
          .repository('departureRequests')
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
        continue;
      } catch (error) {
        if (
          !(error instanceof RepositoryError) ||
          error.code !== 'FIELD_NOT_FOUND'
        )
          throw error;
      }
      await context.builder.addField('departureRequests', {
        ...field,
        nullable: true,
      });
    }
  },
});
