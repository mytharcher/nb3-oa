import { defineAppApproval as defineApproval } from '../approval-runtime/task-center.js';
import { z } from 'zod';
import {
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
  outputsOf,
  type TaskRow,
} from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection } from '@nocobase/db';
import type { OaApprovalDirectory } from '../approval-directory/contract.js';
import type { CalendarService } from '../platform/index.js';
import type { createOaApprovalOperations } from '../approval-directory/operations.js';
import {
  CERTIFICATE_KIND,
  type CertificateRequest,
  type CertificateState,
} from './contract.js';
import {
  certificateExecutionPolicy,
  completeCertificate,
  unableCertificate,
} from './handling.js';
import { certificateFingerprint } from './printing.js';
export const CERTIFICATE_INPUT_FIELDS = [
  'certificateType',
  'purpose',
  'copies',
  'deliveryMethod',
] as const;
export interface CertificateTypes {
  record: CertificateRequest;
  state: CertificateState;
  services: {
    directory: OaApprovalDirectory;
    connection: DatabaseConnection;
    resumeEligible?: boolean;
  };
}
type Definition = Parameters<typeof defineApproval<CertificateTypes>>[0];
type Transition = Definition['transitions'][string];
export interface CertificateGraphHost {
  calendar: CalendarService;
  operations: ReturnType<typeof createOaApprovalOperations>;
  submit(
    record: CertificateRequest,
    actorId: string,
    tx: DatabaseConnection,
    now: Date,
  ): Promise<Partial<CertificateRequest>>;
  validateEdit(
    record: CertificateRequest,
    tx: DatabaseConnection,
  ): Promise<void>;
  confirm(
    record: CertificateRequest,
    actorId: string,
    tx: DatabaseConnection,
    now: Date,
  ): Promise<{ issueId: string }>;
  audit: NonNullable<Transition['onTransition']>;
  notify(
    task: TaskRow,
    reason: string,
    directory: OaApprovalDirectory,
  ): Promise<void>;
  onEnter?: Definition['onEnter'];
}
export function certificateGraph(host: CertificateGraphHost) {
  const stage = stagesFor<CertificateTypes>();
  const owner = ({
    record,
    actor,
  }: {
    record: CertificateRequest;
    actor: { id: string };
  }) => record.applicantId === actor.id;
  const active = allActivePeople();
  const sameHr = definePeopleScope({
    search: (c, q) => active.search(c, q),
    contains: (c, id) =>
      c.directory.isActive(id) && c.directory.hasRole(id, 'hr'),
  });
  const execution = () =>
    stage.custom(
      certificateExecutionPolicy,
      {},
      {
        qualification: 'hr',
        pools: [
          {
            key: 'hr',
            claimable: true,
            candidates: ({ services }) => services.directory.roleMembers('hr'),
          },
        ],
        onEmpty: 'hold',
        remindAfterHours: 24,
        actions: [
          claimAction,
          releaseAction,
          assignAction,
          configureAction(transferAction, { recipients: sameHr }),
          commentAction,
          readAction,
          appointAction,
          reassignAction,
          completeCertificate,
          unableCertificate,
          ...host.operations.filter(
            (a) => ('name' in a ? a.name : a.action.name) === 'urge',
          ),
        ],
        outputs: {
          fields: {
            preparationId: z.string().max(64),
            exceptionReason: z.string().nullable(),
          },
          writes: {
            preparationId: 'preparationId',
            exceptionReason: 'exceptionReason',
          },
        },
      },
    );
  return defineApproval<CertificateTypes>({
    name: CERTIFICATE_KIND,
    collection: 'certificateRequests',
    initial: 'draft',
    version: 1,
    applicant: (r) => r.applicantId,
    directory: (s) => s.directory,
    calendar: () => host.calendar.approvalCalendar(),
    freeze: [...CERTIFICATE_INPUT_FIELDS, 'employeeId', 'departmentId'],
    adminRole: 'approval.admin',
    assignment: defaultAssignmentRules.map((rule) =>
      rule.name === excludeApplicant.name
        ? {
            name: rule.name,
            apply: (c) =>
              ['issuing'].includes(c.stage)
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
      'issueException',
      approvalState(
        'head',
        stage.single({
          assignee: ({ record, services }) =>
            services.directory.headOf(record.applicantId),
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
          onEmpty: 'hold',
          reuse: 'unchanged',
          remindAfterHours: 24,
          dueAfterHours: 48,
          onDue: 'escalate',
        }),
      ),
      approvalState('issuing', execution()),
      ...(
        [
          'issued',
          'rejected',
          'withdrawn',
          'terminated',
          'administrativelyClosed',
        ] as const
      ).map((name) => ({ name, final: true })),
    ],
    transitions: {
      edit: {
        from: ['draft', 'revision', 'issueException'],
        to: ['draft', 'revision', 'issueException'],
        guard: owner,
        route: ({ record }) => record.status,
        accept: CERTIFICATE_INPUT_FIELDS,
        set: async ({ record, services, input }) => {
          await host.validateEdit(
            {
              ...record,
              ...Object.fromEntries(
                CERTIFICATE_INPUT_FIELDS.filter((k) => k in input).map((k) => [
                  k,
                  input[k],
                ]),
              ),
            },
            services.connection,
          );
          return { preparationId: null };
        },
        onTransition: host.audit,
      },
      submit: {
        from: ['draft', 'revision', 'issueException'],
        to: 'head',
        guard: owner,
        set: ({ record, actor, services, now }) =>
          host.submit(record, actor.id, services.connection, now),
        onTransition: host.audit,
      },
      approved: {
        from: 'head',
        to: 'issuing',
        approvalOutcome: 'approved',
        set: ({ record }) => ({
          approvedFingerprint: certificateFingerprint(record),
        }),
        onTransition: host.audit,
      },
      issued: {
        from: 'issuing',
        to: 'issued',
        approvalOutcome: 'completed',
        set: ({ record, actor, services, now, input }) =>
          host.confirm(
            { ...record, ...outputsOf({ input }) },
            actor.id,
            services.connection,
            now,
          ),
        onTransition: host.audit,
      },
      unavailable: {
        from: 'issuing',
        to: 'issueException',
        approvalOutcome: 'unavailable',
        onTransition: host.audit,
      },
      rejected: {
        from: 'head',
        to: 'rejected',
        approvalOutcome: 'rejected',
        onTransition: host.audit,
      },
      returned: {
        from: 'head',
        to: 'revision',
        approvalOutcome: 'returned',
        set: () => ({ preparationId: null }),
        onTransition: host.audit,
      },
      withdraw: {
        from: ['draft', 'revision', 'head', 'issueException'],
        to: 'withdrawn',
        guard: owner,
        onTransition: host.audit,
      },
      retry: {
        from: 'issueException',
        to: 'issuing',
        guard: ({ record, actor, services, input }) =>
          services.directory.hasRole(actor.id, 'admin') &&
          record.approvedFingerprint === certificateFingerprint(record) &&
          typeof input.reason === 'string' &&
          !!input.reason.trim(),
        set: () => ({ preparationId: null }),
        onTransition: host.audit,
      },
      terminate: {
        from: ['draft', 'revision', 'head', 'issuing', 'issueException'],
        to: 'terminated',
        guard: ({ actor, services, input }) =>
          services.directory.hasRole(actor.id, 'admin') &&
          typeof input.reason === 'string' &&
          !!input.reason.trim(),
        onTransition: host.audit,
      },
      forceComplete: {
        from: ['issuing', 'issueException'],
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
