import { DepartureError } from './errors.js';
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
  outputsOf,
  APPROVAL_COLLECTIONS,
  type TaskRow,
} from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection } from '@nocobase/db';
import type { JsonObject } from '@nocobase/lifecycle';
import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import { createOaApprovalOperations } from '../approval-directory/operations.js';
import type { OaApprovalDirectory } from '../approval-directory/contract.js';
import {
  DEPARTURE_LIFECYCLE,
  DEPARTURE_EXECUTION_LIFECYCLE,
  DEPARTURE_WORK_LIFECYCLE,
  type DepartureRecord,
  type DepartureWorkRecord,
  type DepartureExecutionRecord,
} from './contract.js';
import type { DepartureDependencies } from './service.js';
import { departureHrOutputsSchema } from './validation.js';
export interface DepartureServices {
  connection: DatabaseConnection;
  directory: OaApprovalDirectory;
  merge: Map<string, JsonObject | null>;
}
export interface DepartureTypes {
  record: DepartureRecord;
  state:
    | 'draft'
    | 'revision'
    | 'manager'
    | 'head'
    | 'hr'
    | 'gm'
    | 'handover'
    | 'cancellationReview'
    | 'cancelled'
    | 'completed'
    | 'withdrawn'
    | 'rejected'
    | 'terminated';
  services: DepartureServices;
}
export function departureApproval(
  d: DepartureDependencies,
  createGuard: Parameters<typeof defineApproval<DepartureTypes>>[0]['create'],
  draftHooks: Parameters<
    typeof defineApproval<DepartureTypes>
  >[0]['onEnterState'],
  edit: Parameters<
    typeof defineApproval<DepartureTypes>
  >[0]['transitions'][string],
) {
  const stages = stagesFor<DepartureTypes>();
  const owner = async ({
    record,
    actor,
    services,
  }: {
    record: DepartureRecord;
    actor: { id: string };
    services: DepartureServices;
  }) =>
    actor.id === record.applicantId ||
    (actor.id === record.createdById &&
      (await d.org.hasDutyRole(actor.id, 'hr', services.connection)));
  const common = {
    actions: [
      ...createOaApprovalOperations(d),
      approve(),
      reject({ reason: 'required' }),
      returnTo({ targets: ['revision'], reason: 'required' }),
      commentAction,
      readAction,
      appointAction,
      reassignAction,
    ],
    onEmpty: 'hold' as const,
    remindAfterHours: 24,
    dueAfterHours: 48,
    onDue: 'escalate' as const,
  };
  const reviews = ['manager', 'head', 'hr', 'gm'] as const;
  async function apply(
    record: DepartureRecord,
    actorId: string,
    connection: DatabaseConnection,
    now: Date,
  ) {
    await lockUserForAdministration(connection, record.applicantId);
    const employee = await d.employees.getById(record.employeeId, connection);
    if (
      !employee?.active ||
      employee.userId !== record.applicantId ||
      !['probation', 'regular'].includes(employee.status)
    )
      throw new DepartureError(
        'DEPARTURE_EMPLOYEE_BASELINE_CHANGED',
        'Departure requirements have not been satisfied.',
      );
    if (!record.lastWorkingDay)
      throw new DepartureError(
        'DEPARTURE_LAST_WORKING_DAY_REQUIRED',
        'Departure requirements have not been satisfied.',
      );
    await d.employees.applyStatusChange(
      {
        employeeId: record.employeeId,
        status: 'leaving',
        kind: 'departure',
        lastWorkingDay: record.lastWorkingDay,
        effectiveAt: d.calendar.localDate(now),
      },
      { actorId, sourceApplication: `${DEPARTURE_LIFECYCLE}:${record.id}` },
      connection,
    );
  }
  return defineApproval<DepartureTypes>({
    name: DEPARTURE_LIFECYCLE,
    collection: 'departureRequests',
    initial: 'draft',
    version: 1,
    applicant: (r) => r.applicantId,
    directory: (s) => s.directory,
    calendar: () => d.calendar.approvalCalendar(),
    adminRole: 'approval.admin',
    freeze: [
      'departureType',
      'reason',
      'expectedLastWorkingDay',
      'handoverUserId',
      'gradeRank',
      'departmentId',
      'lastWorkingDay',
      'ruleSnapshot',
    ],
    afterEnd: [readAction],
    notify: async ({ task, reason, services }) =>
      d.notifications?.task({
        task,
        reason,
        directory: services.directory,
        kind: DEPARTURE_LIFECYCLE,
        at: new Date().toISOString(),
      }),
    onEnter: Object.fromEntries(
      [
        'draft',
        'revision',
        'rejected',
        'handover',
        'completed',
        'cancelled',
      ].map((state) => [
        state,
        [
          {
            name: `departure.notify.${state}`,
            retry: { attempts: 5, backoffMs: 1000 },
            run: ({
              record,
              idempotencyKey,
            }: {
              record: DepartureRecord;
              idempotencyKey: string;
            }) =>
              d.notifications?.result({
                recordId: record.id,
                applicantId: record.applicantId,
                state,
                transitionId: idempotencyKey,
                kind: DEPARTURE_LIFECYCLE,
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
          ...common,
          assignee: ({ record }) => record.managerApproverId ?? undefined,
        }),
      ),
      approvalState(
        'head',
        stages.single({
          ...common,
          assignee: ({ record }) => record.headApproverId ?? undefined,
        }),
      ),
      approvalState(
        'hr',
        stages.any({
          ...common,
          assignees: ({ services }) => services.directory.roleMembers('hr'),
          outputs: {
            fields: {
              lastWorkingDay: departureHrOutputsSchema.shape.lastWorkingDay,
            },
            required: ['lastWorkingDay'],
            writes: { lastWorkingDay: 'lastWorkingDay' },
          },
        }),
      ),
      approvalState(
        'gm',
        stages.single({
          ...common,
          assignee: ({ record }) => record.gmApproverId ?? undefined,
        }),
      ),
      'handover',
      approvalState(
        'cancellationReview',
        stages.first({
          actions: [approve(), reject()],
          pools: [
            {
              key: 'hr-cancellation',
              candidates: ({ record, services }) =>
                services.directory
                  .roleMembers('hr')
                  .filter(
                    (id) =>
                      id !== record.cancellationRequestedById &&
                      id !== record.applicantId,
                  ),
            },
          ],
          onEmpty: 'hold',
          covers: [
            'employeeId',
            'originalEmployeeStatus',
            'cancellationRequestedById',
            'cancellationFromStatus',
            'cancellationReason',
          ],
        }),
      ),
      { name: 'cancelled', final: true },
      'completed',
      ...(['withdrawn', 'rejected', 'terminated'] as const).map((name) => ({
        name,
        final: true,
      })),
    ],
    create: createGuard,
    onEnterState: draftHooks,
    transitions: {
      edit: {
        ...edit,
        from: ['draft', 'revision'],
        to: ['draft', 'revision'],
        route: ({ record }) => record.status as 'draft' | 'revision',
      },
      submit: {
        from: ['draft', 'revision'],
        to: 'manager',
        guard: owner,
        set: async ({ record, services, now }) => {
          const connection = services.connection;
          await lockUserForAdministration(connection, record.applicantId);
          const employee = await d.employees.getById(
            record.employeeId,
            connection,
          );
          if (
            !employee?.active ||
            employee.userId !== record.applicantId ||
            !['probation', 'regular'].includes(employee.status)
          )
            throw new DepartureError(
              'DEPARTURE_EMPLOYEE_BASELINE_CHANGED',
              'Departure requirements have not been satisfied.',
            );
          if (!record.expectedLastWorkingDay || !record.handoverUserId)
            throw new DepartureError(
              'DEPARTURE_APPLICATION_INCOMPLETE',
              'Departure requirements have not been satisfied.',
            );
          departureHrOutputsSchema.parse({
            lastWorkingDay: record.expectedLastWorkingDay,
          });
          if (record.expectedLastWorkingDay < d.calendar.localDate(now))
            throw new DepartureError(
              'DEPARTURE_DATE_PAST',
              'Departure requirements have not been satisfied.',
            );
          const recipient = await d.employees.getByUserId(
            record.handoverUserId,
            connection,
          );
          if (
            !recipient?.active ||
            !['probation', 'regular'].includes(recipient.status) ||
            recipient.userId === record.applicantId
          )
            throw new DepartureError(
              'DEPARTURE_HANDOVER_INVALID',
              'Departure requirements have not been satisfied.',
            );
          const type = await d.dictionaries.get(
            'departureType',
            record.departureType,
            connection,
          );
          if (!type?.active)
            throw new DepartureError(
              'DEPARTURE_TYPE_INVALID',
              'Departure requirements have not been satisfied.',
            );
          const department = await d.org.primaryDepartmentOf(
            record.applicantId,
            connection,
          );
          if (
            !department ||
            !(await d.org.activeChain(department.id, connection))
          )
            throw new DepartureError(
              'DEPARTURE_DEPARTMENT_REQUIRED',
              'Departure requirements have not been satisfied.',
            );
          const grade = (await d.org.listGrades(connection)).find(
            (g) => g.id === employee.gradeId && g.active,
          );
          if (!grade)
            throw new DepartureError(
              'DEPARTURE_GRADE_REQUIRED',
              'Departure requirements have not been satisfied.',
            );
          const ruleSnapshot = await d.rules.snapshot(
            [
              'grade.managerRank',
              'sla.remindHours',
              'sla.escalateHours',
              'sla.urgeCooldownHours',
            ],
            now,
            connection,
          );
          if (
            ruleSnapshot['sla.remindHours'] !== 24 ||
            ruleSnapshot['sla.escalateHours'] !== 48
          )
            throw new DepartureError(
              'DEPARTURE_SLA_UNSUPPORTED',
              'Departure requirements have not been satisfied.',
            );
          if (
            !Number.isSafeInteger(ruleSnapshot['grade.managerRank']) ||
            Number(ruleSnapshot['grade.managerRank']) < 0
          )
            throw new DepartureError(
              'DEPARTURE_RANK_RULE_INVALID',
              'Departure requirements have not been satisfied.',
            );
          return {
            originalEmployeeStatus: employee.status,
            departmentId: department.id,
            managerApproverId:
              services.directory.managerOf(record.applicantId) ?? null,
            headApproverId:
              (await d.org.headOf(department.id, connection)) ?? null,
            gmApproverId: services.directory.uniqueRoleMember('gm') ?? null,
            gradeRank: grade.rank,
            ruleSnapshot,
            headMerged: null,
            lastWorkingDay: null,
            hrInterviewCompleted: record.hrInterviewCompleted,
            number:
              record.number ??
              (await d.sequences.next('DEPARTURE', connection, now)),
          };
        },
      },
      managerApproved: {
        from: 'manager',
        to: ['head', 'hr'],
        approvalOutcome: 'approved',
        guard: async ({ record, services, input }) => {
          let evidence: JsonObject | null = null;
          if (
            record.managerApproverId &&
            record.managerApproverId === record.headApproverId &&
            typeof input.runId === 'string'
          ) {
            const tasks = await services.connection
              .repository<TaskRow>(APPROVAL_COLLECTIONS.tasks)
              .findMany({
                filter: {
                  runId: input.runId,
                  stage: 'manager',
                  enteredVersion: record.lifecycleVersion,
                  status: 'completed',
                  depth: 0,
                  mode: null,
                  answer: 'approve',
                  role: 'member',
                  assigneeId: record.managerApproverId,
                  actorId: record.managerApproverId,
                },
              });
            const original = tasks.find((t) => t.kind === 'decide');
            if (original)
              evidence = {
                runId: input.runId,
                taskId: original.id,
                personId: record.managerApproverId,
                stages: ['manager', 'head'],
              };
          }
          services.merge.set(
            typeof input.runId === 'string' ? input.runId : '',
            evidence,
          );
          return true;
        },
        route: ({ services, input }) =>
          services.merge.get(typeof input.runId === 'string' ? input.runId : '')
            ? 'hr'
            : 'head',
        set: ({ services, input }) => ({
          headMerged:
            services.merge.get(
              typeof input.runId === 'string' ? input.runId : '',
            ) ?? null,
        }),
      },
      headApproved: { from: 'head', to: 'hr', approvalOutcome: 'approved' },
      hrApproved: {
        effects: [
          {
            name: 'departure.notify.dateConfirmed',
            retry: { attempts: 5, backoffMs: 1000 },
            run: async ({ record, idempotencyKey }) => {
              for (const recipient of new Set(
                [
                  record.applicantId,
                  record.managerApproverId,
                  record.headApproverId,
                ].filter((id): id is string => !!id),
              ))
                await d.notifications?.result({
                  recordId: record.id,
                  applicantId: recipient,
                  state: 'departureDateConfirmed',
                  transitionId: `${idempotencyKey}:${recipient}`,
                  kind: DEPARTURE_LIFECYCLE,
                });
            },
          },
        ],
        from: 'hr',
        to: ['gm', 'handover', 'completed'],
        approvalOutcome: 'approved',
        guard: ({ input, actor, services, now }) => {
          const output = departureHrOutputsSchema.parse(outputsOf({ input }));
          if (output.lastWorkingDay < d.calendar.localDate(now))
            throw new DepartureError(
              'DEPARTURE_DATE_PAST',
              'Departure requirements have not been satisfied.',
            );
          return services.directory.hasRole(actor.id, 'hr');
        },
        route: ({ record }) =>
          Number(record.gradeRank) >=
          Number(record.ruleSnapshot?.['grade.managerRank'])
            ? 'gm'
            : 'handover',
        set: () => ({ hrInterviewCompleted: true }),
        onTransition: async ({ record, actor, to, tx, now }) => {
          if (to === 'handover')
            await apply(record, actor.id, tx.handle as DatabaseConnection, now);
        },
      },
      gmApproved: {
        from: 'gm',
        to: 'handover',
        approvalOutcome: 'approved',
        onTransition: ({ record, actor, tx, now }) =>
          apply(record, actor.id, tx.handle as DatabaseConnection, now),
      },
      requestCancellation: {
        from: ['gm', 'handover', 'completed'],
        to: 'cancellationReview',
        guard: async ({ record, actor, input, services }) => {
          const employee = await d.employees.getById(
            record.employeeId,
            services.connection,
          );
          return (
            services.directory.hasRole(actor.id, 'hr') &&
            actor.id !== record.applicantId &&
            record.hrInterviewCompleted &&
            ['probation', 'regular'].includes(
              record.originalEmployeeStatus ?? '',
            ) &&
            !!employee?.active &&
            employee.status !== 'left' &&
            !(await services.connection
              .repository('departureExecutions')
              .exists({
                filter: { departureId: record.id, status: 'executed' },
              })) &&
            typeof input.reason === 'string' &&
            input.reason.trim().length > 0
          );
        },
        set: ({ record, actor, input }) => ({
          cancellationReason:
            typeof input.reason === 'string' ? input.reason.trim() : null,
          cancellationRequestedById: actor.id,
          cancellationFromStatus: record.status,
        }),
        onTransition: async ({ record, actor, input, tx }) => {
          await lockUserForAdministration(
            tx.handle as DatabaseConnection,
            record.applicantId,
          );
          return d.audit.record(
            {
              actorId: actor.id,
              action: 'departure.cancellationRequested',
              targetType: 'departureRequests',
              targetId: record.id,
              reason: typeof input.reason === 'string' ? input.reason : null,
            },
            tx.handle as DatabaseConnection,
          );
        },
      },
      cancellationRejected: {
        from: 'cancellationReview',
        to: ['gm', 'handover', 'completed'],
        approvalOutcome: 'rejected',
        route: ({ record }) =>
          record.cancellationFromStatus === 'gm'
            ? 'gm'
            : record.cancellationFromStatus === 'completed'
              ? 'completed'
              : 'handover',
      },
      cancellationApproved: {
        from: 'cancellationReview',
        to: 'cancelled',
        approvalOutcome: 'approved',
        guard: async ({ record, actor, services }) => {
          const employee = await d.employees.getById(
            record.employeeId,
            services.connection,
          );
          return (
            services.directory.hasRole(actor.id, 'hr') &&
            actor.id !== record.cancellationRequestedById &&
            actor.id !== record.applicantId &&
            ['probation', 'regular'].includes(
              record.originalEmployeeStatus ?? '',
            ) &&
            !!employee?.active &&
            employee.status !== 'left' &&
            !(await services.connection
              .repository('departureExecutions')
              .exists({
                filter: { departureId: record.id, status: 'executed' },
              }))
          );
        },
        onTransition: async ({ record, actor, tx, now }) => {
          const connection = tx.handle as DatabaseConnection;
          await lockUserForAdministration(connection, record.applicantId);
          const employee = await d.employees.getById(
            record.employeeId,
            connection,
          );
          if (!employee?.active || employee.status === 'left')
            throw new DepartureError(
              'DEPARTURE_EMPLOYEE_BASELINE_CHANGED',
              'An actual-left employee cannot be restored.',
            );
          if (employee.status === 'leaving') {
            await d.employees.applyStatusChange(
              {
                employeeId: record.employeeId,
                status: record.originalEmployeeStatus as
                  'regular' | 'probation',
                active: true,
                lastWorkingDay: null,
                kind: 'departure',
                effectiveAt: d.calendar.localDate(now),
              },
              {
                actorId: actor.id,
                sourceApplication: `oa.departure:${record.id}:cancel`,
              },
              connection,
            );
            if (d.headcounts)
              await d.headcounts.invalidateReplacements(
                {
                  employeeId: record.employeeId,
                  actorId: actor.id,
                  requestKey: `departure:${record.id}:invalidate`,
                  reason: 'Confirmed departure cancellation',
                },
                connection,
              );
          }
          for (const item of await connection
            .repository<DepartureWorkRecord>('departureWorkItems')
            .findMany({ filter: { departureId: record.id } }))
            if (['open', 'claimed'].includes(item.status))
              await tx.fire(DEPARTURE_WORK_LIFECYCLE, item.id, 'cancel', {
                actor,
                requestId: `${record.id}:cancel-work:${item.id}`,
              });
          const execution = await connection
            .repository<DepartureExecutionRecord>('departureExecutions')
            .findOne({ filter: { departureId: record.id } });
          if (execution)
            await tx.fire(
              DEPARTURE_EXECUTION_LIFECYCLE,
              execution.id,
              'cancel',
              { actor, requestId: `${record.id}:cancel-execution` },
            );
          await d.audit.record(
            {
              actorId: actor.id,
              action: 'departure.cancelled',
              targetType: 'departureRequests',
              targetId: record.id,
              after: {
                employeeStatus: record.originalEmployeeStatus,
                status: 'cancelled',
              },
            },
            connection,
          );
        },
      },
      settle: {
        from: 'handover',
        to: 'completed',
        accept: ['settlementDate', 'settlementNote'],
        guard: async ({ record, actor, input, services }) => {
          if (
            actor.id === record.applicantId ||
            !services.directory.hasRole(actor.id, 'hr')
          )
            return false;
          if (!input.settlementDate || !input.settlementNote) return false;
          departureHrOutputsSchema.parse({
            lastWorkingDay: input.settlementDate,
          });
          if (
            typeof input.settlementNote !== 'string' ||
            !input.settlementNote.trim()
          )
            throw new DepartureError(
              'DEPARTURE_SETTLEMENT_NOTE_REQUIRED',
              'Departure requirements have not been satisfied.',
            );
          const work = await services.connection
            .repository<DepartureWorkRecord>('departureWorkItems')
            .findMany({ filter: { departureId: record.id } });
          if (
            work.length !== 4 ||
            !['work', 'it', 'admin', 'finance'].every((kind) =>
              work.some(
                (row) => row.kind === kind && row.status === 'completed',
              ),
            )
          )
            throw new DepartureError(
              'DEPARTURE_HANDOVER_INCOMPLETE',
              'Departure requirements have not been satisfied.',
            );
          return true;
        },
        onTransition: ({ record, actor, input, tx }) =>
          d.audit.record(
            {
              actorId: actor.id,
              action: 'departure.settle',
              targetType: 'departureRequests',
              targetId: record.id,
              after: { status: record.status },
              reason:
                typeof input.settlementNote === 'string'
                  ? input.settlementNote
                  : null,
            },
            tx.handle as DatabaseConnection,
          ),
      },
      returned: { from: reviews, to: 'revision', approvalOutcome: 'returned' },
      rejected: { from: reviews, to: 'rejected', approvalOutcome: 'rejected' },
      withdraw: {
        from: ['draft', 'revision', ...reviews],
        to: 'withdrawn',
        guard: async (context) =>
          (await owner(context)) && !context.record.hrInterviewCompleted,
      },
      terminate: {
        from: ['draft', 'revision', ...reviews],
        to: 'terminated',
        guard: ({ services, actor, input }) =>
          services.directory.hasRole(actor.id, 'approval.admin') &&
          typeof input.reason === 'string' &&
          input.reason.trim().length > 0,
        onTransition: ({ record, actor, input, tx }) =>
          d.audit.record(
            {
              actorId: actor.id,
              action: 'departure.terminate',
              targetType: 'departureRequests',
              targetId: record.id,
              reason: typeof input.reason === 'string' ? input.reason : null,
            },
            tx.handle as DatabaseConnection,
          ),
      },
    },
  });
}
