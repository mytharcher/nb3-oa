import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import { randomUUID } from 'node:crypto';
import {
  ApprovalService,
  approvalState,
  defineApproval,
  stagesFor,
  approve,
  reject,
  returnTo,
  commentAction,
  appointAction,
  reassignAction,
  readAction,
  type Approval,
  type PerformInput,
} from '@nocobase/app-plugin-approval/server';
import {
  LifecycleRuntime,
  createRepositoryLifecycleStore,
  type LifecycleStore,
  type LifecycleRecord,
  type JsonObject,
  type EffectDispatcher,
} from '@nocobase/lifecycle';
import type {
  DatabaseManager,
  DatabaseConnection,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import { LeaveError } from './errors.js';

import type { OrgService } from '../org/contract.js';
import type { AuditService } from '../audit/index.js';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { EmployeeService } from '../employees/contract.js';
import type {
  ApprovalDirectoryService,
  OaApprovalDirectory,
} from '../approval-directory/contract.js';
import type {
  CalendarService,
  DictionaryService,
  RuleService,
  SequenceService,
} from '../platform/index.js';
import type { ApprovalNotificationService } from '../approval-notifications/contract.js';

export const LEAVE_LIFECYCLE = 'oa.leave';
export interface LeaveRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  startHalf: 'am' | 'pm';
  endHalf: 'am' | 'pm';
  days: number | string;
  reason: string;
  attachments: string[];
  handoverUserId: string | null;
  enableDelegation: boolean;
  ruleSnapshot: JsonObject | null;
  hrRecipients: string[];
  requiresHr: boolean;
  managerApproverId: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
interface Services {
  directory: OaApprovalDirectory;
  connection?: DatabaseConnection;
}
interface Types {
  record: LeaveRecord;
  state:
    | 'draft'
    | 'revision'
    | 'manager'
    | 'head'
    | 'hr'
    | 'approved'
    | 'rejected'
    | 'withdrawn'
    | 'terminated';
  services: Services;
}
export interface LeaveDependencies {
  db: DatabaseManager;
  org: OrgService;

  audit: AuditService;
  users: UserAdministrationService;
  employees: EmployeeService;
  directory: ApprovalDirectoryService;
  calendar: CalendarService;
  dictionaries: DictionaryService;
  rules: RuleService;
  sequences: SequenceService;
  notifications: ApprovalNotificationService;
  dispatcher?: EffectDispatcher;
}
export function refuse(reason: string, message: string): never {
  throw new LeaveError(reason, message);
}
export type LeaveInput = Pick<
  LeaveRecord,
  | 'leaveType'
  | 'startDate'
  | 'endDate'
  | 'startHalf'
  | 'endHalf'
  | 'reason'
  | 'attachments'
  | 'handoverUserId'
  | 'enableDelegation'
>;
export function createLeaveService(d: LeaveDependencies) {
  let outside: Services;
  const readDirectory = new AsyncLocalStorage<OaApprovalDirectory>();
  const writePolicy = new AsyncLocalStorage<RepositoryPolicy>();
  const intervention = new AsyncLocalStorage<{
    actorId: string;
    recordId: string;
    action: string;
    reason: string | null;
    depth: number;
  }>();
  const snapshots = new WeakMap<object, Services>();
  const base = createRepositoryLifecycleStore(d.db, {
    collections: {
      transitions: 'oaLifecycleTransitions',
      effectRuns: 'oaLifecycleEffectRuns',
    },
  });
  // Directory callbacks are synchronous. The public store transaction is the boundary at which we load it,
  // before lifecycle and approval callbacks run; nested stores retain their own transaction snapshots.
  function wrap(store: LifecycleStore): LifecycleStore {
    return new Proxy(store, {
      get(target, key) {
        const policy = writePolicy.getStore();
        if (policy && key === 'createRecord')
          return async (
            collection: string,
            values: Readonly<Record<string, unknown>>,
          ) => {
            if (collection !== 'leaveRequests')
              return target.createRecord(collection, values);
            const connection = target.transactionHandle as DatabaseConnection;
            const row = await connection
              .repository(collection)
              .withPolicy(policy)
              .createOne({ values: values as RepositoryRecord });
            if (row.record.id === undefined)
              throw new LeaveError(
                'LEAVE_FIELDS_RESTRICTED',
                'The grant must expose the created leave record.',
                'permission',
              );
            return row.record as LifecycleRecord;
          };
        if (policy && key === 'updateRecordIf')
          return async (
            collection: string,
            id: string,
            condition: Parameters<LifecycleStore['updateRecordIf']>[2],
            values: Readonly<Record<string, unknown>>,
          ) => {
            if (collection !== 'leaveRequests')
              return target.updateRecordIf(collection, id, condition, values);
            const connection = target.transactionHandle as DatabaseConnection;
            const result = await connection
              .repository(collection)
              .withPolicy(policy)
              .updateMany({
                filter: {
                  id,
                  [condition.stateField]: condition.state,
                  [condition.versionField]: condition.version,
                },
                values: values as RepositoryRecord,
              });
            return result.updatedCount > 0;
          };

        if (key === 'transaction')
          return async <R>(
            work: (s: LifecycleStore) => Promise<R>,
            options?: Parameters<LifecycleStore['transaction']>[1],
          ) =>
            target.transaction(async (tx) => {
              const connection = tx.transactionHandle as DatabaseConnection;
              snapshots.set(connection, {
                directory:
                  readDirectory.getStore() ??
                  (await d.directory.snapshot(connection)),
                connection,
              });
              const change = intervention.getStore();
              if (change) change.depth++;
              try {
                const result = await work(wrap(tx));
                if (change?.depth === 1)
                  await d.audit.record(
                    {
                      actorId: change.actorId,
                      action: `leave.${change.action}`,
                      targetType: 'leaveRequests',
                      targetId: change.recordId,
                      reason: change.reason,
                    },
                    connection,
                  );
                return result;
              } finally {
                if (change) change.depth--;
              }
            }, options);
        const value: unknown = Reflect.get(target, key);
        return typeof value === 'function'
          ? (value as (...args: unknown[]) => unknown).bind(target)
          : value;
      },
    });
  }
  const source = (handle: unknown): Services =>
    handle ? snapshots.get(handle)! : outside;
  const runtime = new LifecycleRuntime({
    store: wrap(base),
    dispatcher: d.dispatcher,
  });
  const owner = ({
    record,
    actor,
  }: {
    record: LeaveRecord;
    actor: { id: string };
  }) => actor.id === record.applicantId || actor.id === record.createdById;
  const fields = [
    'leaveType',
    'startDate',
    'endDate',
    'startHalf',
    'endHalf',
    'reason',
    'attachments',
    'handoverUserId',
    'enableDelegation',
  ];
  const stage = stagesFor<Types>();
  const actions = [
    approve(),
    reject({ reason: 'required' }),
    returnTo({ targets: ['revision'], reason: 'required' }),
    commentAction,
    appointAction,
    reassignAction,
  ];
  const settings = {
    actions,
    onEmpty: 'hold' as const,
    reuse: 'unchanged' as const,
    remindAfterHours: 24,
    dueAfterHours: 48,
    onDue: 'escalate' as const,
  };
  function afterManager(
    record: LeaveRecord,
    directory: OaApprovalDirectory,
  ): Types['state'] {
    const head = directory.headOf(record.applicantId);
    if (
      Number(record.days) >= Number(record.ruleSnapshot?.['leave.head']) &&
      (!head || head !== record.managerApproverId)
    )
      return 'head';
    return record.requiresHr ||
      Number(record.days) >= Number(record.ruleSnapshot?.['leave.hr'])
      ? 'hr'
      : 'approved';
  }
  async function validate(record: LeaveRecord, connection: DatabaseConnection) {
    const employee = await d.employees.getByUserId(
      record.applicantId,
      connection,
    );
    if (!employee?.active || employee.status === 'left')
      refuse(
        'LEAVE_EMPLOYEE_INACTIVE',
        'An active employee archive is required.',
      );
    const kind = await d.dictionaries.get(
      'leaveType',
      record.leaveType,
      connection,
    );
    if (!kind?.active)
      refuse('LEAVE_TYPE_UNAVAILABLE', 'The leave type is unavailable.');
    if (
      kind.extra?.deductsBalance ||
      ['annual', 'compensatory'].includes(record.leaveType)
    )
      refuse(
        'LEAVE_BALANCE_UNAVAILABLE',
        'Balance-backed leave cannot be submitted until the leave ledger is available.',
      );
    const days = d.calendar.workdaysBetween(record.startDate, record.endDate, {
      startHalf: record.startHalf,
      endHalf: record.endHalf,
    });
    if (record.attachments.length)
      refuse(
        'LEAVE_ATTACHMENTS_UNAVAILABLE',
        'Attachment-backed leave is unavailable until secure file validation is implemented.',
      );
    if (days <= 0)
      refuse(
        'LEAVE_NO_WORKDAYS',
        'The requested range contains no working half-days.',
      );
    if (typeof kind.extra?.maxDays === 'number' && days > kind.extra.maxDays)
      refuse('LEAVE_MAX_DAYS', 'The leave type maximum is exceeded.');
    if (
      ((kind.extra?.requiresAttachment &&
        (typeof kind.extra.attachmentAboveDays !== 'number' ||
          days > kind.extra.attachmentAboveDays)) ||
        (record.leaveType === 'sick' && days > 1)) &&
      !record.attachments.length
    )
      refuse(
        'LEAVE_ATTACHMENT_REQUIRED',
        'This leave type requires supporting attachments.',
      );
    if (
      record.enableDelegation &&
      (!record.handoverUserId || record.handoverUserId === record.applicantId)
    )
      refuse(
        'LEAVE_DELEGATE_REQUIRED',
        'Choose a different active employee as delegate.',
      );
    if (record.handoverUserId) {
      const person = await d.employees.getByUserId(
        record.handoverUserId,
        connection,
      );
      if (!person?.active)
        refuse('LEAVE_HANDOVER_INACTIVE', 'The handover employee is inactive.');
    }
    const rows = await connection
      .repository<LeaveRecord>('leaveRequests')
      .findMany({
        filter: (f) =>
          f.and([
            f.string('applicantId').eq(record.applicantId),
            f.or(
              ['manager', 'head', 'hr', 'revision', 'approved'].map((s) =>
                f.string('status').eq(s),
              ),
            ),
          ]),
      });
    const start = `${record.startDate}:${record.startHalf === 'am' ? '0' : '1'}`,
      end = `${record.endDate}:${record.endHalf === 'am' ? '0' : '1'}`;
    if (
      rows.some(
        (r) =>
          r.id !== record.id &&
          `${r.startDate}:${r.startHalf === 'am' ? '0' : '1'}` <= end &&
          `${r.endDate}:${r.endHalf === 'am' ? '0' : '1'}` >= start,
      )
    )
      refuse(
        'LEAVE_OVERLAP',
        'This period overlaps an approved or pending leave request.',
      );
    return { days, requiresHr: Boolean(kind.extra?.requiresHr) };
  }
  const approval = defineApproval<Types>({
    name: LEAVE_LIFECYCLE,
    collection: 'leaveRequests',
    initial: 'draft',
    version: 1,
    applicant: (r) => r.applicantId,
    directory: (s) => s.directory,
    calendar: () => d.calendar.approvalCalendar(),
    freeze: [...fields, 'days'],
    adminRole: 'approval.admin',
    afterEnd: [readAction],
    copies: { on: 'final', recipients: (r) => r.hrRecipients },
    notify: async ({ task, reason, services }) => {
      const record = await d.db
        .repository<LeaveRecord>('leaveRequests')
        .findOne({ filter: { id: task.recordId } });
      await d.notifications.task({
        task,
        reason,
        directory: services.directory,
        applicantId: record?.applicantId,
        kind: LEAVE_LIFECYCLE,
        at: new Date().toISOString(),
      });
    },
    states: [
      'draft',
      'revision',
      approvalState(
        'manager',
        stage.single({
          ...settings,
          assignee: ({ record, directory }) =>
            directory.managerOf(record.applicantId),
        }),
      ),
      approvalState(
        'head',
        stage.single({
          ...settings,
          assignee: ({ record, services }) =>
            services.directory.headOf(record.applicantId),
        }),
      ),
      approvalState(
        'hr',
        stage.any({
          ...settings,
          pools: [
            {
              key: 'hr',
              candidates: ({ services }) =>
                services.directory.roleMembers('hr'),
            },
          ],
          covers: [...fields, 'days'],
        }),
      ),
      ...(['approved', 'rejected', 'withdrawn', 'terminated'] as const).map(
        (name) => ({ name, final: true }),
      ),
    ],
    create: {
      guard: ({ values, actor, services }) =>
        values.applicantId === actor.id ||
        services.directory.hasRole(actor.id, 'hr'),
    },
    transitions: {
      edit: {
        from: ['draft', 'revision'],
        to: ['draft', 'revision'],
        guard: owner,
        route: ({ record }) => record.status as 'draft' | 'revision',
        accept: fields,
      },
      submit: {
        from: ['draft', 'revision'],
        to: 'manager',
        guard: owner,
        set: async ({ record, services, now }) => {
          const connection = services.connection!;
          await lockUserForAdministration(connection, record.applicantId);
          const checked = await validate(record, connection);
          const snapshot =
            record.ruleSnapshot ??
            (await d.rules.snapshot(
              [
                'leave.head',
                'leave.hr',
                'sla.remindHours',
                'sla.escalateHours',
                'sla.urgeCooldownHours',
              ],
              now,
              connection,
            ));
          if (
            snapshot['sla.remindHours'] !== 24 ||
            snapshot['sla.escalateHours'] !== 48
          )
            refuse(
              'LEAVE_SLA_CONFIGURATION_UNSUPPORTED',
              'This release supports the default 24/48 working-hour approval clocks only.',
            );
          return {
            ...checked,
            days: String(checked.days),
            ruleSnapshot: snapshot,
            number:
              record.number ??
              (await d.sequences.next('LEAVE', connection, now)),
            hrRecipients: [...services.directory.roleMembers('hr')],
            managerApproverId:
              services.directory.managerOf(record.applicantId) ?? null,
          };
        },
      },
      managerApproved: {
        from: 'manager',
        to: ['head', 'hr', 'approved'],
        approvalOutcome: 'approved',
        route: ({ record, services }) =>
          afterManager(record, services.directory),
      },
      headApproved: {
        from: 'head',
        to: ['hr', 'approved'],
        approvalOutcome: 'approved',
        route: ({ record }) =>
          record.requiresHr ||
          Number(record.days) >= Number(record.ruleSnapshot?.['leave.hr'])
            ? 'hr'
            : 'approved',
      },
      hrApproved: { from: 'hr', to: 'approved', approvalOutcome: 'approved' },
      rejected: {
        from: ['manager', 'head', 'hr'],
        to: 'rejected',
        approvalOutcome: 'rejected',
      },
      returned: {
        from: ['manager', 'head', 'hr'],
        to: 'revision',
        approvalOutcome: 'returned',
      },
      withdraw: {
        from: ['draft', 'revision', 'manager', 'head', 'hr'],
        to: 'withdrawn',
        guard: owner,
      },
      terminate: {
        onTransition: ({ record, actor, input, tx }) =>
          d.audit.record(
            {
              actorId: actor.id,
              action: 'leave.terminate',
              targetType: 'leaveRequests',
              targetId: record.id,
              reason: typeof input.reason === 'string' ? input.reason : null,
            },
            tx.handle as DatabaseConnection,
          ),
        from: ['revision', 'manager', 'head', 'hr'],
        to: 'terminated',
        guard: ({ actor, services, input }) =>
          services.directory.hasRole(actor.id, 'approval.admin') &&
          typeof input.reason === 'string' &&
          input.reason.trim().length > 0,
      },
    },
    onEnterState: {
      approved: async ({ record, tx, now }) => {
        const connection = tx.handle as DatabaseConnection;
        await connection.repository('leaveAttendance').createOne({
          values: {
            id: randomUUID(),
            applicationId: record.id,
            userId: record.applicantId,
            startDate: record.startDate,
            endDate: record.endDate,
            startHalf: record.startHalf,
            endHalf: record.endHalf,
            days: record.days,
            createdAt: now.toISOString(),
          },
        });
        if (record.enableDelegation && record.handoverUserId)
          await d.directory.createLeaveDelegation(
            {
              principalId: record.applicantId,
              delegateId: record.handoverUserId,
              scope: 'all',
              from: localInstant(
                record.startDate,
                workBoundary(
                  record.startDate,
                  record.startHalf === 'am' ? 'start' : 'middle',
                ),
              ),
              to: localInstant(
                record.endDate,
                workBoundary(
                  record.endDate,
                  record.endHalf === 'am' ? 'middle' : 'end',
                ),
              ),
              sourceApplication: record.id,
            },
            { actorId: record.createdById, connection },
          );
      },
    },
    onEnter: Object.fromEntries(
      ['approved', 'rejected', 'revision'].map((state) => [
        state,
        [
          {
            name: `leave.notify.${state}`,
            retry: { attempts: 5, backoffMs: 1000 },
            run: ({
              record,
              idempotencyKey,
            }: {
              record: LeaveRecord;
              idempotencyKey: string;
            }) =>
              d.notifications.result({
                recordId: record.id,
                applicantId: record.applicantId,
                state,
                transitionId: idempotencyKey,
              }),
          },
        ],
      ]),
    ),
  });
  runtime.register(approval, { services: source });
  const approvals = new ApprovalService(
    runtime,
    [approval.approval as unknown as Approval<never>],
    source,
  );
  // Conversion uses Intl for the application's calendar time zone, never the server's local zone.
  function workBoundary(
    date: string,
    boundary: 'start' | 'middle' | 'end',
  ): number {
    const hours = d.calendar.workHoursOn(date);
    const minutes = (v: string) => {
      const [h, m] = v.split(':').map(Number);
      return h + m / 60;
    };
    const start = minutes(hours.start),
      end = minutes(hours.end);
    return boundary === 'start'
      ? start
      : boundary === 'end'
        ? end
        : (start + end) / 2;
  }
  function localInstant(date: string, hour: number): string {
    const utc = Date.parse(
      `${date}T${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}:00Z`,
    );
    const format = new Intl.DateTimeFormat('en-CA', {
      timeZone: d.calendar.timeZone(),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = Object.fromEntries(
      format.formatToParts(new Date(utc)).map((p) => [p.type, p.value]),
    );
    const interpreted = Date.parse(
      `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`,
    );
    return new Date(utc - (interpreted - utc)).toISOString();
  }
  async function refresh() {
    outside = { directory: await d.directory.snapshot() };
  }
  async function canRead(
    id: string,
    actorId: string,
    policy?: RepositoryPolicy,
  ) {
    await refresh();
    const r = await d.db
      .repository<LeaveRecord>('leaveRequests')
      .findOne({ filter: { id } });
    if (!r)
      throw new LeaveError(
        'LEAVE_NOT_FOUND',
        'Leave request not found.',
        'notFound',
      );
    if (
      r.createdById === actorId ||
      r.applicantId === actorId ||
      (await approvals.involvementOf(LEAVE_LIFECYCLE, id, actorId)).length ||
      Boolean(
        policy &&
        (await d.db
          .repository<LeaveRecord>('leaveRequests')
          .withPolicy(policy)
          .findOne({ filter: { id } })),
      )
    )
      return r;
    throw new LeaveError(
      'LEAVE_ACCESS_DENIED',
      'This leave request is not accessible.',
      'permission',
    );
  }
  function fullRows(rows: Partial<LeaveRecord>[]): LeaveRecord[] {
    const fields = [
      'id',
      'applicantId',
      'createdById',
      'number',
      'leaveType',
      'startDate',
      'endDate',
      'startHalf',
      'endHalf',
      'days',
      'reason',
      'attachments',
      'handoverUserId',
      'enableDelegation',
      'ruleSnapshot',
      'hrRecipients',
      'requiresHr',
      'managerApproverId',
      'status',
      'lifecycleVersion',
      'createdAt',
    ];
    if (rows.some((row) => fields.some((field) => !(field in row))))
      throw new LeaveError(
        'LEAVE_FIELDS_RESTRICTED',
        'This release requires all leave business fields for reading.',
        'permission',
      );
    return rows as LeaveRecord[];
  }
  async function enrich(records: LeaveRecord[]) {
    const ids = [
      ...new Set(
        records
          .flatMap((r) => [
            r.applicantId,
            r.createdById,
            r.handoverUserId,
            r.managerApproverId,
            ...r.hrRecipients,
          ])
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const users = new Map(
      (await Promise.all(ids.map((id) => d.users.get(id))))
        .filter((u) => u !== undefined)
        .map((u) => [u.id, { id: u.id, name: u.name }]),
    );
    return records.map((r) => ({
      ...r,
      applicant: users.get(r.applicantId) ?? null,
      createdBy: users.get(r.createdById) ?? null,
      handoverUser: r.handoverUserId
        ? (users.get(r.handoverUserId) ?? null)
        : null,
      managerApprover: r.managerApproverId
        ? (users.get(r.managerApproverId) ?? null)
        : null,
      hrUsers: r.hrRecipients
        .map((id) => users.get(id))
        .filter((u) => u !== undefined),
    }));
  }
  async function notifyHeld(id: string) {
    const views = await approvals.runViewsFor(LEAVE_LIFECYCLE, id);
    for (const view of views) {
      if (view.run.status === 'open' && view.tasks.length === 0)
        await d.notifications.alarm({
          recordId: id,
          recipients: outside.directory.roleMembers('approval.admin'),
          eventId: `hold:${view.run.id}`,
          reason: 'unassigned',
        });
    }
  }
  return {
    initialize: refresh,
    async readableIds(actorId: string) {
      await refresh();
      return readDirectory.run(outside.directory, async () => {
        const records = await d.db
          .repository<LeaveRecord>('leaveRequests')
          .findMany();
        const ids: string[] = [];
        for (const record of records) {
          const involvement = await approvals.involvementOf(
            LEAVE_LIFECYCLE,
            record.id,
            actorId,
          );
          const runs = await approvals.runViewsFor(LEAVE_LIFECYCLE, record.id);
          let head = false;
          const dept = await d.org.primaryDepartmentOf(record.applicantId);
          if (dept)
            head = Boolean(
              (await d.org.activeChain(dept.id))?.some(
                (d) => d.managerId === actorId,
              ),
            );
          if (
            record.applicantId === actorId ||
            record.createdById === actorId ||
            involvement.length ||
            runs.some((r) => r.tasks.some((t) => t.actorId === actorId)) ||
            outside.directory.hasRole(actorId, 'hr') ||
            outside.directory.hasRole(actorId, 'gm') ||
            outside.directory.hasRole(actorId, 'approval.admin') ||
            head ||
            (await d.employees.isAboveInReportingLine(
              actorId,
              record.applicantId,
            ))
          )
            ids.push(record.id);
        }
        return ids;
      });
    },
    runtime,
    approvals,
    async create(
      input: LeaveInput,
      actorId: string,
      applicantId = actorId,
      policy?: RepositoryPolicy,
    ) {
      await refresh();
      const create = () =>
        runtime.create(
          LEAVE_LIFECYCLE,
          {
            id: randomUUID(),
            ...input,
            applicantId,
            createdById: actorId,
            number: null,
            days: 0,
            ruleSnapshot: null,
            hrRecipients: [],
            requiresHr: false,
            managerApproverId: null,
            createdAt: new Date().toISOString(),
          },
          { actor: { id: actorId } },
        );
      return policy ? writePolicy.run(policy, create) : create();
    },
    async transition(
      id: string,
      transition: string,
      actorId: string,
      version: number,
      requestId: string,
      input: JsonObject = {},
      policy?: RepositoryPolicy,
      mutationPolicy?: RepositoryPolicy,
    ) {
      await canRead(id, actorId, policy);
      const fire = () =>
        runtime.fire(LEAVE_LIFECYCLE, id, transition, {
          manual: true,
          actor: { id: actorId },
          input,
          expect: { version },
          requestId,
        });
      return mutationPolicy ? writePolicy.run(mutationPolicy, fire) : fire();
    },
    async action(
      id: string,
      input: Omit<PerformInput, 'actor'>,
      actorId: string,
      policy?: RepositoryPolicy,
    ) {
      await canRead(id, actorId, policy);
      const views = await approvals.runViewsFor(LEAVE_LIFECYCLE, id);
      const target = input.target;
      if (
        !views.some((v) =>
          'runId' in target
            ? v.run.id === target.runId
            : v.tasks.some((t) => t.id === target.taskId),
        )
      )
        throw new LeaveError(
          'LEAVE_TARGET_MISMATCH',
          'The action target belongs to another request.',
          'permission',
        );
      const perform = () =>
        approvals.perform({ ...input, actor: { id: actorId } });
      return ['appoint', 'reassign'].includes(input.action)
        ? intervention.run(
            {
              actorId,
              recordId: id,
              action: input.action,
              reason: input.comment ?? null,
              depth: 0,
            },
            perform,
          )
        : perform();
    },
    async detail(id: string, actorId: string, policy?: RepositoryPolicy) {
      const record = await canRead(id, actorId, policy);
      return readDirectory.run(outside.directory, async () => {
        const actor = { id: actorId };
        const runs = await approvals.runViewsFor(LEAVE_LIFECYCLE, id);
        const userIds = [
          ...new Set(
            [
              record.applicantId,
              record.createdById,
              record.handoverUserId,
              record.managerApproverId,
              ...record.hrRecipients,
              ...runs.flatMap((v) =>
                v.tasks.flatMap((t) => [t.assigneeId, t.actorId]),
              ),
            ].filter((v): v is string => Boolean(v)),
          ),
        ];
        const users = (await Promise.all(userIds.map((id) => d.users.get(id))))
          .filter((v) => v !== undefined)
          .map((v) => ({ id: v.id, name: v.name }));
        return {
          record,
          users,
          view: await runtime.view(LEAVE_LIFECYCLE, id, actor),
          runs: await approvals.runViewsFor(LEAVE_LIFECYCLE, id),
          taskActions: await approvals.actionsFor(LEAVE_LIFECYCLE, id, actor),
          runActions: await approvals.runActionsFor(LEAVE_LIFECYCLE, id, actor),
          upcoming: await approvals.upcomingStagesFor(
            LEAVE_LIFECYCLE,
            id,
            actor,
          ),
          timeline: await approvals.timelineFor(LEAVE_LIFECYCLE, id),
        };
      });
    },
    async list(actorId: string, view: string, policy?: RepositoryPolicy) {
      await refresh();
      return readDirectory.run(outside.directory, async () => {
        const repository = d.db.repository<LeaveRecord>('leaveRequests');
        const scoped = policy ? repository.withPolicy(policy) : repository;
        if (view === 'mine')
          return enrich(
            fullRows(
              await scoped.findMany({
                filter: (f) =>
                  f.or([
                    f.string('applicantId').eq(actorId),
                    f.string('createdById').eq(actorId),
                  ]),
                sort: (s) => [s.field('createdAt').desc()],
              }),
            ),
          );
        // Query-only tasksOf does not include proxies or previously acting delegates. The host checks actual
        // offered operations and persisted actor identities over each request before exposing it in the center.
        const records = fullRows(
          await scoped.findMany({
            sort: (s) => [s.field('createdAt').desc()],
          }),
        );
        const selected: LeaveRecord[] = [];
        for (const record of records) {
          const runs = await approvals.runViewsFor(LEAVE_LIFECYCLE, record.id);
          const tasks = runs.flatMap((r) => r.tasks);
          const match =
            view === 'copied'
              ? tasks.some((t) => t.kind === 'copy' && t.assigneeId === actorId)
              : view === 'done'
                ? tasks.some(
                    (t) =>
                      t.actorId === actorId &&
                      ['completed', 'transferred'].includes(t.status),
                  )
                : (
                    await approvals.actionsFor(LEAVE_LIFECYCLE, record.id, {
                      id: actorId,
                    })
                  ).some((a) =>
                    tasks.some((t) => t.id === a.task.id && t.role !== 'info'),
                  );
          if (match) selected.push(record);
        }
        return enrich(selected);
      });
    },
    async options() {
      return {
        leaveTypes: await d.dictionaries.list('leaveType'),
        balanceAvailable: false,
        timeZone: d.calendar.timeZone(),
      };
    },
    async preview(input: LeaveInput, actorId: string) {
      await refresh();
      const ruleSnapshot = await d.rules.snapshot(['leave.head', 'leave.hr']);
      const record = {
        id: 'preview',
        ...input,
        applicantId: actorId,
        createdById: actorId,
        days: d.calendar.workdaysBetween(input.startDate, input.endDate, input),
        ruleSnapshot,
        status: 'draft',
        lifecycleVersion: 0,
        hrRecipients: [],
        requiresHr: Boolean(
          (await d.dictionaries.get('leaveType', input.leaveType))?.extra
            ?.requiresHr,
        ),
        managerApproverId: outside.directory.managerOf(actorId) ?? null,
      };
      const route = await approvals.previewRoute({
        lifecycle: LEAVE_LIFECYCLE,
        record,
        actor: { id: actorId },
        submit: 'submit',
      });
      const ids = [
        ...new Set([actorId, ...route.steps.flatMap((step) => step.people)]),
      ];
      const users = (await Promise.all(ids.map((id) => d.users.get(id))))
        .filter((user) => user !== undefined)
        .map((user) => ({ id: user.id, name: user.name }));
      return {
        days: record.days,
        route,
        users,
      };
    },
    async maintenance() {
      await refresh();
      const sweep = await approvals.sweepReport();
      await runtime.reclaim();
      await runtime.recover();
      const held = await d.db
        .repository<LeaveRecord>('leaveRequests')
        .findMany({
          filter: (f) =>
            f.or(
              ['manager', 'head', 'hr'].map((s) => f.string('status').eq(s)),
            ),
        });
      for (const record of held) await notifyHeld(record.id);
      return sweep;
    },
  };
}
export type LeaveService = ReturnType<typeof createLeaveService>;
export const leaveServiceToken =
  createServiceToken<LeaveService>('oa/leave-service');
