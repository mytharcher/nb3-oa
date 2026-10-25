import { defineAppApproval as defineApproval } from '../approval-runtime/task-center.js';
import { z } from 'zod';
import {
  outputsOf,
  approvalState,
  stagesFor,
  approve,
  reject,
  returnTo,
  commentAction,
  readAction,
  appointAction,
  reassignAction,
  claimAction,
  releaseAction,
  assignAction,
  ccAction,
  defaultAssignmentRules,
  excludeApplicant,
  configureAction,
  transferAction,
  definePeopleScope,
  allActivePeople,
  hashOf,
  freezeOf,
  type TaskRow,
} from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection } from '@nocobase/db';
import type { OaApprovalDirectory } from '../approval-directory/contract.js';
import type { CalendarService } from '../platform/index.js';
import type { createOaApprovalOperations } from '../approval-directory/operations.js';
import { SEAL_KIND, type SealRequest, type SealState } from './contract.js';
import {
  sealExecutionPolicy,
  completeSeal,
  unableSeal,
  completeElectronicSeal,
} from './handling.js';
export const SEAL_INPUT_FIELDS = [
  'contractId',
  'fileIds',
  'sealType',
  'copies',
  'executionMode',
  'external',
  'returnDueAt',
  'purpose',
  'contact',
] as const;
export const SEAL_FROZEN_FIELDS = [
  ...SEAL_INPUT_FIELDS.filter((f) => f !== 'contact'),
  'contractVersion',
  'contractTextVersionId',
  'departmentId',
] as const;
export const sealFingerprint = (r: SealRequest) =>
  hashOf(
    freezeOf(
      r,
      r.executionMode === 'electronic'
        ? SEAL_FROZEN_FIELDS
        : SEAL_FROZEN_FIELDS.filter((field) => field !== 'executionMode'),
    ),
  );
