import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610101101_add_employee_career_start_date',
  async up({ builder }) {
    // Company hire date cannot establish service with previous employers. Old archives remain unknown.
    await builder.addField('employees', {
      name: 'careerStartDate',
      type: 'date',
      nullable: true,
    });
  },
  async down({ builder }) {
    await builder.dropField('employees', 'careerStartDate');
  },
});
