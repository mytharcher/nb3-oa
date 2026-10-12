import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610104002_salary_grade_publication_keys',
  async up({ builder }) {
    await builder.addField('salaryGradeRevisions', {
      name: 'publicationKey',
      type: 'string',
      length: 128,
      nullable: true,
    });
    await builder.addField('salaryGradeRevisions', {
      name: 'publicationHash',
      type: 'string',
      length: 64,
      nullable: true,
    });
  },
  async down({ builder }) {
    await builder.dropField('salaryGradeRevisions', 'publicationHash');
    await builder.dropField('salaryGradeRevisions', 'publicationKey');
  },
});
