import { RepositoryError, defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610110003_complete_overtime_expired_minutes',
  irreversible: true,
  async up(context) {
    // Older installations lack this field despite the current creation source.
    // Query cannot validate logical metadata. A transaction-bound repository
    // probes only the field with an impossible scope, reading no business rows.
    try {
      await context
        .repository('overtimeMinuteLots')
        .withPolicy({
          read: {
            fields: ['expiredMinutes'],
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
    // Preserve the original and remaining minutes; no historical expiration
    // amount can be inferred from them because conversions also consume minutes.
    await context.builder.addField('overtimeMinuteLots', {
      name: 'expiredMinutes',
      type: 'integer',
      nullable: false,
      defaultValue: 0,
    });
  },
});
