import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610310001_legacy_review_conversations',
  async up({ builder, query }) {
    await builder.createCollection('oaApprovalReviewConversations', (c) => {
      c.string('id', { length: 64, nullable: true });
      for (const name of ['userId', 'lifecycle', 'recordId', 'taskId'])
        c.string(name, { length: 128, nullable: false });
      c.string('generatedAt', { length: 64, nullable: false });
      c.string('conversationId', { length: 128, nullable: true });
      c.datetimeTz('createdAt', { nullable: false });
      c.unique('conversationId');
      c.index(['userId', 'lifecycle', 'recordId', 'taskId', 'createdAt']);
    });
    // The legacy table has no usable ID key: seed through migration Query.
    await query
      .insertInto('oaApprovalReviewConversations')
      .values({
        id: 'kept-binding',
        userId: 'legacy-user',
        lifecycle: 'oa.contract',
        recordId: 'legacy-record',
        taskId: 'legacy-task',
        generatedAt: '2026-10-31T00:00:00Z',
        conversationId: 'kept-session',
        createdAt: '2026-10-31T00:00:00Z',
      })
      .execute();
  },
  async down({ builder }) {
    await builder.dropCollection('oaApprovalReviewConversations');
  },
});
