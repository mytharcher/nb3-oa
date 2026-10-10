import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610100601_create_approval_delegations',
  async up({ builder }) {
    await builder.createCollection('approvalDelegations', (collection) => {
      collection.string('id', { length: 64, nullable: false });
      collection.string('principalId', { length: 64, nullable: false });
      collection.string('delegateId', { length: 64, nullable: false });
      collection.json('scope', { nullable: false });
      collection.datetimeTz('from', { nullable: false });
      collection.datetimeTz('to', { nullable: false });
      collection.string('source', { length: 16, nullable: false });
      collection.string('sourceApplication', { length: 128, nullable: true });
      collection.boolean('active', { nullable: false, defaultValue: true });
      collection.datetimeTz('createdAt', { nullable: false });
      collection.datetimeTz('updatedAt', { nullable: false });
      collection.primary('id');
      collection.index(['principalId', 'active'], {
        name: 'idx_approval_delegations_principal',
      });
      collection.unique('sourceApplication', {
        name: 'uq_approval_delegations_source_application',
      });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('approvalDelegations');
  },
});
export default migration;
