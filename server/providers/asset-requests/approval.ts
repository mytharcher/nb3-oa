import {
  defineApproval,
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
  hashOf,
  freezeOf,
} from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';
import type { OaApprovalDirectory } from '../approval-directory/contract.js';
import type { CalendarService } from '../platform/index.js';
import type { createOaApprovalOperations } from '../approval-directory/operations.js';
import {
  ASSET_REQUEST_LIFECYCLE,
  type AssetRequestRecord,
} from './contract.js';
import { assetExecutionActions, assetExecutionPolicy } from './handling.js';
export interface AssetApprovalTypes {
  record: AssetRequestRecord;
  state:
    | 'draft'
    | 'revision'
    | 'head'
    | 'appraisal'
    | 'finance'
    | 'gm'
    | 'issuing'
    | 'returning'
    | 'exception'
    | 'issued'
    | 'returned'
    | 'scrapped'
    | 'rejected'
    | 'withdrawn'
    | 'terminated';
  services: {
    directory: OaApprovalDirectory;
    connection: DatabaseConnection;
    resumeEligible?: boolean;
  };
}
type Definition = Parameters<typeof defineApproval<AssetApprovalTypes>>[0];
type Transition = Definition['transitions'][string];
export const assetRequestInputFields = [
  'operation',
  'category',
  'assetIds',
  'quantity',
  'purpose',
  'borrowDueDate',
  'scrapReason',
  'photos',
];
export const assetRequestFrozenFields = [
  ...assetRequestInputFields,
  'allocation',
];
export const assetRequestFingerprint = (record: AssetRequestRecord) =>
  hashOf(freezeOf(record, assetRequestFrozenFields));
