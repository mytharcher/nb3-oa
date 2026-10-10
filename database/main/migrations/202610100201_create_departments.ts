import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Creates the department tree and its memberships (OA plan 01 §1).
 *
 * Departments and memberships are disabled rather than deleted: permission-set assignments, approval history and the
 * employee archive keep referring to their ids. `managerId` is the department head and `executiveId` the executive in
 * charge (分管副总), both authentication user ids; neither needs to be a member.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610100201_create_departments',

  async up({ builder }) {
    await builder.createCollection('departments', (collection) => {
      collection.string('id', { length: 64, nullable: false });
      collection.primary('id');
      collection.string('title', { length: 255, nullable: false });
      collection.string('code', { length: 64, nullable: true });
      collection.string('parentId', { length: 64, nullable: true });
      collection.string('managerId', { length: 64, nullable: true });
      collection.string('executiveId', { length: 64, nullable: true });
      collection.boolean('active', { nullable: false, defaultValue: true });
      collection.integer('sortOrder', { nullable: false, defaultValue: 0 });
      collection.unique('code', { name: 'uq_departments_code' });
      collection.index('parentId', { name: 'idx_departments_parent' });
      collection.index('managerId', { name: 'idx_departments_manager' });
      collection.index('executiveId', { name: 'idx_departments_executive' });
    });

    await builder.createCollection('departmentMembers', (collection) => {
      collection.string('id', { length: 64, nullable: false });
      collection.primary('id');
      collection.string('departmentId', { length: 64, nullable: false });
      collection.string('userId', { length: 64, nullable: false });
      collection.boolean('primary', { nullable: false, defaultValue: false });
      collection.boolean('active', { nullable: false, defaultValue: true });
      collection.unique(['departmentId', 'userId'], {
        name: 'uq_department_members_department_user',
      });
      collection.index('userId', { name: 'idx_department_members_user' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('departmentMembers');
    await builder.dropCollection('departments');
  },
});

export default migration;
