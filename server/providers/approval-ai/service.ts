import { createServiceToken } from '@nocobase/service-provider';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { DatabaseManager } from '@nocobase/db';
import type { ApprovalSuggestions } from '@nocobase/app-plugin-approval/server/assistant';
import type { TaskRow } from '@nocobase/app-plugin-approval/server';
import type { AiActor } from './contract.js';
import type { ProcessOwner, ProcessSdk } from '../process-management/owners.js';
import { approvalTaskBindings } from '../approval-runtime/query-service.js';
import type { ApprovalSuggestionView } from '../../../shared/approval-ai.js';

export class ApprovalAiError extends Error {
  constructor(
    public code:
      'NOT_FOUND' | 'CONFLICT' | 'INVALID_SETTINGS' | 'CONVERSATION_PENDING',
  ) {
    super(code);
  }
}
export async function actorFor(
  authz: AppAuthorization,
  userId: string,
): Promise<AiActor> {
  const principal = { type: 'user', id: userId };
  return {
    userId,
    authz: authz.for({
      principal,
      subjects: [
        { type: 'authenticated', id: '*' },
        ...(await authz.subjects.resolveFor(principal)),
      ],
    }),
  };
}
export async function readPolicy(
  actor: AiActor,
  resource: string,
  collection: string,
) {
  const decision = await actor.authz.authorize({
    resource: { type: 'composite', id: resource },
    action: 'view',
  });
  if (decision.effect === 'deny') return undefined;
  return (
    (
      decision.conditions?.database as
        | Record<string, import('@nocobase/db').RepositoryPolicy | false>
        | undefined
    )?.[collection] || undefined
  );
}
export interface SuggestionTarget {
  lifecycle: string;
  recordId: string;
}
interface Dependencies {
  db: DatabaseManager;
  authz: AppAuthorization;
  owners: readonly ProcessOwner[];
  sdk(owner: ProcessOwner): Promise<ProcessSdk>;
  suggestions: ApprovalSuggestions;
}
/** The built-in recipe owns generation. This adapter owns the real OA reader's access. */
export function createApprovalAiService(d: Dependencies) {
  async function access(target: SuggestionTarget, userId: string) {
    const owner = d.owners.find((item) => item.kind === target.lifecycle);
    if (!owner) throw new ApprovalAiError('NOT_FOUND');
    const actor = await actorFor(d.authz, userId);
    // Process-management's contract resource is for ledger administration; request details use oa.contract.
    const resource =
      owner.kind === 'oa.contract' ? 'oa.contract' : owner.resource;
    const policy = await readPolicy(actor, resource, owner.collection);
    if (!policy) throw new ApprovalAiError('NOT_FOUND');
    const record = await d.db
      .repository(owner.collection)
      .withPolicy(policy)
      .findOne({ filter: { id: target.recordId } });
    if (!record) throw new ApprovalAiError('NOT_FOUND');
    const sdk = await d.sdk(owner);
    const approvals = sdk.approvals;
    // Lifecycle-only owners such as IT repairs have no approval tasks or suggestions.
    if (!approvals) throw new ApprovalAiError('NOT_FOUND');
    const binding = approvalTaskBindings(approvals);
    const approval = binding.approvals.find(
      (item) => item.name === target.lifecycle,
    );
    // Default reports contain the complete frozen snapshot. Never expose it to a partial-field reader.
    if (
      !approval ||
      (approval.options.freeze ?? []).some((field) => !(field in record))
    )
      throw new ApprovalAiError('NOT_FOUND');
    const [tasks, offered] = await sdk.read(() =>
      Promise.all([
        approvals.tasksFor(target.lifecycle, target.recordId),
        approvals.actionsFor(target.lifecycle, target.recordId, {
          id: userId,
        }),
      ]),
    );
    const allowed = new Set(
      offered
        .filter(
          (item) =>
            item.actions.length > 0 &&
            (item.task.assigneeId === userId ||
              item.onBehalfOf === item.task.assigneeId),
        )
        .map((item) => item.task.id),
    );
    // A candidate may see a business detail but cannot request a report before taking the seat.
    return {
      owner,
      tasks: tasks.filter(
        (task) =>
          task.kind === 'decide' &&
          task.role !== 'info' &&
          ['pending', 'claimed'].includes(task.status) &&
          allowed.has(task.id),
      ),
    };
  }
  function view(
    task: TaskRow,
    state: Awaited<ReturnType<ApprovalSuggestions['status']>>,
    t: (key: string) => string,
  ): ApprovalSuggestionView {
    return {
      ...state,
      taskId: task.id,
      title: t('approvalAi.title'),
      stage: task.stage,
      advice: (state.advice as ApprovalSuggestionView['advice']) ?? null,
    };
  }
  async function taskFor(
    target: SuggestionTarget,
    taskId: string,
    userId: string,
  ) {
    const task = (await access(target, userId)).tasks.find(
      (task) => task.id === taskId,
    );
    if (!task) throw new ApprovalAiError('NOT_FOUND');
    return task;
  }
  return {
    async reviews(
      lifecycle: string,
      recordId: string,
      userId: string,
      t: (key: string) => string,
    ): Promise<ApprovalSuggestionView[]> {
      const { tasks } = await access({ lifecycle, recordId }, userId);
      const views = await Promise.all(
        tasks.map(async (task) =>
          view(
            task,
            await d.suggestions.status(task.id, task.assigneeId, userId),
            t,
          ),
        ),
      );
      const current = await access({ lifecycle, recordId }, userId);
      const active = new Set(current.tasks.map((task) => task.id));
      return views.filter((item) => active.has(item.taskId));
    },
    async generate(
      target: SuggestionTarget,
      taskId: string,
      userId: string,
      input: { requestKey: string; previousId?: string | null },
      t: (key: string) => string,
    ) {
      const task = await taskFor(target, taskId, userId);
      const state = await d.suggestions.generate(task.id, task.assigneeId, {
        ...input,
        principalId: userId,
      });
      // Repeat authorization after the external operation; never return stale protected output.
      await taskFor(target, taskId, userId);
      return view(task, state, t);
    },
    async cancel(
      target: SuggestionTarget,
      taskId: string,
      userId: string,
      generationId: string,
      t: (key: string) => string,
    ) {
      const task = await taskFor(target, taskId, userId);
      if (!d.suggestions.cancel) throw new ApprovalAiError('CONFLICT');
      const state = await d.suggestions.cancel(
        task.id,
        task.assigneeId,
        generationId,
        userId,
      );
      await taskFor(target, taskId, userId);
      return view(task, state, t);
    },
    async canSubscribe(taskId: string, userId: string) {
      const target = await d.db
        .repository<{
          subject: string;
          recordId: string;
          sourceType: string;
          sourceKey: string;
        }>('oaTaskCenterTargets')
        .findOne({
          filter: { sourceType: 'approval.task', sourceKey: taskId },
        });
      if (!target) return false;
      try {
        return !!(await taskFor(
          { lifecycle: target.subject, recordId: target.recordId },
          taskId,
          userId,
        ));
      } catch (error) {
        if (error instanceof ApprovalAiError) return false;
        throw error;
      }
    },
  };
}
export type ApprovalAiService = ReturnType<typeof createApprovalAiService>;
export const approvalAiServiceToken =
  createServiceToken<ApprovalAiService>('oa/approval-ai');
