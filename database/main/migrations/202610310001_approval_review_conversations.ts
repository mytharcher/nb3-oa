import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610310001_approval_review_conversations',
  async up({ builder }) {
    await builder.createCollection('oaApprovalReviewConversations', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      for (const name of ['userId', 'lifecycle', 'recordId', 'taskId'])
        c.string(name, { length: 128, nullable: false });
      c.string('generatedAt', { length: 64, nullable: false });
      c.string('conversationId', { length: 128, nullable: true });
      c.datetimeTz('createdAt', { nullable: false });
      c.unique('conversationId');
      c.index(['userId', 'lifecycle', 'recordId', 'taskId', 'createdAt']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('oaApprovalReviewConversations');
  },
});
