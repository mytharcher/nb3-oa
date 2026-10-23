import { defineAppApproval as defineApproval } from '../approval-runtime/task-center.js';
import { z } from 'zod';
import {
  approvalState,
  stagesFor,
  reject,
  returnTo,
  claimAction,
  commentAction,
  readAction,
  appointAction,
  reassignAction,
  outputsOf,
  defineApprovalAction,
  placeOfTask,
  allActivePeople,
  type ActionContext,
  type ApprovalAction,
  type ActionUse,
  type ApplicationApprovalOptions,
  type TaskRow,
} from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection } from '@nocobase/db';
import type { JsonObject } from '@nocobase/lifecycle';
import type { CalendarService } from '../platform/index.js';
import {
  CONTRACT_KIND,
  freezeFields,
  type ContractRequest,
  type ContractState,
  type ContractTypes,
} from './types.js';
import { ruleCents } from './validation.js';
import { contractApprove } from './opinions.js';
export interface ContractGraphHost {
  calendar: CalendarService;
  actions: readonly (ApprovalAction | ActionUse)[];
  reuseAction: ApprovalAction;
  submit(
    record: ContractRequest,
    actorId: string,
    tx: DatabaseConnection,
    now: Date,
  ): Promise<Partial<ContractRequest>>;
  edit(
    record: ContractRequest,
    input: JsonObject,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<Partial<ContractRequest>>;
  number(record: ContractRequest, tx: DatabaseConnection): Promise<string>;
  publish(
    record: ContractRequest,
    actorId: string,
    tx: DatabaseConnection,
    historical?: boolean,
  ): Promise<void>;
  discard(
    record: ContractRequest,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<void>;
  result?(record: ContractRequest, state: string, key: string): Promise<void>;
  autoReuse(record: ContractRequest, key: string): Promise<void>;
  taskNotice?(task: TaskRow, reason: string): Promise<void>;
}
export function contractGraph(host: ContractGraphHost) {
  const stage = stagesFor<ContractTypes>();
  const owner = ({
    record,
    actor,
  }: {
    record: ContractRequest;
    actor: { id: string };
  }) => actor.id === record.applicantId;
  const guardedClaim = defineApprovalAction({
    ...claimAction,
    async validate(input, context) {
      const problem = await claimAction.validate?.(input, context);
      if (problem) return problem;
      return context.task &&
        context.stay.some(
          (t) =>
            t.order !== context.task!.order &&
            t.assigneeId === context.task!.assigneeId &&
            ['claimed', 'completed'].includes(t.status),
        )
        ? 'Different seats must be claimed by different people.'
        : null;
    },
  });
  const people = async (
    context: ActionContext<undefined>,
    query: { search?: string; offset?: number; limit?: number },
  ) => {
    const page = await allActivePeople().search(context, query);
    const pools = context.task
      ? [placeOfTask(context.places, context.task)?.pool]
      : context.unassigned.map((p) => p.pool);
    return {
      people: page.people.filter(
        (person) =>
          person !== context.applicantId &&
          (!pools.some((pool) => pool && ['legal', 'finance'].includes(pool)) ||
            pools.some(
              (pool) => pool && context.directory.hasRole(person, pool),
            )) &&
          !context.stay.some(
            (t) =>
              t.assigneeId === person &&
              ['claimed', 'completed'].includes(t.status),
          ),
      ),
      nextOffset: page.nextOffset,
    };
  };
  const guardedAppoint = defineApprovalAction({
    ...appointAction,
    people,
    async validate(input, context) {
      const problem = await appointAction.validate?.(input, context);
      if (problem) return problem;
      const place = context.unassigned.find((p) => p.placeKey === input.place);
      return place?.pool &&
        ['legal', 'finance'].includes(place.pool) &&
        !context.directory.hasRole(input.to ?? '', place.pool)
        ? 'The appointed reviewer must qualify for this original pool.'
        : null;
    },
  });
  const guardedReassign = defineApprovalAction({
    ...reassignAction,
    people,
    async validate(input, context) {
      const problem = await reassignAction.validate?.(input, context);
      if (problem) return problem;
      const place = context.task && placeOfTask(context.places, context.task);
      return place?.pool &&
        ['legal', 'finance'].includes(place.pool) &&
        (input.override ||
          !context.directory.hasRole(input.to ?? '', place.pool))
        ? 'The replacement must retain the original pool qualification.'
        : null;
    },
  });
  const actions = [
    contractApprove(),
    reject({ reason: 'required' }),
    returnTo({ targets: ['revision'] }),
    commentAction,
    readAction,
    guardedAppoint,
    guardedReassign,
    ...host.actions,
  ];
  const freeze = [...freezeFields];
  const common = {
    actions,
    covers: freeze,
    onEmpty: 'hold' as const,
    reuse: () => false,
    remindAfterHours: 24,
    dueAfterHours: 48,
    onDue: 'escalate' as const,
  };
  const phases: ContractState[] = [
    'head',
    'legalFinance',
    'standardFinance',
    'executive',
    'gm',
  ];
  const active: ContractState[] = ['draft', 'revision', ...phases];
  const transitions: Record<
    string,
    NonNullable<
      ApplicationApprovalOptions<ContractTypes>['transitions']
    >[string]
  > = {
    edit: {
      from: ['draft', 'revision'],
      to: ['draft', 'revision'],
      guard: owner,
      route: ({ record }) => record.status,
      set: ({ record, input, actor, services }) =>
        host.edit(record, input, actor.id, services.connection!),
    },
    rebase: {
      from: 'revision',
      to: 'revision',
      guard: owner,
      set: ({ input }) => ({
        baseVersion:
          typeof input.baseVersion === 'number' ? input.baseVersion : -1,
        nonStandard: null,
      }),
    },
    submit: {
      from: ['draft', 'revision'],
      to: 'head',
      guard: owner,
      set: ({ record, actor, services, now }) =>
        host.submit(record, actor.id, services.connection!, now),
    },
    historicalEntry: {
      from: 'draft',
      to: 'approved',
      guard: ({ record, actor, services }) =>
        record.operation === 'new' &&
        owner({ record, actor }) &&
        services.directory.hasRole(actor.id, 'legal'),
      set: async ({ record, services }) => ({
        number: await host.number(record, services.connection!),
      }),
      onTransition: ({ record, actor, tx }) =>
        host.publish(record, actor.id, tx.handle as DatabaseConnection, true),
    },
    headApproved: {
      from: 'head',
      to: ['legalFinance', 'standardFinance'],
      approvalOutcome: 'approved',
      route: ({ record }) =>
        record.operation === 'terminate' || !record.standardTemplate
          ? 'legalFinance'
          : 'standardFinance',
    },
    legalFinanceApproved: {
      from: 'legalFinance',
      to: ['executive', 'gm', 'approved'],
      approvalOutcome: 'approved',
      guard: (context) => typeof outputsOf(context).nonStandard === 'boolean',
      route: (context) => {
        const record = context.record;
        if (record.operation === 'terminate') return 'approved';
        if (record.amountCents > ruleCents(record.ruleSnapshot['spend.vp']))
          return 'executive';
        return record.amountCents >
          ruleCents(record.ruleSnapshot['contract.gm']) ||
          outputsOf(context).nonStandard === true
          ? 'gm'
          : 'approved';
      },
    },
    standardFinanceApproved: {
      from: 'standardFinance',
      to: ['executive', 'gm', 'approved'],
      approvalOutcome: 'approved',
      route: ({ record }) =>
        record.amountCents > ruleCents(record.ruleSnapshot['spend.vp'])
          ? 'executive'
          : record.amountCents > ruleCents(record.ruleSnapshot['contract.gm'])
            ? 'gm'
            : 'approved',
    },
    executiveApproved: {
      from: 'executive',
      to: ['gm', 'approved'],
      approvalOutcome: 'approved',
      route: ({ record }) =>
        record.amountCents > ruleCents(record.ruleSnapshot['contract.gm']) ||
        record.nonStandard === true
          ? 'gm'
          : 'approved',
    },
    gmApproved: { from: 'gm', to: 'approved', approvalOutcome: 'approved' },
    withdraw: {
      from: active,
      to: 'withdrawn',
      guard: owner,
      onTransition: ({ record, actor, tx }) =>
        host.discard(record, actor.id, tx.handle as DatabaseConnection),
    },
    terminate: {
      from: active,
      to: 'terminated',
      guard: ({ actor, services, input }) =>
        services.directory.hasRole(actor.id, 'approval.admin') &&
        typeof input.reason === 'string' &&
        input.reason.trim().length > 0,
      onTransition: ({ record, actor, tx, input }) =>
        host.discard(
          {
            ...record,
            reason: typeof input.reason === 'string' ? input.reason : '',
          },
          actor.id,
          tx.handle as DatabaseConnection,
        ),
    },
  };
  for (const phase of phases) {
    transitions[`${phase}Rejected`] = {
      from: phase,
      to: 'rejected',
      approvalOutcome: 'rejected',
      onTransition: ({ record, actor, tx }) =>
        host.discard(record, actor.id, tx.handle as DatabaseConnection),
    };
    transitions[`${phase}Returned`] = {
      from: phase,
      to: 'revision',
      approvalOutcome: 'returned',
    };
  }
  // Publication is a transition hook: its CAS/audit failure rolls back the final answer.
  for (const name of [
    'legalFinanceApproved',
    'standardFinanceApproved',
    'executiveApproved',
    'gmApproved',
  ]) {
    const previous = transitions[name];
    transitions[name] = {
      ...previous,
      set: async ({ record, to, services }) =>
        to === 'approved'
          ? { number: await host.number(record, services.connection!) }
          : {},
      onTransition: ({ record, to, actor, tx }) =>
        to === 'approved'
          ? host.publish(record, actor.id, tx.handle as DatabaseConnection)
          : Promise.resolve(),
    };
  }
  return defineApproval<ContractTypes>({
    name: CONTRACT_KIND,
    collection: 'contractRequests',
    initial: 'draft',
    version: 1,
    applicant: (r) => r.applicantId,
    directory: (s) => s.directory,
    adminRole: 'approval.admin',
    calendar: () => host.calendar.approvalCalendar(),
    freeze,
    afterEnd: [readAction],
    assignment: [
      {
        name: 'contract.distinctReviewers',
        apply(context) {
          if (
            (context.spec.depth ?? 0) === 0 &&
            context.spec.role === 'member' &&
            ['legalFinance', 'standardFinance'].includes(context.stage)
          ) {
            const role =
              context.stage === 'legalFinance' &&
              (context.spec.order ?? context.replacing?.order) === 0
                ? 'legal'
                : 'finance';
            if (!context.directory.hasRole(context.spec.assigneeId, role))
              return {
                kind: 'refuse',
                code: 'NOT_QUALIFIED',
                message: 'The reviewer does not qualify for the original pool.',
              };
          }
          if (context.spec.assigneeId === context.applicantId)
            return {
              kind: 'refuse',
              code: 'NOT_ALLOWED',
              message: 'The applicant cannot review their own contract.',
            };
          if (
            context.stage === 'legalFinance' &&
            context.stay.some(
              (t) =>
                t.id !== context.replacing?.id &&
                t.assigneeId === context.spec.assigneeId &&
                t.order !== context.spec.order &&
                ['claimed', 'completed', 'pending'].includes(t.status),
            )
          )
            return {
              kind: 'refuse',
              code: 'NOT_ALLOWED',
              message: 'Legal and finance require different reviewers.',
            };
          return { kind: 'keep' };
        },
      },
    ],
    notify: ({ task, reason }) =>
      host.taskNotice?.(task, reason) ?? Promise.resolve(),
    onEnter: {
      ...Object.fromEntries(
        ['approved', 'rejected', 'withdrawn', 'terminated', 'revision'].map(
          (state) => [
            state,
            [
              {
                name: `contract.result.${state}`,
                retry: { attempts: 5, backoffMs: 1000 },
                run: ({
                  record,
                  idempotencyKey,
                }: {
                  record: ContractRequest;
                  idempotencyKey: string;
                }) =>
                  host.result?.(record, state, idempotencyKey) ??
                  Promise.resolve(),
              },
            ],
          ],
        ),
      ),
      legalFinance: [
        {
          name: 'contract.reuseOpinions',
          retry: { attempts: 5, backoffMs: 1000 },
          run: ({ record, idempotencyKey }) =>
            host.autoReuse(record, idempotencyKey),
        },
      ],
      standardFinance: [
        {
          name: 'contract.reuseOpinions.standardFinance',
          retry: { attempts: 5, backoffMs: 1000 },
          run: ({ record, idempotencyKey }) =>
            host.autoReuse(record, idempotencyKey),
        },
      ],
    },
    create: { guard: ({ actor, values }) => values.applicantId === actor.id },
    states: [
      'draft',
      'revision',
      approvalState(
        'head',
        stage.single({
          ...common,
          assignee: ({ services, applicantId }) =>
            services.directory.headOf(applicantId),
        }),
      ),
      approvalState(
        'legalFinance',
        stage.all({
          ...common,
          actions: [guardedClaim, ...actions, host.reuseAction],
          pools: [
            {
              key: 'legal',
              claimable: true,
              candidates: ({ services, applicantId }) =>
                services.directory
                  .roleMembers('legal')
                  .filter((id) => id !== applicantId),
            },
            {
              key: 'finance',
              claimable: true,
              candidates: ({ services, applicantId }) =>
                services.directory
                  .roleMembers('finance')
                  .filter(
                    (id) =>
                      id !== applicantId &&
                      !services.directory.roleMembers('legal').includes(id),
                  ),
            },
          ],
          outputs: {
            fields: { nonStandard: z.boolean() },
            merge(tasks): JsonObject {
              const trusted = tasks.filter(
                (t) =>
                  t.answer === 'approve' &&
                  typeof t.data.nonStandard === 'boolean',
              );
              if (trusted.length > 1)
                throw new Error('Multiple legal output sources are invalid.');
              return trusted.length
                ? { nonStandard: trusted[0].data.nonStandard }
                : {};
            },
            writes: { nonStandard: 'nonStandard' },
          },
        }),
      ),
      approvalState(
        'standardFinance',
        stage.all({
          ...common,
          actions: [guardedClaim, ...actions, host.reuseAction],
          pools: [
            {
              key: 'finance',
              claimable: true,
              candidates: ({ services, applicantId }) =>
                services.directory
                  .roleMembers('finance')
                  .filter((id) => id !== applicantId),
            },
          ],
        }),
      ),
      approvalState(
        'executive',
        stage.single({
          ...common,
          assignee: ({ services, applicantId }) =>
            services.directory.executiveOf(applicantId),
        }),
      ),
      approvalState(
        'gm',
        stage.single({
          ...common,
          assignee: ({ services }) => services.directory.uniqueRoleMember('gm'),
        }),
      ),
      ...(['approved', 'rejected', 'withdrawn', 'terminated'] as const).map(
        (name) => ({ name, final: true }),
      ),
    ],
    transitions,
  });
}
