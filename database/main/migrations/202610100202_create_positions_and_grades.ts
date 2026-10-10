import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Creates positions (岗位) and grades (职级), both flat catalogues (OA plan 01 §3). Rows are disabled rather than
 * deleted because employee archives and history keep referring to them. A grade's `rank` is comparable: higher is
 * more senior, and rule keys such as `grade.managerRank` compare against it.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610100202_create_positions_and_grades',

  async up({ builder }) {
    await builder.createCollection('positions', (collection) => {
      collection.string('id', { length: 64, nullable: false });
      collection.primary('id');
      collection.string('code', { length: 64, nullable: false });
      collection.string('title', { length: 255, nullable: false });
      collection.boolean('active', { nullable: false, defaultValue: true });
      collection.integer('sortOrder', { nullable: false, defaultValue: 0 });
      collection.unique('code', { name: 'uq_positions_code' });
    });

    await builder.createCollection('grades', (collection) => {
      collection.string('id', { length: 64, nullable: false });
      collection.primary('id');
      collection.string('code', { length: 64, nullable: false });
      collection.string('title', { length: 255, nullable: false });
      collection.integer('rank', { nullable: false, defaultValue: 0 });
      collection.boolean('active', { nullable: false, defaultValue: true });
      collection.unique('code', { name: 'uq_grades_code' });
      collection.index('rank', { name: 'idx_grades_rank' });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('grades');
    await builder.dropCollection('positions');
  },
});

export default migration;
