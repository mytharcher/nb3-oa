import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104502_add_work_item_confirmation_owner',
  irreversible: true,
  async up({ builder, query }) {
    await builder.addField('workItems', {
      name: 'confirmationOwnerUserId',
      type: 'string',
      length: 64,
      nullable: true,
    });
    // Public QueryAdapter set() takes values, not a Kysely expression callback.
    // Backfill groups by their original creator without loading task content or rewriting history.
    const creators = await query
      .selectFrom('workItems')
      .select('creatorUserId')
      .distinct()
      .where('requiresConfirmation', '=', true)
      .execute();
    for (const row of creators)
      await query
        .updateTable('workItems')
        .set({ confirmationOwnerUserId: row.creatorUserId })
        .where('requiresConfirmation', '=', true)
        .where('creatorUserId', '=', row.creatorUserId)
        .execute();
    await builder.addIndex('workItems', {
      fields: ['confirmationOwnerUserId', 'status'],
    });
  },
});
