import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104001_create_salary_grade_tables',
  async up({ builder }) {
    await builder.createCollection('salaryGradeCurrent', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.integer('version', { nullable: false });
      c.string('revisionId', { length: 64 });
    });
    await builder.createCollection('salaryGradeRevisions', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.integer('version', { nullable: false });
      c.unique('version');
      c.json('bands', { nullable: false });
      c.string('createdById', { length: 64, nullable: false });
      c.text('reason', { nullable: false });
      c.datetime('createdAt', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('salaryGradeRevisions');
    await builder.dropCollection('salaryGradeCurrent');
  },
});
