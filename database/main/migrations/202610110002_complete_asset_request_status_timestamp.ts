import { RepositoryError, defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610110002_complete_asset_request_status_timestamp',
  async up(context) {
    try {
      await context
        .repository('assetRequests')
        .withPolicy({
          read: {
            fields: ['statusChangedAt'],
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
      name: 'statusChangedAt',
      type: 'datetimeTz',
      nullable: true,
    });
    // Old rows recorded only their last update, the best preserved timestamp.
    // New lifecycle transitions record their actual status-change timestamp.
    const rows = await context.query
      .selectFrom('assetRequests')
      .select(['id', 'updatedAt'])
      .execute();
    for (const row of rows) {
      await context.query
        .updateTable('assetRequests')
        .set({ statusChangedAt: row.updatedAt })
        .where('id', '=', row.id)
        .where('statusChangedAt', 'is', null)
        .execute();
    }
    await context.builder.alterField('assetRequests', 'statusChangedAt', {
      type: 'datetimeTz',
      nullable: false,
    });
  },
  async down() {
    // The creation migration now owns this field too. Preserve lifecycle evidence.
  },
});
