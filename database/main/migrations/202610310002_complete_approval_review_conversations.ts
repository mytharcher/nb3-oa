import { defineMigration } from '@nocobase/db';

// A development install may have executed the first revision without an ID
// constraint. Repair that installed schema without replaying the create migration
// or replacing existing conversations. Fresh installations already have a PK.
export default defineMigration({
  name: '202610310002_complete_approval_review_conversations',
  irreversible: true,
  async up({ builder }) {
    const collection = await builder.getCollection(
      'oaApprovalReviewConversations',
    );
    if (!collection)
      throw new Error('Approval review conversation collection is missing.');
    const hasUniqueId = collection.constraints?.some(
      (constraint) =>
        (constraint.type === 'primary' || constraint.type === 'unique') &&
        constraint.fields.length === 1 &&
        constraint.fields[0] === 'id' &&
        !('predicate' in constraint && constraint.predicate),
    );
    if (!hasUniqueId) {
      await builder.addConstraint('oaApprovalReviewConversations', {
        type: 'unique',
        fields: ['id'],
        mode: 'index',
        name: 'uq_oa_approval_review_conversations_id',
      });
    }
  },
});
