import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610260001_approval_ai',
  async up({ builder }) {
    await builder.createCollection('oaApprovalAiSettings', (c) => {
      c.string('definitionId', { length: 128, nullable: false });
      c.primary('definitionId');
      c.boolean('enabled', { nullable: false, defaultValue: false });
      c.string('modelService', { length: 128, nullable: true });
      c.string('model', { length: 255, nullable: true });
      c.json('basis', { nullable: false });
      c.integer('timeoutSeconds', { nullable: false, defaultValue: 120 });
      c.integer('version', { nullable: false, defaultValue: 0 });
      c.string('updatedBy', { length: 255, nullable: true });
      c.datetimeTz('updatedAt', { nullable: false });
    });
    await builder.createCollection('oaApprovalAiResults', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('fingerprint', { length: 64, nullable: false });
      c.unique('fingerprint');
      c.string('definitionId', { length: 128, nullable: false });
      c.integer('definitionVersion', { nullable: false });
      c.integer('promptVersion', { nullable: false });
      c.string('modelService', { length: 128, nullable: false });
      c.string('model', { length: 255, nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.string('errorCode', { length: 64, nullable: true });
      c.integer('attempts', { nullable: false });
      c.datetimeTz('nextAttemptAt', { nullable: true });
      c.string('leaseToken', { length: 64, nullable: true });
      c.datetimeTz('leaseExpiresAt', { nullable: true });
      c.json('materials', { nullable: false });
      c.json('result', { nullable: true });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.datetimeTz('finishedAt', { nullable: true });
      c.index(['status', 'leaseExpiresAt']);
      c.index(['status', 'nextAttemptAt']);
    });
    await builder.createCollection('oaApprovalAiTaskReviews', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('taskId', { length: 128, nullable: false });
      c.string('userId', { length: 255, nullable: false });
      c.unique(['taskId', 'userId']);
      c.string('via', { length: 16, nullable: false });
      c.string('definitionId', { length: 128, nullable: false });
      c.string('lifecycle', { length: 128, nullable: false });
      c.string('recordId', { length: 128, nullable: false });
      c.string('stage', { length: 128, nullable: false });
      c.string('runId', { length: 128, nullable: false });
      c.string('assigneeId', { length: 255, nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.string('resultId', { length: 64, nullable: true });
      c.string('errorCode', { length: 64, nullable: true });
      c.string('triggerKind', { length: 16, nullable: false });
      c.string('requestKey', { length: 128, nullable: true });
      c.string('leaseToken', { length: 64, nullable: true });
      c.datetimeTz('leaseExpiresAt', { nullable: true });
      c.string('feedback', { length: 32, nullable: true });
      c.text('feedbackNote', { nullable: true });
      c.datetimeTz('feedbackAt', { nullable: true });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.index(['userId', 'lifecycle', 'recordId']);
      c.index(['status', 'leaseExpiresAt']);
      c.index('resultId');
    });
  },
  async down({ builder }) {
    for (const name of [
      'oaApprovalAiTaskReviews',
      'oaApprovalAiResults',
      'oaApprovalAiSettings',
    ])
      await builder.dropCollection(name);
  },
});
