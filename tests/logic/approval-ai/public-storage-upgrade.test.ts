// @vitest-environment node
import path from 'node:path';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';

const at = new Date('2026-10-31T00:00:00Z');
const originalResult = {
  id: 'saved',
  fingerprint: 'saved-fingerprint',
  definitionId: 'contract-review',
  definitionVersion: 2,
  promptVersion: 1,
  modelService: 'test',
  model: 'chat',
  status: 'succeeded',
  errorCode: null,
  attempts: 1,
  nextAttemptAt: null,
  leaseToken: null,
  leaseExpiresAt: null,
  materials: [{ kind: 'text', ref: 'body', label: 'Body', status: 'read' }],
  result: { findings: [], basis: 'Historic basis' },
  createdAt: at.toISOString(),
  updatedAt: at,
  finishedAt: at.toISOString(),
};
const job = {
  id: 'alice-job',
  taskId: 'task',
  userId: 'alice',
  via: 'assignee',
  definitionId: 'contract-review',
  lifecycle: 'oa.contract',
  recordId: 'record',
  stage: 'legal',
  runId: 'run',
  assigneeId: 'alice',
  status: 'preparing',
  resultId: 'saved',
  resultHistory: ['saved'],
  errorCode: null,
  triggerKind: 'manual',
  requestKey: 'keep-request',
  leaseToken: 'old-worker',
  leaseExpiresAt: new Date('2099-01-01T00:00:00Z'),
  feedback: null,
  feedbackNote: null,
  feedbackAt: null,
  createdAt: at.toISOString(),
  updatedAt: at,
};
const binding = {
  id: 'binding',
  userId: 'alice',
  lifecycle: 'oa.contract',
  recordId: 'record',
  taskId: 'task',
  generatedAt: at.toISOString(),
  conversationId: 'existing-session',
  createdAt: at.toISOString(),
};

describeMigration('202611020002_approval_assistant_public_storage', {
  sources: [
    {
      packageName: 'oa-assistant-upgrade-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../fixtures/approval-ai/public-storage',
      ),
    },
  ],
  async before({ connection }) {
    await connection
      .repository('oaApprovalAiResults')
      .createOne({ values: originalResult });
    await connection.repository('oaApprovalAiResults').createOne({
      values: {
        ...originalResult,
        id: 'running',
        fingerprint: 'running-fingerprint',
        status: 'running',
        result: null,
        finishedAt: null,
        leaseToken: 'old-result-worker',
        leaseExpiresAt: new Date('2099-01-01T00:00:00Z'),
      },
    });
    // Exercise both migration pages without relying on a single small-table read.
    for (let i = 0; i < 201; i++)
      await connection.repository('oaApprovalAiResults').createOne({
        values: {
          ...originalResult,
          id: `history-${i}`,
          fingerprint: `history-${i}`,
        },
      });
    await connection
      .repository('oaApprovalAiTaskReviews')
      .createOne({ values: job });
    await connection.repository('oaApprovalAiTaskReviews').createOne({
      values: {
        ...job,
        id: 'bob-job',
        taskId: 'bob-task',
        userId: 'bob',
        status: 'linked',
        resultId: 'running',
        leaseToken: null,
        leaseExpiresAt: null,
      },
    });
    await connection
      .repository('oaApprovalReviewConversations')
      .createOne({ values: binding });
    await connection.repository('oaApprovalReviewConversations').createOne({
      values: { ...binding, id: 'unknown-intent', conversationId: null },
    });
  },
  async up({ connection }) {
    const results = connection.repository('oaApprovalAiSuggestionResults');
    expect(await results.findOne({ filter: { id: 'saved' } })).toMatchObject({
      id: 'saved',
      fingerprint: originalResult.fingerprint,
      finishedAt: at.toISOString(),
      metadata: {
        modelService: 'test',
        model: 'chat',
        materials: originalResult.materials,
      },
      result: originalResult.result,
    });
    expect(await results.findOne({ filter: { id: 'running' } })).toMatchObject({
      status: 'failed',
      errorCode: 'timeout',
      leaseToken: null,
      attempts: 1,
    });
    expect(await results.count()).toBeGreaterThanOrEqual(203);
    expect(
      await connection
        .repository('oaApprovalAiTaskReviews')
        .findOne({ filter: { id: 'alice-job' } }),
    ).toMatchObject({
      status: 'queued',
      requestKey: 'keep-request',
      resultId: 'saved',
      resultHistory: ['saved'],
      leaseToken: null,
      metadata: {
        userId: 'alice',
        taskId: 'task',
        lifecycle: 'oa.contract',
        recordId: 'record',
      },
    });
    const conversations = connection.repository(
      'oaApprovalAssistantConversations',
    );
    expect(
      await conversations.findOne({ filter: { id: 'binding' } }),
    ).toMatchObject({
      namespace: 'oa.contract',
      revision: at.toISOString(),
      userId: 'alice',
      conversationId: 'existing-session',
    });
    expect(
      await conversations.findOne({ filter: { id: 'unknown-intent' } }),
    ).toMatchObject({ conversationId: null, createdAt: at.toISOString() });
    // Writes made AFTER the upgrade must survive rollback and a subsequent upgrade.
    if (!(await results.findOne({ filter: { id: 'new-result' } })))
      await results.createOne({
        values: {
          id: 'new-result',
          fingerprint: 'new-result',
          definitionId: 'contract-review',
          definitionVersion: 2,
          promptVersion: 1,
          status: 'succeeded',
          errorCode: null,
          attempts: 1,
          nextAttemptAt: null,
          leaseToken: null,
          leaseExpiresAt: null,
          metadata: { modelService: 'test', model: 'new-model', materials: [] },
          result: { findings: [], basis: 'New basis' },
          createdAt: at.toISOString(),
          updatedAt: at,
          finishedAt: at.toISOString(),
        },
      });
    if (!(await conversations.findOne({ filter: { id: 'new-conversation' } })))
      await conversations.createOne({
        values: {
          id: 'new-conversation',
          userId: 'alice',
          namespace: 'oa.contract',
          recordId: 'record',
          taskId: 'task',
          revision: 'new-revision',
          conversationId: 'new-session',
          createdAt: at.toISOString(),
        },
      });
    await connection.repository('oaApprovalAiTaskReviews').updateOne({
      filter: { id: 'bob-job' },
      values: { resultHistory: ['saved', 'new-result'] },
    });
  },
  async down({ connection, expectCollection }) {
    await expectCollection('oaApprovalAiSuggestionResults').not.toExist();
    await expectCollection('oaApprovalAssistantConversations').not.toExist();
    expect(
      await connection
        .repository('oaApprovalAiResults')
        .findOne({ filter: { id: 'new-result' } }),
    ).toMatchObject({ model: 'new-model', result: { basis: 'New basis' } });
    expect(
      await connection
        .repository('oaApprovalReviewConversations')
        .findOne({ filter: { id: 'new-conversation' } }),
    ).toMatchObject({
      lifecycle: 'oa.contract',
      generatedAt: 'new-revision',
      conversationId: 'new-session',
    });
    expect(
      await connection
        .repository('oaApprovalReviewConversations')
        .findOne({ filter: { id: 'unknown-intent' } }),
    ).toMatchObject({ conversationId: null });
    expect(
      await connection
        .repository('oaApprovalAiTaskReviews')
        .findOne({ filter: { id: 'bob-job' } }),
    ).toMatchObject({ resultHistory: ['saved', 'new-result'] });
  },
});
