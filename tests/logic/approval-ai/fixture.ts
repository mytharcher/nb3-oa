import type {
  Approval,
  TaskRow,
  RunRow,
} from '@nocobase/app-plugin-approval/server';
import type { ReviewDefinition } from '../../../server/providers/approval-ai/contract.js';
export function task(
  id = 'task',
  userId = 'alice',
  status: TaskRow['status'] = 'pending',
): TaskRow {
  return {
    id,
    source: 'proof.approvalAi',
    lifecycle: 'proof.approvalAi',
    recordId: 'record',
    runId: 'run',
    stage: 'review',
    enteredVersion: 1,
    kind: 'decide',
    role: 'member',
    mode: null,
    gates: null,
    depth: 0,
    order: 1,
    subject: null,
    assigneeId: userId,
    via: 'plan',
    note: null,
    previousTaskId: null,
    status,
    answers: null,
    answer: null,
    comment: null,
    data: null,
    actorId: null,
    contentHash: null,
    requestId: null,
    createdAt: '2026-10-26T00:00:00Z',
    claimedAt: null,
    remindAt: null,
    dueAt: null,
    closedAt: null,
    closeReason: null,
    closedVia: null,
    createdByAction: null,
    closedByAction: null,
    seq: null,
    rowVersion: 1,
  };
}
export function definition(): ReviewDefinition {
  return {
    id: 'proof.review',
    version: 1,
    titleKey: 'review',
    approval: {
      lifecycle: { name: 'proof.approvalAi' },
      isStage: (stage: string) => stage === 'review',
      options: { freeze: ['amount', 'text'] },
    } as unknown as Approval<never>,
    stages: ['review'],
    fields: ['amount', 'text'],
    basis: [],
    checks: [
      {
        id: 'amount',
        titleKey: 'amount',
        instruction: 'Check amount',
        basis: [],
      },
    ],
    host: {
      task: async () => null,
      tasks: async () => [],
      openTasks: async () => [],
      run: async () =>
        ({
          id: 'run',
          applicantId: 'requester',
          content: { amount: 100, text: 'contract' },
        }) as unknown as RunRow,
      canRead: async () => true,
      content: async (_actor, _task, content) => ({ ...content }),
      gather: async () => [],
    },
  };
}
export function output() {
  return {
    findings: [
      {
        checkId: 'amount',
        verdict: 'conforms',
        summary: 'Amount checked.',
        evidence: [{ kind: 'field', ref: 'amount' }],
      },
    ],
    basis: 'Supplied materials',
  };
}
