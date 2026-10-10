import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Creates `auditLogs`: sensitive non-approval operations (organisation and employee edits, duty-role membership,
 * rule changes, delegations, administrator interventions, manual ledger adjustments). Rows are only ever inserted.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610100001_create_audit_logs',

  async up({ builder }) {
    await builder.createCollection('auditLogs', (collection) => {
      collection.increments('id');
      collection.string('actorId', { length: 64, nullable: true });
      collection.string('action', { length: 64, nullable: false });
      collection.string('targetType', { length: 64, nullable: false });
      collection.string('targetId', { length: 128, nullable: true });
      collection.json('before', { nullable: true });
      collection.json('after', { nullable: true });
      collection.text('reason', { nullable: true });
      collection.datetime('at', { nullable: false });
      collection.index(['targetType', 'targetId'], {
        name: 'idx_audit_logs_target',
      });
      collection.index('actorId', { name: 'idx_audit_logs_actor' });
      collection.index('at', { name: 'idx_audit_logs_at' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('auditLogs');
  },
});

export default migration;
