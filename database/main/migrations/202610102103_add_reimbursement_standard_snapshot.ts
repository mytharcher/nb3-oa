import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610102103_add_reimbursement_standard_snapshot',
  async up({ builder }) {
    await builder.addField('reimbursementRequests', {
      name: 'standardSnapshot',
      type: 'json',
      nullable: true,
    });
  },
  async down({ builder }) {
    await builder.dropField('reimbursementRequests', 'standardSnapshot');
  },
});
