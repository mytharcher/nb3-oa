import {
  defineMigration,
  type MigrationContext,
  type RepositoryRecord,
} from '@nocobase/db';

// Stop all OA request-serving and worker processes before applying or rolling back.
// IDs, request keys, successful results and unknown conversation intents stay intact.
const oldResults = 'oaApprovalAiResults';
const newResults = 'oaApprovalAiSuggestionResults';
const oldConversations = 'oaApprovalReviewConversations';
const newConversations = 'oaApprovalAssistantConversations';
const jobs = 'oaApprovalAiTaskReviews';
function rowId(row: RepositoryRecord): string {
  if (typeof row.id !== 'string')
    throw new Error('Invalid assistant record ID');
  return row.id;
}
async function each(
  context: MigrationContext,
  collection: string,
  visit: (row: RepositoryRecord) => Promise<void>,
) {
  let offset = 0;
  for (;;) {
    const rows = await context.repository(collection).findMany({
      offset,
      sort: (s) => s.field('id').asc(),
      limit: 200,
    });
    if (!rows.length) return;
    for (const row of rows) await visit(row);
    offset += rows.length;
  }
}
async function save(
  context: MigrationContext,
  collection: string,
  row: RepositoryRecord,
) {
  const repository = context.repository(collection);
  const id = rowId(row);
  if (await repository.findOne({ filter: { id } }))
    await repository.updateOne({ filter: { id }, values: row });
  else await repository.createOne({ values: row });
}
async function recover(context: MigrationContext, results: string) {
  await context.repository(jobs).updateMany({
    filter: { status: 'preparing' },
    values: {
      status: 'queued',
      leaseToken: null,
      leaseExpiresAt: null,
    },
  });
  await context.repository(results).updateMany({
    filter: { status: 'running' },
    values: {
      status: 'failed',
      errorCode: 'timeout',
      nextAttemptAt: new Date(),
      leaseToken: null,
      leaseExpiresAt: null,
    },
  });
}
export default defineMigration({
  name: '202611020002_approval_assistant_public_storage',
  async up(context) {
    const { builder } = context;
    await builder.alterCollection(jobs, (c) => {
      c.json('metadata', { nullable: true });
    });
    await builder.createCollection(newResults, (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('fingerprint', { length: 64, nullable: false });
      c.unique('fingerprint');
      c.string('definitionId', { length: 128, nullable: false });
      c.integer('definitionVersion', { nullable: false });
      c.integer('promptVersion', { nullable: false });
      c.json('metadata', { nullable: false });
      c.string('status', { length: 32, nullable: false });
      c.string('errorCode', { length: 64, nullable: true });
      c.integer('attempts', { nullable: false });
      c.datetimeTz('nextAttemptAt', { nullable: true });
      c.string('leaseToken', { length: 64, nullable: true });
      c.datetimeTz('leaseExpiresAt', { nullable: true });
      c.json('result', { nullable: true });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.datetimeTz('finishedAt', { nullable: true });
      c.index(['status', 'leaseExpiresAt']);
      c.index(['status', 'nextAttemptAt']);
    });
    await builder.createCollection(newConversations, (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('userId', { length: 128, nullable: false });
      for (const key of ['namespace', 'recordId', 'taskId'])
        c.string(key, { length: 128, nullable: false });
      c.string('revision', { length: 64, nullable: false });
      c.string('conversationId', { length: 128, nullable: true });
      c.unique('conversationId');
      c.datetimeTz('createdAt', { nullable: false });
      c.index(['userId', 'namespace', 'recordId', 'taskId', 'createdAt']);
    });
    await each(
      context,
      oldResults,
      async ({ modelService, model, materials, ...row }) => {
        await save(context, newResults, {
          ...row,
          metadata: { modelService, model, materials },
        });
      },
    );
    await each(
      context,
      oldConversations,
      async ({ lifecycle, generatedAt, ...row }) => {
        await save(context, newConversations, {
          ...row,
          namespace: lifecycle,
          revision: generatedAt,
        });
      },
    );
    await each(context, jobs, async (row) => {
      await context.repository(jobs).updateOne({
        filter: { id: rowId(row) },
        values: {
          metadata: {
            taskId: row.taskId,
            userId: row.userId,
            definitionId: row.definitionId,
            lifecycle: row.lifecycle,
            recordId: row.recordId,
          },
        },
      });
    });
    // Fence already-running legacy results; process shutdown is still required.
    await recover(context, newResults);
    await context.repository(oldResults).updateMany({
      filter: { status: 'running' },
      values: {
        status: 'failed',
        errorCode: 'timeout',
        nextAttemptAt: null,
        leaseToken: null,
        leaseExpiresAt: null,
      },
    });
  },
  async down(context) {
    await each(context, newResults, async ({ metadata, ...row }) => {
      const values = metadata as {
        modelService: string;
        model: string;
        materials: unknown[];
      };
      await save(context, oldResults, {
        ...row,
        modelService: values.modelService,
        model: values.model,
        materials: values.materials,
      });
    });
    await each(
      context,
      newConversations,
      async ({ namespace, revision, ...row }) => {
        await save(context, oldConversations, {
          ...row,
          lifecycle: namespace,
          generatedAt: revision,
        });
      },
    );
    await recover(context, oldResults);
    await context.builder.dropCollection(newConversations);
    await context.builder.dropCollection(newResults);
    await context.builder.alterCollection(jobs, (c) => {
      c.dropField('metadata');
    });
  },
});
