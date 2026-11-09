import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610310003_approval_review_history',
  async up({ builder }) {
    await builder.alterCollection('oaApprovalAiTaskReviews', (c) => {
      c.json('resultHistory', { nullable: true });
    });
  },
  async down({ builder }) {
    await builder.alterCollection('oaApprovalAiTaskReviews', (c) => {
      c.dropField('resultHistory');
    });
  },
});
