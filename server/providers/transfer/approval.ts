import {
  approvalState,
  defineApproval,
  stagesFor,
  approve,
  reject,
  returnTo,
  readAction,
  commentAction,
  appointAction,
  reassignAction,
  ccAction,
  type ApprovalDirectory,
  type ApprovalCalendar,
  type TaskRow,
} from '@nocobase/app-plugin-approval/server';
import type { LifecycleRecord } from '@nocobase/lifecycle';
import type { DatabaseConnection } from '@nocobase/db';
import type { TransferSnapshot } from './submission.js';
import type { createOaApprovalOperations } from '../approval-directory/operations.js';
export const TRANSFER_LIFECYCLE = 'oa.transfer';
export interface TransferRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  employeeId: string;
  kinds: ('transfer' | 'salaryChange' | 'promotion')[];
  targetDepartmentId: string;
  targetPositionId: string;
  targetGradeId: string;
  targetManagerId: string | null;
  sourceAccountId: string | null;
  targetAccountId: string | null;
  effectiveDate: string;
  reason: string;
  privateSalaryRevisionId: string;
  snapshot: TransferSnapshot | null;
  cancelConfirmerId: string | null;
  cancellationReason: string | null;
  executionFailureCode: string | null;
  status: string;
  lifecycleVersion: number;
}
export interface TransferApprovalServices {
  directory: ApprovalDirectory;
  connection: DatabaseConnection;
  prepared?: TransferSnapshot;
  preparedSalaryRevisionId?: string;
}
interface Types {
  record: TransferRecord;
  state:
    | 'draft'
    | 'revision'
    | 'manager'
    | 'sourceHead'
    | 'targetHead'
    | 'hr'
    | 'executive'
    | 'gm'
    | 'pendingEffective'
    | 'cancellationReview'
    | 'completed'
    | 'cancelled'
    | 'rejected'
    | 'withdrawn'
    | 'terminated';
  services: TransferApprovalServices;
}
export interface TransferApprovalHooks {
  calendar(): ApprovalCalendar;
  operations?: ReturnType<typeof createOaApprovalOperations>;
  notify?(
    task: TaskRow,
    reason: string,
    services: TransferApprovalServices,
  ): Promise<void>;
  result?(input: {
    recordId: string;
    applicantId: string;
    state: string;
    transitionId: string;
  }): Promise<void>;
  authorizeCreate(
    values: Readonly<Record<string, unknown>>,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<boolean>;
  authorizeEdit(
    record: TransferRecord,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<boolean>;
  checkpoint(
    record: TransferRecord,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<void>;
  allocate(
    record: TransferRecord,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<void>;
  release(
    record: TransferRecord,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<void>;
  execute(record: TransferRecord, tx: DatabaseConnection): Promise<void>;
  cancellationConfirmer(
    record: TransferRecord,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<string>;
  authorizeCancellation(
    record: TransferRecord,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<boolean>;
  authorizeReviewEdit(
    record: TransferRecord,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<boolean>;
}
export function createTransferApproval(h: TransferApprovalHooks) {
  const stages = stagesFor<Types>();
  const settings = {
    actions: [
      ...(h.operations ?? []),
      approve(),
      reject({ reason: 'required' }),
      returnTo({ targets: ['revision'], reason: 'required' }),
      commentAction,
      appointAction,
      reassignAction,
      ccAction,
      readAction,
    ],
    onEmpty: 'hold' as const,
    remindAfterHours: 24,
    dueAfterHours: 48,
    onDue: 'escalate' as const,
  };
  const reviews = [
    'manager',
    'sourceHead',
    'targetHead',
    'hr',
    'executive',
    'gm',
  ] as const;
  const fields = [
    'employeeId',
    'kinds',
    'targetDepartmentId',
    'targetPositionId',
    'targetGradeId',
    'targetManagerId',
    'sourceAccountId',
    'targetAccountId',
    'effectiveDate',
    'reason',
    'privateSalaryRevisionId',
  ];
  return defineApproval<Types>({
    name: TRANSFER_LIFECYCLE,
    collection: 'transferRequests',
    initial: 'draft',
    version: 1,
    applicant: (r) => r.applicantId,
    directory: (s) => s.directory,
    calendar: () => h.calendar(),
    freeze: [...fields, 'snapshot'],
    adminRole: 'approval.admin',
    afterEnd: [readAction],
    notify: ({ task, reason, services }) => h.notify?.(task, reason, services),
    onEnter: Object.fromEntries(
      [
        'revision',
        'pendingEffective',
        'cancellationReview',
        'completed',
        'cancelled',
        'rejected',
        'withdrawn',
        'terminated',
      ].map((state) => [
        state,
        [
          {
            name: `transfer.notify.${state}`,
            retry: { attempts: 5, backoffMs: 1000 },
            run: ({
              record,
              idempotencyKey,
            }: {
              record: TransferRecord;
              idempotencyKey: string;
            }) =>
              h.result?.({
                recordId: record.id,
                applicantId: record.applicantId,
                state,
                transitionId: idempotencyKey,
              }),
          },
        ],
      ]),
    ),
    states: [
      'draft',
      'revision',
      approvalState(
        'manager',
        stages.single({
          ...settings,
          assignee: ({ record }) =>
            record.snapshot?.directManagerId ?? undefined,
        }),
      ),
      approvalState(
        'sourceHead',
        stages.single({
          ...settings,
          assignee: ({ record }) => record.snapshot?.sourceHeadId ?? undefined,
        }),
      ),
      approvalState(
        'targetHead',
        stages.single({
          ...settings,
          assignee: ({ record }) => record.snapshot?.targetHeadId ?? undefined,
        }),
      ),
      approvalState(
        'hr',
        stages.any({
          ...settings,
          assignees: ({ record }) => record.snapshot?.hrIds ?? [],
        }),
      ),
      approvalState(
        'executive',
        stages.single({
          ...settings,
          assignee: ({ record }) => record.snapshot?.executiveId ?? undefined,
        }),
      ),
      approvalState(
        'gm',
        stages.single({
          ...settings,
          assignee: ({ record }) => record.snapshot?.gmId ?? undefined,
        }),
      ),
      'pendingEffective',
      approvalState(
        'cancellationReview',
        stages.single({
          actions: [
            approve(),
            reject({ reason: 'required' }),
            commentAction,
            reassignAction,
            readAction,
          ],
          onEmpty: 'hold',
          assignee: ({ record }) => record.cancelConfirmerId ?? undefined,
        }),
      ),
      ...(
        [
          'completed',
          'cancelled',
          'rejected',
          'withdrawn',
          'terminated',
        ] as const
      ).map((name) => ({ name, final: true })),
    ],
    create: {
      guard: ({ values, actor, services }) =>
        values.applicantId === actor.id &&
        h.authorizeCreate(values, actor.id, services.connection),
    },
    transitions: {
      edit: {
        from: ['draft', 'revision'],
        to: ['draft', 'revision'],
        route: ({ record }) => record.status as 'draft' | 'revision',
        accept: fields,
        guard: ({ record, actor, services }) =>
          record.applicantId === actor.id &&
          h.authorizeEdit(record, actor.id, services.connection),
      },
      submit: {
        from: ['draft', 'revision'],
        to: ['manager', 'sourceHead'],
        guard: ({ record, actor, services }) =>
          Boolean(services.prepared) &&
          record.applicantId === actor.id &&
          h.authorizeEdit(record, actor.id, services.connection),
        set: ({ services }) => ({
          snapshot: services.prepared!,
          privateSalaryRevisionId: services.preparedSalaryRevisionId!,
        }),
        route: ({ services }) =>
          services.prepared!.directManagerRequired ? 'manager' : 'sourceHead',
      },
      reviewEdit: {
        from: [...reviews],
        to: ['manager', 'sourceHead'],
        accept: fields.filter((field) => field !== 'employeeId'),
        guard: ({ record, actor, services }) =>
          Boolean(services.prepared) &&
          h.authorizeReviewEdit(record, actor.id, services.connection),
        set: ({ services }) => ({ snapshot: services.prepared! }),
        route: ({ services }) =>
          services.prepared!.directManagerRequired ? 'manager' : 'sourceHead',
      },
      managerApproved: {
        from: 'manager',
        to: 'sourceHead',
        approvalOutcome: 'approved',
        guard: async ({ record, actor, services }) => {
          await h.checkpoint(record, actor.id, services.connection);
          return true;
        },
      },
      sourceHeadApproved: {
        from: 'sourceHead',
        to: ['targetHead', 'hr'],
        approvalOutcome: 'approved',
        route: ({ record }) =>
          record.snapshot?.targetHeadRequired ? 'targetHead' : 'hr',
        guard: async ({ record, actor, services }) => {
          await h.checkpoint(record, actor.id, services.connection);
          return true;
        },
      },
      targetHeadApproved: {
        from: 'targetHead',
        to: 'hr',
        approvalOutcome: 'approved',
        guard: async ({ record, actor, services }) => {
          await h.checkpoint(record, actor.id, services.connection);
          return true;
        },
      },
      hrApproved: {
        from: 'hr',
        to: ['executive', 'gm', 'pendingEffective'],
        approvalOutcome: 'approved',
        route: ({ record }) =>
          record.snapshot?.executiveRequired
            ? 'executive'
            : record.snapshot?.gmRequired
              ? 'gm'
              : 'pendingEffective',
        guard: async ({ record, actor, services }) => {
          await h.checkpoint(record, actor.id, services.connection);
          return true;
        },
        onTransition: async ({ record, actor, to, tx }) => {
          if (to === 'pendingEffective')
            await h.allocate(record, actor.id, tx.handle as DatabaseConnection);
        },
      },
      executiveApproved: {
        from: 'executive',
        to: ['gm', 'pendingEffective'],
        approvalOutcome: 'approved',
        route: ({ record }) =>
          record.snapshot?.gmRequired ? 'gm' : 'pendingEffective',
        guard: async ({ record, actor, services }) => {
          await h.checkpoint(record, actor.id, services.connection);
          return true;
        },
        onTransition: async ({ record, actor, to, tx }) => {
          if (to === 'pendingEffective')
            await h.allocate(record, actor.id, tx.handle as DatabaseConnection);
        },
      },
      gmApproved: {
        from: 'gm',
        to: 'pendingEffective',
        approvalOutcome: 'approved',
        guard: async ({ record, actor, services }) => {
          await h.checkpoint(record, actor.id, services.connection);
          return true;
        },
        onTransition: ({ record, actor, tx }) =>
          h.allocate(record, actor.id, tx.handle as DatabaseConnection),
      },
      rejected: {
        from: [...reviews],
        to: 'rejected',
        approvalOutcome: 'rejected',
        onTransition: ({ record, actor, tx }) =>
          h.release(record, actor.id, tx.handle as DatabaseConnection),
      },
      returned: {
        from: [...reviews],
        to: 'revision',
        approvalOutcome: 'returned',
      },
      withdraw: {
        from: ['draft', 'revision', ...reviews],
        to: 'withdrawn',
        guard: ({ record, actor }) => record.applicantId === actor.id,
        onTransition: ({ record, actor, tx }) =>
          h.release(record, actor.id, tx.handle as DatabaseConnection),
      },
      terminate: {
        from: ['draft', 'revision', ...reviews],
        to: 'terminated',
        guard: ({ actor, input, services }) =>
          services.directory.hasRole(actor.id, 'approval.admin') &&
          typeof input.reason === 'string' &&
          !!input.reason.trim(),
        onTransition: ({ record, actor, tx }) =>
          h.release(record, actor.id, tx.handle as DatabaseConnection),
      },
      requestCancellation: {
        from: 'pendingEffective',
        to: 'cancellationReview',
        accept: ['cancellationReason'],
        guard: ({ record, actor, services, input }) =>
          record.applicantId === actor.id &&
          typeof input.cancellationReason === 'string' &&
          !!input.cancellationReason.trim() &&
          h.authorizeCancellation(record, actor.id, services.connection),
        set: async ({ record, actor, services }) => ({
          cancelConfirmerId: await h.cancellationConfirmer(
            record,
            actor.id,
            services.connection,
          ),
        }),
      },
      cancellationApproved: {
        from: 'cancellationReview',
        to: 'cancelled',
        approvalOutcome: 'approved',
        guard: ({ record, actor, services }) =>
          h.authorizeCancellation(record, actor.id, services.connection),
        onTransition: ({ record, actor, tx }) =>
          h.release(record, actor.id, tx.handle as DatabaseConnection),
      },
      cancellationRejected: {
        from: 'cancellationReview',
        to: 'pendingEffective',
        approvalOutcome: 'rejected',
        guard: ({ record, actor, services }) =>
          h.authorizeCancellation(record, actor.id, services.connection),
      },
      execute: {
        set: () => ({ executionFailureCode: null }),
        from: 'pendingEffective',
        to: 'completed',
        manual: false,
        guard: ({ actor }) => actor.system === true,
        onTransition: ({ record, tx }) =>
          h.execute(record, tx.handle as DatabaseConnection),
      },
    },
  });
}