/** Hooks perform public stock operations in the same lifecycle transaction; failures roll back the SDK answer. */
export function assetRequestApproval(d: {
  calendar: CalendarService;
  submit: Transition['set'];
  write: NonNullable<Transition['onTransition']>;
  onEnterState?: Definition['onEnterState'];
  onEnter?: Definition['onEnter'];
  notify?: Definition['notify'];
  operations?: ReturnType<typeof createOaApprovalOperations>;
}) {
  const stage = stagesFor<AssetApprovalTypes>();
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
      ...(d.operations ?? []),
    ],
    onEmpty: 'hold' as const,
    reuse: 'unchanged' as const,
    remindAfterHours: 24,
    dueAfterHours: 48,
    onDue: 'escalate' as const,
  };
  const owner = ({
    record,
    actor,
  }: {
    record: AssetRequestRecord;
    actor: { id: string };
  }) => record.applicantId === actor.id;
  const units = z
    .array(
      z
        .object({
          assetId: z.string().min(1).max(64),
          serialNumber: z.string().trim().min(1).max(200),
        })
        .strict(),
    )
    .min(1)
    .max(100);
  const execution = () =>
    stage.custom(
      assetExecutionPolicy,
      {},
      {
        qualification: 'admin',
        onEmpty: 'hold',
        remindAfterHours: 24,
        pools: [
          {
            key: 'administration',
            claimable: true,
            candidates: ({ services }) =>
              services.directory.roleMembers('admin'),
          },
        ],
        actions: [
          claimAction,
          releaseAction,
          assignAction,
          commentAction,
          readAction,
          appointAction,
          reassignAction,
          ...Object.values(assetExecutionActions),
        ],
        outputs: {
          fields: { units, receiptReason: z.string().max(5000).nullable() },
          required: ['units'],
          writes: { units: 'handlingUnits', receiptReason: 'handlingReason' },
        },
      },
    );
  return defineApproval<AssetApprovalTypes>({
    name: ASSET_REQUEST_LIFECYCLE,
    collection: 'assetRequests',
    initial: 'draft',
    version: 1,
    applicant: (r) => r.applicantId,
    directory: (s) => s.directory,
    calendar: () => d.calendar.approvalCalendar(),
    freeze: assetRequestFrozenFields,
    adminRole: 'approval.admin',
    assignment: defaultAssignmentRules.map((rule) =>
      rule.name === excludeApplicant.name
        ? {
            name: rule.name,
            apply: (context) =>
              ['issuing', 'returning'].includes(context.stage)
                ? { kind: 'keep' as const }
                : rule.apply(context),
          }
        : rule,
    ),
    afterEnd: [readAction],
    notify: d.notify,
    onEnterState: d.onEnterState,
    onEnter: d.onEnter,
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
          assignee: ({ record }) => record.headApproverId ?? undefined,
        }),
      ),
      // One pool is one voting place in the installed SDK. Separate member places preserve business OR signing:
      // any one approval succeeds, while a rejection succeeds only when every member has rejected.
      approvalState(
        'appraisal',
        stage.any({
          ...review,
          assignees: ({ services }) => services.directory.roleMembers('admin'),
          outputs: {
            fields: { appraisalOpinion: z.string().trim().min(1).max(2000) },
            required: ['appraisalOpinion'],
            writes: { appraisalOpinion: 'appraisalOpinion' },
          },
        }),
      ),
      approvalState(
        'finance',
        stage.any({
          ...review,
          assignees: ({ services }) =>
            services.directory.roleMembers('finance'),
        }),
      ),
      approvalState(
        'gm',
        stage.single({
          ...review,
          assignee: ({ services }) => services.directory.uniqueRoleMember('gm'),
        }),
      ),
      approvalState('issuing', execution()),
      approvalState('returning', execution()),
      ...(
        [
          'issued',
          'returned',
          'scrapped',
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
        route: ({ record }) =>
          record.status as 'draft' | 'revision' | 'exception',
        accept: assetRequestInputFields,
        onTransition: d.write,
      },
      submit: {
        from: ['draft', 'revision', 'exception'],
        to: ['head', 'issuing'],
        guard: owner,
        route: ({ record, services }) =>
          record.operation !== 'scrap' &&
          record.status === 'exception' &&
          record.approvedFingerprint === assetRequestFingerprint(record) &&
          services.resumeEligible === true
            ? 'issuing'
            : 'head',
        set: d.submit,
        onTransition: d.write,
      },
      headApproved: {
        from: 'head',
        to: ['appraisal', 'issuing'],
        approvalOutcome: 'approved',
        route: ({ record }) =>
          record.operation === 'scrap' ? 'appraisal' : 'issuing',
        set: ({ record }) => ({
          approvedFingerprint: assetRequestFingerprint(record),
        }),
        onTransition: d.write,
      },
      appraised: {
        from: 'appraisal',
        to: 'finance',
        approvalOutcome: 'approved',
        onTransition: d.write,
      },
      financeApproved: {
        from: 'finance',
        to: ['gm', 'scrapped'],
        approvalOutcome: 'approved',
        route: ({ record }) => (record.needsGm ? 'gm' : 'scrapped'),
        onTransition: d.write,
      },
      gmApproved: {
        from: 'gm',
        to: 'scrapped',
        approvalOutcome: 'approved',
        onTransition: d.write,
      },
      issueCompleted: {
        from: 'issuing',
        to: ['issued', 'returning'],
        approvalOutcome: 'completed',
        route: ({ record }) =>
          record.operation === 'borrow' ? 'returning' : 'issued',
        set: ({ actor }) => ({ issuedById: actor.id }),
        onTransition: d.write,
      },
      issueUnavailable: {
        from: 'issuing',
        to: 'exception',
        approvalOutcome: 'unavailable',
        onTransition: d.write,
      },
      returnCompleted: {
        from: 'returning',
        to: 'returned',
        approvalOutcome: 'completed',
        onTransition: d.write,
      },
      returnUnavailable: {
        from: 'returning',
        to: 'returning',
        approvalOutcome: 'unavailable',
        onTransition: d.write,
      },
      rejected: {
        from: ['head', 'appraisal', 'finance', 'gm'],
        to: 'rejected',
        approvalOutcome: 'rejected',
        onTransition: d.write,
      },
      returned: {
        from: ['head', 'appraisal', 'finance', 'gm'],
        to: 'revision',
        approvalOutcome: 'returned',
        onTransition: d.write,
      },
      withdraw: {
        from: [
          'draft',
          'revision',
          'head',
          'appraisal',
          'finance',
          'gm',
          'exception',
        ],
        to: 'withdrawn',
        guard: owner,
        onTransition: d.write,
      },
      terminate: {
        from: [
          'revision',
          'head',
          'appraisal',
          'finance',
          'gm',
          'issuing',
          'exception',
        ],
        to: 'terminated',
        guard: ({ actor, services, input }) =>
          services.directory.hasRole(actor.id, 'approval.admin') &&
          typeof input.reason === 'string' &&
          !!input.reason.trim(),
        onTransition: d.write,
      },
    },
  });
}
