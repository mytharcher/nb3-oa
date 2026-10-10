import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Creates the duty-role pool (职能角色池) and its members (OA plan 01 §3). A duty role is keyed by the stable code
 * approval resolution looks up (`gm`, `finance`, `cashier`, …). What a role may do is decided only by permission sets
 * assigned to the `org.dutyRole` subject type; there is deliberately no role-to-permission table. Memberships are
 * disabled rather than deleted, so a re-add keeps the same row.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610100203_create_duty_roles',

  async up({ builder }) {
    await builder.createCollection('dutyRoles', (collection) => {
      collection.string('code', { length: 64, nullable: false });
      collection.primary('code');
      collection.string('title', { length: 255, nullable: false });
      collection.text('description', { nullable: true });
      collection.boolean('active', { nullable: false, defaultValue: true });
      collection.integer('sortOrder', { nullable: false, defaultValue: 0 });
    });

    await builder.createCollection('dutyRoleMembers', (collection) => {
      collection.string('id', { length: 64, nullable: false });
      collection.primary('id');
      collection.string('dutyRoleCode', { length: 64, nullable: false });
      collection.string('userId', { length: 64, nullable: false });
      collection.boolean('active', { nullable: false, defaultValue: true });
      collection.unique(['dutyRoleCode', 'userId'], {
        name: 'uq_duty_role_members_role_user',
      });
      collection.index('userId', { name: 'idx_duty_role_members_user' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('dutyRoleMembers');
    await builder.dropCollection('dutyRoles');
  },
});

export default migration;