export interface SealTypes {
  record: SealRequest;
  state: SealState;
  services: {
    directory: OaApprovalDirectory;
    connection: DatabaseConnection;
    resumeEligible?: boolean;
  };
}
type Definition = Parameters<typeof defineApproval<SealTypes>>[0];
type Transition = Definition['transitions'][string];
export interface SealGraphHost {
  electronicAllowed: (id: string) => boolean;
  calendar: CalendarService;
  operations: ReturnType<typeof createOaApprovalOperations>;
  submit(
    record: SealRequest,
    actorId: string,
    tx: DatabaseConnection,
    now: Date,
  ): Promise<Partial<SealRequest>>;
  validateEdit(record: SealRequest, tx: DatabaseConnection): Promise<void>;
  register(
    record: SealRequest,
    actorId: string,
    tx: DatabaseConnection,
    now: Date,
  ): Promise<{ ledgerId: string | null; electronicEvidenceId?: string }>;
  returnSeal(
    record: SealRequest,
    actorId: string,
    reason: string,
    tx: DatabaseConnection,
    now: Date,
  ): Promise<void>;
  audit: NonNullable<Transition['onTransition']>;
  notify(
    task: TaskRow,
    reason: string,
    directory: OaApprovalDirectory,
  ): Promise<void>;
  onEnter?: Definition['onEnter'];
}
export function sealGraph(host: SealGraphHost) {
  const stage = stagesFor<SealTypes>(),
    owner = ({
      record,
      actor,
    }: {
      record: SealRequest;
      actor: { id: string };
    }) => record.applicantId === actor.id;
  const review = {
    actions: [
      approve(),
      reject({ reason: 'required' }),
      returnTo({ targets: ['revision'], reason: 'required' }),
      commentAction,
      readAction,
      appointAction,
      reassignAction,
      ccAction,
      ...host.operations,
    ],
    onEmpty: 'hold' as const,
    reuse: 'unchanged' as const,
    remindAfterHours: 24,
    dueAfterHours: 48,
    onDue: 'escalate' as const,
  };
  const active = allActivePeople(),
    sameKeeper = definePeopleScope({
      search: (c, q) => active.search(c, q),
      contains: (c, id) =>
        c.directory.isActive(id) && c.directory.hasRole(id, 'sealKeeper'),
    });
  const transferKeeper = configureAction(transferAction, {
    recipients: sameKeeper,
  });
  const execution = () =>
    stage.custom(
      sealExecutionPolicy,
      {},
      {
        qualification: 'sealKeeper',
        pools: [
          {
            key: 'keeper',
            claimable: true,
            candidates: ({ services }) =>
              services.directory.roleMembers('sealKeeper'),
          },
        ],
        onEmpty: 'hold',
        remindAfterHours: 24,
        actions: [
          claimAction,
          releaseAction,
          assignAction,
          transferKeeper,
          commentAction,
          readAction,
          appointAction,
          reassignAction,
          completeSeal,
          completeElectronicSeal(host.electronicAllowed),
          unableSeal,
          ...host.operations.filter(
            (a) => ('name' in a ? a.name : a.action.name) === 'urge',
          ),
        ],
        outputs: {
          fields: {
            sealId: z.string().max(64).nullable(),
            actualCopies: z.number().int().positive().nullable(),
            sealedAt: z.string().nullable(),
            borrowedAt: z.string().nullable(),
            returnedAt: z.string().nullable(),
            exceptionReason: z.string().nullable(),
          },
          writes: {
            sealId: 'sealId',
            actualCopies: 'actualCopies',
            sealedAt: 'sealedAt',
            borrowedAt: 'borrowedAt',
            returnedAt: 'returnedAt',
            exceptionReason: 'exceptionReason',
          },
        },
      },
    );
  function next(
    from: 'head' | 'legal' | 'financeManager' | 'gm',
    record: SealRequest,
    actorId: string,
    directory: OaApprovalDirectory,
  ): 'legal' | 'financeManager' | 'gm' | 'stamping' {
    if (
      from === 'head' &&
      (record.sealType === 'contract' || record.contractId)
    )
      return 'legal';
    if (['head', 'legal'].includes(from) && record.sealType === 'finance')
      return 'financeManager';
    if (
      from !== 'gm' &&
      (record.sealType === 'legalRepresentative' || record.external) &&
      directory.uniqueRoleMember('gm') !== actorId
    )
      return 'gm';
    return 'stamping';
  }
  const approved = (
    from: 'head' | 'legal' | 'financeManager' | 'gm',
  ): Transition => ({
    from,
    to: ['legal', 'financeManager', 'gm', 'stamping'],
    approvalOutcome: 'approved',
    route: ({ record, actor, services }) =>
      next(from, record, actor.id, services.directory),
    set: ({ record, actor, services, now }) =>
      next(from, record, actor.id, services.directory) === 'stamping'
        ? {
            approvedAt: now.toISOString(),
            approvedFingerprint: sealFingerprint(record),
          }
        : {},
    onTransition: host.audit,
  });
  return defineApproval<SealTypes>({
    name: SEAL_KIND,
    collection: 'sealRequests',
    initial: 'draft',
    version: 1,
    applicant: (r) => r.applicantId,
    directory: (s) => s.directory,
    calendar: () => host.calendar.approvalCalendar(),
    freeze: SEAL_FROZEN_FIELDS,
    adminRole: 'approval.admin',
    assignment: defaultAssignmentRules.map((rule) =>
      rule.name === excludeApplicant.name
        ? {
            name: rule.name,
            apply: (c) =>
              ['stamping', 'returning', 'returnException'].includes(c.stage)
                ? { kind: 'keep' as const }
                : rule.apply(c),
          }
        : rule,
    ),
    afterEnd: [readAction],
    notify: ({ task, reason, services }) =>
      host.notify(task, reason, services.directory),
    onEnter: host.onEnter,
    create: {
      guard: ({ values, actor, services }) =>
        values.applicantId === actor.id &&
        services.directory.isActive(actor.id),
    },
    states: [
      'draft',
      'revision',
      'exception',
      approvalState(
        'head',
        stage.single({
          ...review,
          assignee: ({ record, services }) =>
            services.directory.headOf(record.applicantId),
        }),
      ),
      // Every current role member has a separate place: one approve succeeds, every member must reject.
      // A single SDK pool has one place and cannot implement this required business OR semantics.
      approvalState(
        'legal',
        stage.any({
          ...review,
          qualification: 'legal',
          assignees: ({ services }) => services.directory.roleMembers('legal'),
          covers: [
            'executionMode',
            'contractId',
            'contractVersion',
            'contractTextVersionId',
            'fileIds',
            'copies',
          ],
        }),
      ),
      approvalState(
        'financeManager',
        stage.any({
          ...review,
          qualification: 'financeManager',
          assignees: ({ services }) =>
            services.directory.roleMembers('financeManager'),
          covers: [
            'executionMode',
            'contractId',
            'contractVersion',
            'contractTextVersionId',
            'fileIds',
          ],
        }),
      ),
      approvalState(
        'gm',
        stage.single({
          ...review,
          qualification: 'gm',
          assignee: ({ services }) => services.directory.uniqueRoleMember('gm'),
          covers: ['executionMode', 'sealType', 'external', 'returnDueAt'],
        }),
      ),
      approvalState('stamping', execution()),
      approvalState('returning', execution()),
      approvalState('returnException', execution()),
      ...(
        [
          'completed',
          'administrativelyClosed',
          'rejected',
          'withdrawn',
          'terminated',
        ] as const
      ).map((name) => ({ name, final: true })),
    ],
    transitions: {
      edit: {
        from: ['draft', 'revision', 'exception'],
        to: ['draft', 'revision', 'exception'],
        guard: owner,
        route: ({ record }) => record.status,
        accept: SEAL_INPUT_FIELDS,
        set: async ({ record, services, input }) => {
          const edited = {
            ...record,
            ...Object.fromEntries(
              SEAL_INPUT_FIELDS.filter((k) => k in input).map((k) => [
                k,
                input[k],
              ]),
            ),
          };
          await host.validateEdit(edited, services.connection);
          return {};
        },
        onTransition: host.audit,
      },
      submit: {
        from: ['draft', 'revision', 'exception'],
        to: ['head', 'stamping'],
        guard: owner,
        route: ({ record, services }) =>
          record.status === 'exception' &&
          record.approvedFingerprint === sealFingerprint(record) &&
          services.resumeEligible === true
            ? 'stamping'
            : 'head',
        set: ({ record, actor, services, now }) =>
          host.submit(record, actor.id, services.connection, now),
        onTransition: host.audit,
      },
      headApproved: approved('head'),
      legalApproved: approved('legal'),
      financeApproved: approved('financeManager'),
      gmApproved: approved('gm'),
      stamped: {
        from: 'stamping',
        to: ['completed', 'returning'],
        approvalOutcome: 'completed',
        route: ({ record }) => (record.external ? 'returning' : 'completed'),
        set: ({ record, actor, services, now, input }) =>
          host.register(
            { ...record, ...outputsOf({ input }) },
            actor.id,
            services.connection,
            now,
          ),
        onTransition: host.audit,
      },
      stampUnavailable: {
        from: 'stamping',
        to: 'exception',
        approvalOutcome: 'unavailable',
        onTransition: host.audit,
      },
      returnedPhysical: {
        from: ['returning', 'returnException'],
        to: 'completed',
        approvalOutcome: 'completed',
        set: async ({ record, actor, input, services, now }) => {
          await host.returnSeal(
            { ...record, ...outputsOf({ input }) },
            actor.id,
            typeof input.reason === 'string'
              ? input.reason
              : 'Actual physical return',
            services.connection,
            now,
          );
          return {};
        },
        onTransition: host.audit,
      },
      returnUnavailable: {
        from: ['returning', 'returnException'],
        to: 'returnException',
        approvalOutcome: 'unavailable',
        onTransition: host.audit,
      },
      rejected: {
        from: ['head', 'legal', 'financeManager', 'gm'],
        to: 'rejected',
        approvalOutcome: 'rejected',
        onTransition: host.audit,
      },
      returned: {
        from: ['head', 'legal', 'financeManager', 'gm'],
        to: 'revision',
        approvalOutcome: 'returned',
        onTransition: host.audit,
      },
      withdraw: {
        from: [
          'draft',
          'revision',
          'head',
          'legal',
          'financeManager',
          'gm',
          'exception',
        ],
        to: 'withdrawn',
        guard: owner,
        onTransition: host.audit,
      },
      terminate: {
        from: [
          'revision',
          'head',
          'legal',
          'financeManager',
          'gm',
          'stamping',
          'exception',
        ],
        to: 'terminated',
        guard: ({ actor, services, input }) =>
          services.directory.hasRole(actor.id, 'admin') &&
          typeof input.reason === 'string' &&
          !!input.reason.trim(),
        onTransition: host.audit,
      },
      retry: {
        from: 'exception',
        to: 'stamping',
        guard: ({ actor, services, record, input }) =>
          services.directory.hasRole(actor.id, 'admin') &&
          services.resumeEligible === true &&
          record.approvedFingerprint === sealFingerprint(record) &&
          typeof input.reason === 'string' &&
          !!input.reason.trim(),
        onTransition: host.audit,
      },
      forceComplete: {
        from: ['stamping', 'returning', 'returnException', 'exception'],
        to: 'administrativelyClosed',
        guard: ({ actor, services, input }) =>
          services.directory.hasRole(actor.id, 'admin') &&
          typeof input.reason === 'string' &&
          !!input.reason.trim(),
        set: ({ input }) => ({
          administrativeReason:
            typeof input.reason === 'string' ? input.reason : null,
        }),
        onTransition: host.audit,
      },
    },
  });
}
