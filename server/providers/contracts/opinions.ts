import { createHash } from 'node:crypto';
import {
  approve,
  defineApprovalAction,
  offered,
  unavailable,
  placeOfTask,
  type ActionContext,
  type ApprovalService,
  type DecisionInput,
  type Effect,
} from '@nocobase/app-plugin-approval/server';
import type { AuditService } from '../audit/index.js';
import { CONTRACT_KIND, type ContractServices } from './types.js';
import { commandFingerprint } from './ledger.js';
const coverage: Record<string, readonly string[]> = {
  legal: ['textVersionId', 'attachments', 'startsOn', 'endsOn', 'counterparty'],
  finance: ['amountCents', 'paymentTerms'],
};
const digest = (
  record: Readonly<Record<string, unknown>>,
  fields: readonly string[],
) =>
  createHash('sha256')
    .update(commandFingerprint(fields.map((key) => [key, record[key]])))
    .digest('hex');
/** Only the original legal task may contribute its own legally classified fact. */
export function contractApprove() {
  const native = approve();
  return defineApprovalAction<DecisionInput, undefined>({
    ...native,
    async available(context) {
      const result = await native.available(context);
      if (!result.ok) return result;
      const place =
        context.task?.depth === 0 && placeOfTask(context.places, context.task);
      const options = { ...result.options };
      if (place && place.pool === 'legal') {
        const outputs = options.outputs;
        if (
          outputs &&
          typeof outputs === 'object' &&
          !Array.isArray(outputs) &&
          Array.isArray(outputs.fields)
        )
          options.outputs = {
            ...outputs,
            fields: outputs.fields.map((f) =>
              f && typeof f === 'object' && !Array.isArray(f)
                ? { ...f, required: true }
                : f,
            ),
          };
      } else delete options.outputs;
      return offered(options);
    },
    async validate(input, context) {
      const problem = await native.validate?.(input, context);
      if (problem) return problem;
      const place =
        context.task?.depth === 0 && placeOfTask(context.places, context.task);
      if (
        place &&
        ['legal', 'finance'].includes(place.pool ?? '') &&
        !context.directory.hasRole(context.task.assigneeId, place.pool!)
      )
        return 'The original seat assignee no longer qualifies.';
      if (place && place.pool === 'legal')
        return typeof input.data?.nonStandard === 'boolean'
          ? null
          : 'An original legal opinion must classify nonStandard.';
      return Object.hasOwn(input.data ?? {}, 'nonStandard')
        ? 'Only an original legal place may classify nonStandard.'
        : null;
    },
  });
}
export function reusableOpinionAction(
  approvals: () => ApprovalService,
  audit: AuditService,
) {
  async function reusable(context: ActionContext) {
    if (!['legalFinance', 'standardFinance'].includes(context.stage)) return [];
    const history = await approvals().runViewsFor(
      CONTRACT_KIND,
      String(context.record.id),
    );
    const facts: {
      currentTaskId: string;
      sourceTaskId: string;
      sourceRunId: string;
      reviewerId: string;
      pool: string;
      data: { nonStandard?: boolean };
      coverageHash: string;
    }[] = [];
    const services = context.services as unknown as ContractServices;
    for (const place of context.places) {
      const fields = coverage[place.pool ?? ''];
      if (!fields) continue;
      if (
        context.stay.some(
          (t) =>
            t.order === place.order &&
            t.depth === 0 &&
            t.status === 'completed',
        )
      )
        continue;
      for (const previous of [...history].reverse()) {
        if (
          previous.run.id === context.run.id ||
          previous.run.status !== 'returned' ||
          previous.run.version !== context.run.version ||
          previous.run.settings.approvalGraph !==
            context.run.settings.approvalGraph
        )
          continue;
        if (
          !previous.stages.some((s) => s.key === context.stage) ||
          previous.run.content.standardTemplate !==
            context.record.standardTemplate ||
          previous.run.content.operation !== context.record.operation ||
          previous.run.content.contractId !== context.record.contractId ||
          previous.run.content.baseVersion !== context.record.baseVersion ||
          commandFingerprint(previous.run.content.ruleSnapshot) !==
            commandFingerprint(context.record.ruleSnapshot) ||
          digest(previous.run.content, fields) !==
            digest(context.record, fields)
        )
          continue;
        const order = previous.stages
          .find((s) => s.key === context.stage)
          ?.pools.findIndex((p) => p.key === place.pool);
        const source = previous.tasks.find(
          (t) =>
            t.stage === context.stage &&
            t.order === order &&
            t.depth === 0 &&
            t.kind === 'decide' &&
            t.status === 'completed' &&
            t.answer === 'approve' &&
            t.actorId === t.assigneeId,
        );
        if (
          !source ||
          !services.directory.isActive(source.assigneeId) ||
          !services.directory.hasRole(source.assigneeId, place.pool!) ||
          source.assigneeId === context.applicantId
        )
          continue;
        const current = context.stay.find(
          (t) =>
            t.order === place.order &&
            t.depth === 0 &&
            t.assigneeId === source.assigneeId &&
            t.status === 'candidate',
        );
        if (
          !current ||
          !place.plannedFor.includes(source.assigneeId) ||
          context.stay.some(
            (t) =>
              t.order !== place.order &&
              t.assigneeId === source.assigneeId &&
              ['claimed', 'completed'].includes(t.status),
          ) ||
          (place.pool === 'legal' &&
            typeof source.data?.nonStandard !== 'boolean')
        )
          continue;
        facts.push({
          currentTaskId: current.id,
          sourceTaskId: source.id,
          sourceRunId: previous.run.id,
          reviewerId: source.assigneeId,
          pool: place.pool!,
          data:
            place.pool === 'legal'
              ? { nonStandard: source.data!.nonStandard as boolean }
              : {},
          coverageHash: digest(context.record, fields),
        });
        break;
      }
    }
    return facts;
  }
  return defineApprovalAction<Record<string, never>, undefined>({
    name: 'reuseOpinions',
    scope: 'run',
    actors: ['applicant'],
    guards: ['runOpen', 'contentCurrent', 'activeActor'],
    available: async (context) =>
      (await reusable(context)).length
        ? offered()
        : unavailable(
            'NOT_ALLOWED',
            'No trusted unchanged opinions are reusable.',
          ),
    validate: (input) =>
      Object.keys(input).length
        ? 'No caller-supplied reuse facts are accepted.'
        : null,
    async plan(_input, context): Promise<readonly Effect[]> {
      const facts = await reusable(context);
      const services = context.services as unknown as ContractServices;
      if (!services.connection)
        throw new Error('Opinion reuse requires its caller transaction.');
      if (facts.length)
        await audit.record(
          {
            actorId: context.actor.id,
            action: 'contract.reuseOpinions',
            targetType: 'contractRequests',
            targetId: String(context.record.id),
            before: null,
            after: { runId: context.run.id, facts },
            reason:
              'Trusted reuse of unchanged original opinions; no new reviewer votes.',
          },
          services.connection,
        );
      return facts.flatMap(
        (fact) =>
          [
            { type: 'status', task: fact.currentTaskId, status: 'claimed' },
            {
              type: 'answer',
              task: fact.currentTaskId,
              answer: 'approve',
              data: fact.data,
              detail: {
                evidenceKind: 'reusedOpinion',
                sourceTaskId: fact.sourceTaskId,
                sourceRunId: fact.sourceRunId,
                reviewerId: fact.reviewerId,
                coverageHash: fact.coverageHash,
              },
              comment:
                'Reused unchanged original opinion; this is not a new reviewer vote.',
            },
          ] as Effect[],
      );
    },
  });
}
