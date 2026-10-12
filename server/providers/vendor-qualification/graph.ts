import {
  approvalState,
  defineApproval,
  stagesFor,
  approve,
  reject,
  returnTo,
  commentAction,
  readAction,
  appointAction,
  reassignAction,
  defineApprovalAction,
  allActivePeople,
  type ActionContext,
  type AppointInput,
  type ReassignInput,
  type AssignmentRule,
  type TaskRow,
  type ApplicationApprovalOptions,
} from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection } from '@nocobase/db';
import type { OaApprovalDirectory } from '../approval-directory/contract.js';
import type { CalendarService } from '../platform/index.js';
import type { JsonObject } from '@nocobase/lifecycle';
import { committeeAbstainAction } from './abstain.js';
import { validateCommittee, type CommitteeVersion } from './committee.js';
import {
  VENDOR_QUALIFICATION_KIND,
  type VendorQualificationRecord,
  type VendorQualificationState,
} from './contract.js';
export interface QualificationServices {
  directory: OaApprovalDirectory;
  connection?: DatabaseConnection;
}
export interface QualificationTypes {
  record: VendorQualificationRecord;
  state: VendorQualificationState;
  services: QualificationServices;
}
export interface QualificationGraphHost {
  taskNotice?(
    task: TaskRow,
    reason: string,
    directory: OaApprovalDirectory,
  ): Promise<void>;
  resultNotice?(
    record: VendorQualificationRecord,
    state: string,
    key: string,
  ): Promise<void>;
  versions: readonly CommitteeVersion[];
  calendar: CalendarService;
  submit(
    record: VendorQualificationRecord,
    actorId: string,
    tx: DatabaseConnection,
    now: Date,
  ): Promise<Partial<VendorQualificationRecord>>;
  edit(
    record: VendorQualificationRecord,
    input: JsonObject,
    tx: DatabaseConnection,
  ): Promise<Partial<VendorQualificationRecord>>;
  restart(
    record: VendorQualificationRecord,
    actorId: string,
    reason: string,
    tx: DatabaseConnection,
  ): Promise<Partial<VendorQualificationRecord>>;
  candidates(
    record: VendorQualificationRecord,
    version: CommitteeVersion,
    seatKey: string,
    tx: DatabaseConnection,
  ): Promise<readonly string[]>;
  removalHead(tx: DatabaseConnection): Promise<string | null>;
  apply(
    record: VendorQualificationRecord,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<void>;
}
export function qualificationGraph(host: QualificationGraphHost) {
  const versions = host.versions.map(validateCommittee);
  if (!versions.length)
    throw new Error('A committee version must be available at startup.');
  const stage = stagesFor<QualificationTypes>();
  const owner = ({
    record,
    actor,
  }: {
    record: VendorQualificationRecord;
    actor: { id: string };
  }) => record.applicantId === actor.id;
  const admin = ({
    actor,
    services,
  }: {
    actor: { id: string };
    services: QualificationServices;
  }) => services.directory.hasRole(actor.id, 'approval.admin');
  const activeStates: VendorQualificationState[] = [
    'draft',
    'revision',
    'purchasing',
    'removalReview',
    ...versions.map((v): VendorQualificationState => `committee_v${v.version}`),
  ];
  const distinctSeats: AssignmentRule = {
    name: 'vendorCommittee.distinctSeats',
    apply(context) {
      if (context.spec.assigneeId === context.applicantId)
        return {
          kind: 'refuse',
          code: 'NOT_ALLOWED',
          message: 'The applicant cannot review this application.',
        };
      if (context.stage.startsWith('committee_v')) {
        const structure = versions.find(
          (v) => `committee_v${v.version}` === context.stage,
        );
        const seat =
          structure?.seats[
            context.spec.order ?? context.replacing?.order ?? -1
          ];
        if (
          !seat ||
          (['purchasing', 'finance', 'legal'].includes(seat.source) &&
            !context.directory.hasRole(context.spec.assigneeId, seat.source))
        )
          return {
            kind: 'refuse',
            code: 'NOT_ALLOWED',
            message: 'The person does not qualify for this committee seat.',
          };
      }
      if (
        context.stage.startsWith('committee_v') &&
        context.stay.some(
          (task) =>
            task.id !== context.replacing?.id &&
            task.assigneeId === context.spec.assigneeId &&
            task.role === 'member' &&
            !['voided', 'transferred'].includes(task.status),
        )
      )
        return {
          kind: 'refuse',
          code: 'NOT_ALLOWED',
          message: 'A person cannot occupy more than one committee seat.',
        };
      return { kind: 'keep' };
    },
  };
  async function recipientEligible(
    context: ActionContext,
    person: string,
    place?: string,
  ): Promise<boolean> {
    if (!context.directory.isActive(person) || person === context.applicantId)
      return false;
    if (
      context.stay.some(
        (task) =>
          task.id !== context.task?.id &&
          task.assigneeId === person &&
          task.role === 'member' &&
          !['voided', 'transferred'].includes(task.status),
      )
    )
      return false;
    const services = context.services as unknown as QualificationServices;
    if (context.stage === 'purchasing')
      return context.directory.hasRole(person, 'purchasing');
    if (context.stage === 'removalReview')
      return (await host.removalHead(services.connection!)) === person;
    const version = versions.find(
      (v) => `committee_v${v.version}` === context.stage,
    );
    if (!version) return false;
    const places = place
      ? context.unassigned.filter((p) => p.placeKey === place)
      : context.task
        ? context.places.filter((p) => p.order === context.task!.order)
        : context.unassigned;
    for (const entry of places) {
      const seat = version.seats[entry.order];
      if (
        seat &&
        (
          await host.candidates(
            context.record as VendorQualificationRecord,
            version,
            seat.key,
            services.connection!,
          )
        ).includes(person)
      )
        return true;
    }
    return false;
  }
  const people = async (
    context: ActionContext,
    query: { search?: string; offset?: number; limit?: number },
  ) => {
    const page = await allActivePeople().search(context, query);
    const permitted: string[] = [];
    for (const person of page.people)
      if (await recipientEligible(context, person)) permitted.push(person);
    return { people: permitted, nextOffset: page.nextOffset };
  };
  const appoint = defineApprovalAction<AppointInput, undefined>({
    ...appointAction,
    people,
    validate: async (input, context) => {
      const error = await appointAction.validate?.(input, context);
      if (error) return error;
      return input.to &&
        (await recipientEligible(context, input.to, input.place))
        ? null
        : 'Choose the configured eligible person for this seat.';
    },
  });
  const reassign = defineApprovalAction<ReassignInput, undefined>({
    ...reassignAction,
    people,
    validate: async (input, context) => {
      const error = await reassignAction.validate?.(input, context);
      if (error) return error;
      return !input.override &&
        input.to &&
        (await recipientEligible(context, input.to))
        ? null
        : 'Choose the configured eligible person; qualification cannot be overridden.';
    },
  });
  const actions = [
    approve(),
    reject({ reason: 'required' }),
    commentAction,
    readAction,
    appoint,
    reassign,
  ];
  const common = {
    onEmpty: 'hold' as const,
    remindAfterHours: 24,
    dueAfterHours: 48,
    onDue: 'escalate' as const,
    reuse: () => false,
  };
  return defineApproval<QualificationTypes>({
    name: VENDOR_QUALIFICATION_KIND,
    collection: 'vendorQualifications',
    initial: 'draft',
    // Public application approval metadata accepts only a static version. Structural
    // policy generations are frozen in committeeSnapshot and named committee_vN;
    // keep this adapter version stable so old inflight runs remain actionable.
    version: 1,
    applicant: (record) => record.applicantId,
    directory: (services) => services.directory,
    calendar: () => host.calendar.approvalCalendar(),
    adminRole: 'approval.admin',
    assignment: [distinctSeats],
    freeze: [
      'name',
      'category',
      'attachments',
      'quoteCents',
      'cases',
      'qualificationExpiry',
      'vendorId',
      'operation',
      'sourceVendorVersion',
      'committeeSnapshot',
      'committeeVersion',
    ],
    afterEnd: [readAction],
    notify: ({ task, reason, services }) =>
      host.taskNotice?.(task, reason, services.directory) ?? Promise.resolve(),
    onEnter: Object.fromEntries(
      [
        'qualified',
        'removed',
        'rejected',
        'withdrawn',
        'terminated',
        'revision',
      ].map((state) => [
        state,
        [
          {
            name: `vendorQualification.notify.${state}`,
            retry: { attempts: 5, backoffMs: 1000 },
            run: ({
              record,
              idempotencyKey,
            }: {
              record: VendorQualificationRecord;
              idempotencyKey: string;
            }) =>
              host.resultNotice?.(record, state, idempotencyKey) ??
              Promise.resolve(),
          },
        ],
      ]),
    ),
    create: { guard: ({ actor, values }) => values.applicantId === actor.id },
    states: [
      'draft',
      'revision',
      approvalState(
        'purchasing',
        stage.any({
          ...common,
          qualification: 'purchasing',
          assignees: ({ services, applicantId }) =>
            services.directory
              .roleMembers('purchasing')
              .filter((id) => id !== applicantId),
          actions: [...actions, returnTo({ targets: ['revision'] })],
        }),
      ),
      ...versions.map((version) =>
        approvalState(
          `committee_v${version.version}`,
          stage.threshold({
            ...common,
            min: version.min,
            abstain: true,
            pools: version.seats.map((seat) => ({
              key: seat.key,
              veto: seat.veto,
              candidates: ({ record, services }) =>
                host.candidates(
                  record,
                  version,
                  seat.key,
                  services.connection!,
                ),
            })),
            actions: [...actions, committeeAbstainAction],
          }),
        ),
      ),
      approvalState(
        'removalReview',
        stage.single({
          ...common,
          assignee: ({ services }) => host.removalHead(services.connection!),
          actions,
        }),
      ),
      ...(
        ['qualified', 'removed', 'rejected', 'withdrawn', 'terminated'] as const
      ).map((name) => ({ name, final: true })),
    ],
    transitions: {
      edit: {
        from: ['draft', 'revision'],
        to: ['draft', 'revision'],
        guard: owner,
        route: ({ record }) => record.status,
        set: ({ record, input, services }) =>
          host.edit(record, input, services.connection!),
      },
      submit: {
        from: ['draft', 'revision'],
        to: ['purchasing', 'removalReview'],
        guard: owner,
        route: ({ record }) =>
          record.operation === 'remove' ? 'removalReview' : 'purchasing',
        set: ({ record, actor, services, now }) =>
          host.submit(record, actor.id, services.connection!, now),
      },
      purchasingApproved: {
        from: 'purchasing',
        to: versions.map(
          (v): VendorQualificationState => `committee_v${v.version}`,
        ),
        approvalOutcome: 'approved',
        route: ({ record }) => {
          if (record.committeeVersion === null)
            throw new Error('The committee version is missing.');
          return `committee_v${record.committeeVersion}`;
        },
      },
      purchasingRejected: {
        from: 'purchasing',
        to: 'rejected',
        approvalOutcome: 'rejected',
      },
      purchasingReturned: {
        from: 'purchasing',
        to: 'revision',
        approvalOutcome: 'returned',
      },
      ...(Object.fromEntries(
        versions.flatMap((version) => [
          [
            `committee${version.version}Approved`,
            {
              from: `committee_v${version.version}`,
              to: 'qualified',
              approvalOutcome: 'approved',
              onTransition: ({
                record,
                actor,
                tx,
              }: {
                record: VendorQualificationRecord;
                actor: { id: string };
                tx: { handle?: unknown };
              }) =>
                host.apply(record, actor.id, tx.handle as DatabaseConnection),
            },
          ],
          [
            `committee${version.version}Rejected`,
            {
              from: `committee_v${version.version}`,
              to: 'rejected',
              approvalOutcome: 'rejected',
            },
          ],
        ]),
      ) as NonNullable<
        ApplicationApprovalOptions<QualificationTypes>['transitions']
      >),
      removalApproved: {
        from: 'removalReview',
        to: 'removed',
        approvalOutcome: 'approved',
        onTransition: ({ record, actor, tx }) =>
          host.apply(record, actor.id, tx.handle as DatabaseConnection),
      },
      removalRejected: {
        from: 'removalReview',
        to: 'rejected',
        approvalOutcome: 'rejected',
      },
      withdraw: { from: activeStates, to: 'withdrawn', guard: owner },
      terminate: { from: activeStates, to: 'terminated', guard: admin },
      restartReview: {
        from: [
          'purchasing',
          ...versions.map(
            (v): VendorQualificationState => `committee_v${v.version}`,
          ),
        ],
        to: 'purchasing',
        guard: ({ record, actor, services, input }) =>
          record.operation === 'qualify' &&
          admin({ actor, services }) &&
          typeof input.reason === 'string' &&
          !!input.reason.trim(),
        set: ({ record, actor, services, input }) =>
          host.restart(
            record,
            actor.id,
            typeof input.reason === 'string' ? input.reason : '',
            services.connection!,
          ),
      },
    },
  });
}
