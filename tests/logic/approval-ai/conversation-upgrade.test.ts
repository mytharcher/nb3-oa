// @vitest-environment node
import path from 'node:path';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610310002_complete_approval_review_conversations', {
  sources: [
    {
      packageName: 'approval-review-conversation-upgrade',
      directory: path.resolve(
        import.meta.dirname,
        '../../fixtures/approval-ai/legacy-conversations',
      ),
    },
  ],
  reversible: false,
  async before({ connection }) {
    await expect(
      connection.repository('oaApprovalReviewConversations').createOne({
        values: {
          id: 'failed-pending',
          userId: 'legacy-user',
          lifecycle: 'oa.contract',
          recordId: 'legacy-record',
          taskId: 'legacy-task',
          generatedAt: '2026-10-31T00:00:00Z',
          conversationId: null,
          createdAt: new Date(),
        },
      }),
    ).rejects.toThrow(
      'complete, non-null primary or unconditional unique selector',
    );
    expect(
      await connection.repository('oaApprovalReviewConversations').count(),
    ).toBe(1);
  },
  async up({ connection, expectCollection }) {
    await expectCollection('oaApprovalReviewConversations').toHaveIndex(
      ['id'],
      { unique: true },
    );
    const rows = connection.repository('oaApprovalReviewConversations');
    expect(
      await rows.findOne({ filter: { id: 'kept-binding' } }),
    ).toMatchObject({ conversationId: 'kept-session' });
    // Reproduce the failed operation: a new binding must be creatable while its
    // plugin conversation ID is still null, then updatable by its own ID.
    await rows.createOne({
      values: {
        id: 'pending-binding',
        userId: 'legacy-user',
        lifecycle: 'oa.contract',
        recordId: 'legacy-record',
        taskId: 'legacy-task',
        generatedAt: '2026-10-31T00:00:00Z',
        conversationId: null,
        createdAt: new Date(),
      },
    });
    await rows.updateOne({
      filter: { id: 'pending-binding' },
      values: { conversationId: 'new-session' },
    });
    expect(
      await rows.findOne({ filter: { id: 'pending-binding' } }),
    ).toMatchObject({ conversationId: 'new-session' });
    expect(await rows.count()).toBe(2);
  },
});
