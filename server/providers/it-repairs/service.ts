import { requestConnectionRead } from '../request-performance/business-reads.js';
import { createRepairQueries, metricsOf, METRIC_FIELDS } from './reporting.js';
import type { Knex } from 'knex';
import type { FilterBuilder } from '@nocobase/db';
import { createHash, randomUUID } from 'node:crypto';
import {
  lockUserForAdministration,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import {
  LifecycleRuntime,
  LifecycleError,
  defineLifecycle,
  defineEffect,
  type EffectDispatcher,
  type JsonObject,
} from '@nocobase/lifecycle';
import type { UserTaskWriter } from '@nocobase/app-plugin-task-center/server';
import type { ServerFileRepositoryManager } from '@nocobase/app-plugin-file/server';
import { createAppLifecycleStore } from '../approval-runtime/repository-store.js';
import type { AuditService } from '../audit/index.js';
import type { EmployeeService } from '../employees/contract.js';
import type { OrgService } from '../org/contract.js';
import type { AssetService } from '../assets/contract.js';
import type { DictionaryService } from '../platform/dictionaries.js';
import type { RuleService } from '../platform/rules.js';
import type { SequenceService } from '../platform/sequences.js';
import {
  FrozenCalendar,
  type CalendarSnapshot,
  type CalendarService,
} from '../platform/index.js';

import {
  STATES,
  OPEN,
  edges,
  clock,
  deadlines,
  settleThresholds,
  type Action,
  type Processing,
} from './handling.js';
export const CATEGORIES = [
  'device',
  'network',
  'software',
  'account',
  'other',
] as const;
export const IMPACTS = ['unable', 'partial', 'multiple', 'outage'] as const;
export const INPUT_FIELDS = [
  'title',
  'description',
  'category',
  'impact',
  'location',
  'contact',
  'occurredAt',
  'assetId',
] as const;
export const FIELDS = [
  ...METRIC_FIELDS,
  'id',
  'requesterId',
  'number',
  ...INPUT_FIELDS,
  'groupId',
  'priority',
  'status',
  'version',
  'createdAt',
  'updatedAt',
  'statusChangedAt',
  'submittedAt',
  'responseDueAt',
  'resolutionDueAt',
  'submissionSnapshot',
  'calendarSnapshot',
  'ruleSnapshot',
  'assigneeId',
  'processing',
  'nextDueAt',
] as const;
export interface Repair extends RepositoryRecord {
  id: string;
  requesterId: string;
  number: string | null;
  title: string;
  description: string;
  category: string;
  impact: string;
  location: string;
  contact: string;
  occurredAt: string | null;
  assetId: string | null;
  groupId: string | null;
  priority: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  responseDueAt: string | null;
  resolutionDueAt: string | null;
  assigneeId?: string | null;
  processing?: Processing | null;
}
export interface Group extends RepositoryRecord {
  security?: boolean;
  routingCursor?: string | null;
  id: string;
  title: string;
  leaderIds: string[];
  engineerIds: string[];
  categories: string[];
  active: boolean;
  version: number;
}
export interface Command {
  actorId: string;
  requestKey: string;
  id?: string;
  expectedVersion?: number;
}
export type Draft = Pick<Repair, (typeof INPUT_FIELDS)[number]>;
export class RepairError extends Error {
  constructor(
    public readonly code: string,
    public readonly field?: string,
  ) {
    super(code);
  }
}
export function fail(code: string, field?: string): never {
  throw new RepairError(code, field);
}
const hash = (value: unknown): string =>
  createHash('sha256')
    .update(
      JSON.stringify(value, (_k, v: unknown) =>
        v && typeof v === 'object' && !Array.isArray(v)
          ? Object.fromEntries(
              Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
            )
          : v,
      ),
    )
    .digest('hex');
export const RULE_KEYS = [
  'calendar.timeZone',
  'itRepair.morning',
  'itRepair.afternoon',
  'itRepair.acceptanceDays',
  'itRepair.followUpDays',
  ...['P1', 'P2', 'P3', 'P4'].flatMap((p) => [
    `itRepair.${p}.response`,
    `itRepair.${p}.resolution`,
  ]),
];
export function validateDraft(input: Draft, submit: boolean, now: Date) {
  for (const [key, max] of [
    ['title', 120],
    ['description', 5000],
    ['location', 200],
    ['contact', 200],
  ] as const)
    if (
      typeof input[key] !== 'string' ||
      input[key].trim().length > max ||
      (submit && key !== 'contact' && !input[key].trim())
    )
      fail('INVALID_INPUT', key);
  if (
    (input.category &&
      !(CATEGORIES as readonly string[]).includes(input.category)) ||
    (submit && !input.category)
  )
    fail('INVALID_INPUT', 'category');
  if (
    (input.impact && !(IMPACTS as readonly string[]).includes(input.impact)) ||
    (submit && !input.impact)
  )
    fail('INVALID_INPUT', 'impact');
  if (
    input.occurredAt &&
    (!Number.isFinite(+new Date(input.occurredAt)) ||
      +new Date(input.occurredAt) > +now)
  )
    fail('INVALID_INPUT', 'occurredAt');
}
/** Validation and digest happen before the business row is locked or a storage operation begins. */
export async function validateFile(file: File) {
  if (file.size < 1 || file.size > 20 * 1024 * 1024) fail('INVALID_ATTACHMENT');
  const bytes = new Uint8Array(await file.arrayBuffer()),
    ext = file.name.split('.').at(-1)?.toLowerCase();
  let valid = false;
  if (ext === 'png')
    valid =
      file.type === 'image/png' &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (ext === 'jpg' || ext === 'jpeg')
    valid =
      file.type === 'image/jpeg' &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255;
  if (ext === 'pdf')
    valid =
      file.type === 'application/pdf' &&
      new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-';
  if (ext === 'txt' || ext === 'log') {
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      valid =
        file.type === 'text/plain' &&
        !bytes.some((byte) => byte < 32 && ![9, 10, 13].includes(byte)) &&
        !/^\s*(?:<!doctype|<html|<svg)/iu.test(text);
    } catch {
      valid = false;
    }
  }
  if (!valid) fail('INVALID_ATTACHMENT');
  return createHash('sha256').update(bytes).digest('hex');
}

export function createRepairService(d: {
  db: DatabaseManager;
  audit: AuditService;
  employees: EmployeeService;
  org: OrgService;
  users: UserAdministrationService;
  assets: AssetService;
  calendar: CalendarService;
  dictionaries: DictionaryService;
  rules: RuleService;
  sequences: SequenceService;
  files: ServerFileRepositoryManager;
  writer: UserTaskWriter;
  onLockAcquired?: (milliseconds: number) => void;
  dispatcher?: EffectDispatcher;
  now?: () => Date;
  readOnly?: boolean;
  references?: {
    summary(
      kind: string,
      actorId: string,
      policy: RepositoryPolicy,
      id: string,
      tx: DatabaseConnection,
    ): Promise<{
      id: string;
      number: string;
      status: string;
      version: number;
    } | null>;
    changes(
      kind: string,
      id: string,
      cursor: number,
      tx: DatabaseConnection,
    ): Promise<
      {
        id: string;
        sourceId: string;
        status: string;
        version: number;
        at: string;
      }[]
    >;
    receipts(
      id: string,
      tx: DatabaseConnection,
    ): Promise<{ id: string; status: string; version: number }[]>;
  };
  notify: (
    id: string,
    number: string,
    recipients: string[],
    key: string,
    mode?: 'handover',
  ) => Promise<void>;
}) {
  const assertWritable = () => {
    if (d.readOnly) fail('READ_ONLY');
  };
  const now = () => d.now?.() ?? new Date();
  // This service never writes user/employee facts. Group-writing commands are
  // excluded from group reuse; their own writes must be read back from the DB.
  // Each attempt owns its context and drops it before commit/effect dispatch.
  type UserFact = Awaited<ReturnType<UserAdministrationService['get']>>;
  type EmployeeFact = Awaited<ReturnType<EmployeeService['getByUserId']>>;
  const attempts = new WeakMap<
    DatabaseConnection,
    {
      users: Map<string, Promise<UserFact>>;
      employees: Map<string, Promise<EmployeeFact>>;
      groups: Map<string, Promise<Group | undefined>>;
      lockedGroups: Set<string>;
      reuseGroups: boolean;
    }
  >();
  function fact<T>(
    cache: Map<string, Promise<T>> | undefined,
    id: string,
    read: () => Promise<T>,
  ) {
    if (!cache) return read();
    let result = cache.get(id);
    if (!result) {
      result = read();
      cache.set(id, result);
      void result.catch(() => cache.delete(id));
    }
    return result;
  }
  const userFact = (id: string, tx: DatabaseConnection) =>
    fact(attempts.get(tx)?.users, id, () => d.users.withConnection(tx).get(id));
  const employeeFact = (id: string, tx: DatabaseConnection) =>
    fact(attempts.get(tx)?.employees, id, () =>
      d.employees.getByUserId(id, tx),
    );
  async function active(id: string, tx: DatabaseConnection) {
    return requestConnectionRead(
      d.db.connection(),
      tx,
      `repair:active:${id}`,
      async () => {
        const user = await userFact(id, tx);
        const e = await employeeFact(id, tx);
        return !!user && !user.disabledAt && !!e?.active && e.status !== 'left';
      },
    );
  }
  async function groups(tx: DatabaseConnection) {
    return requestConnectionRead(
      d.db.connection(),
      tx,
      'repair:groups',
      async () =>
        await tx
          .repository<Group>('itRepairGroups')
          .findMany({ filter: { active: true } }),
    );
  }
  async function leaderGroups(actorId: string, tx: DatabaseConnection) {
    return (await groups(tx))
      .filter((g) => g.leaderIds.includes(actorId))
      .map((g) => g.id);
  }
  async function leadsRecordGroup(
    row: Repair,
    actorId: string,
    tx: DatabaseConnection,
  ) {
    const context = attempts.get(tx);
    if (
      context?.reuseGroups &&
      row.groupId &&
      context.lockedGroups.has(row.groupId)
    )
      return !!(await groupFor(row, tx))?.leaderIds.includes(actorId);
    return (await leaderGroups(actorId, tx)).includes(row.groupId ?? '');
  }
  async function canRead(row: Repair, actorId: string, tx: DatabaseConnection) {
    return (
      (await active(actorId, tx)) &&
      (row.requesterId === actorId ||
        (row.status !== 'draft' &&
          ((await leadsRecordGroup(row, actorId, tx)) ||
            ((await qualified(row, actorId, tx)) &&
              (row.status === 'pool' || row.assigneeId === actorId)))))
    );
  }
  async function get(
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
    tx = d.db.connection(),
  ) {
    const row = await tx
      .repository<Repair>('itRepairs')
      .withPolicy(policy)
      .findOne({ filter: { id } });
    if (
      !row ||
      FIELDS.some((f) => !(f in row)) ||
      !(await canRead(row as Repair, actorId, tx))
    )
      fail('ACCESS_DENIED');
    return row as Repair;
  }
  const notice = defineEffect<{ record: Repair; state: string }>({
    name: 'oa.itRepair.submitted',
    retry: { attempts: 8, backoffMs: 5000, factor: 2 },
    run: async ({ record }) => {
      assertWritable();
      const current = await d.db
        .repository<Repair>('itRepairs')
        .findOne({ filter: { id: record.id } });
      if (!current || current.status === 'draft') return;
      const group = current.groupId
        ? await d.db
            .repository<Group>('itRepairGroups')
            .findOne({ filter: { id: current.groupId, active: true } })
        : undefined;
      const recipients: string[] = [];
      for (const id of new Set([
        current.requesterId,
        ...(group?.leaderIds ?? []),
      ]))
        if (await active(id, d.db.connection())) recipients.push(id);
      // Routing recovery may create another effect, but receipt identity stays per intake/recipient.
      for (const userId of recipients)
        await d.notify(
          current.id,
          current.number!,
          [userId],
          `oa.itRepair:${current.id}:submitted:${userId}`,
        );
      if (
        !group?.leaderIds.some(
          (id) => id !== current.requesterId && recipients.includes(id),
        )
      )
        throw new Error('IT_REPAIR_GROUP_UNCONFIGURED');
    },
  });
  const updateNotice = defineEffect<{ record: Repair; state: string }>({
    name: 'oa.itRepair.updated',
    retry: { attempts: 8, backoffMs: 5000, factor: 2 },
    run: async ({ record, input, transition, idempotencyKey }) => {
      assertWritable();
      const current = await d.db
        .repository<Repair>('itRepairs')
        .findOne({ filter: { id: record.id } });
      if (!current) return;
      const tx = d.db.connection();
      const intent = input.processing as Processing | undefined;
      const g = await groupFor(current, tx);
      const internal =
        transition.startsWith('internal_') ||
        transition.startsWith('uploadInternal_');
      const recipients = intent?.noticeRecipients ?? [
        ...new Set([
          ...(g?.leaderIds ?? []),
          ...(current.assigneeId ? [current.assigneeId] : []),
          ...(!internal ? [current.requesterId] : []),
        ]),
      ];
      for (const id of recipients)
        if (
          !(internal && id === current.requesterId) &&
          (await active(id, tx)) &&
          (await canRead(current, id, tx))
        )
          await d.notify(
            current.id,
            current.number!,
            [id],
            `${idempotencyKey}:${id}`,
          );
      // A former assignee receives only the persisted handover fact, never a read grant or a detail target.
      for (const id of intent?.handoverRecipients ?? [])
        if (await active(id, tx))
          await d.notify(
            current.id,
            current.number!,
            [id],
            `${idempotencyKey}:handover:${id}`,
            'handover',
          );
    },
  });
  const projectMetrics = async ({
    record,
    transactionHandle,
  }: {
    record: Repair;
    transactionHandle: unknown;
  }) => {
    const tx = transactionHandle as DatabaseConnection;
    await tx.repository('itRepairs').updateMany({
      filter: { id: record.id, version: record.version },
      values: metricsOf(record, now()),
    });
  };
  const lifecycle = defineLifecycle<{ record: Repair; state: string }>({
    name: 'oa.itRepair',
    collection: 'itRepairs',
    initial: 'draft',
    versionField: 'version',
    states: STATES.map((name) =>
      name === 'cancelled' ? { name, final: true } : name,
    ),
    transitions: {
      ...Object.fromEntries(
        Object.entries(edges()).map(([key, edge]) => [
          key,
          {
            ...edge,
            onTransition: projectMetrics,
            effects: key.startsWith('timer_') ? [] : [updateNotice],
          },
        ]),
      ),
      edit: {
        from: 'draft',
        to: 'draft',
        accept: [...INPUT_FIELDS, 'updatedAt'],
      },
      upload: { from: 'draft', to: 'draft', accept: ['updatedAt'] },
      refreshRouting: {
        from: 'triage',
        to: 'triage',
        accept: ['updatedAt', 'groupId'],
        onTransition: projectMetrics,
        effects: [notice],
      },
      submit: {
        from: 'draft',
        to: 'triage',
        onTransition: projectMetrics,
        effects: [notice],
        accept: [
          'number',
          'groupId',
          'priority',
          'submittedAt',
          'responseDueAt',
          'resolutionDueAt',
          'submissionSnapshot',
          'calendarSnapshot',
          'ruleSnapshot',
          'nextDueAt',
          'updatedAt',
        ],
      },
    },
  });
  const runtime = new LifecycleRuntime({
    store: createAppLifecycleStore(d.db, {
      collections: {
        transitions: 'oaLifecycleTransitions',
        effectRuns: 'oaLifecycleEffectRuns',
      },
    }),
    clock: now,
    dispatcher: d.dispatcher,
  });
  runtime.register(lifecycle);
  async function check(
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
    values: RepositoryRecord,
    id?: string,
  ) {
    const result = await tx
      .repository('itRepairs')
      .withPolicy(policy)
      .validateMutation(
        id
          ? { operation: 'updateOne', filter: { id }, values }
          : { operation: 'createOne', values },
      );
    if (!result.valid) fail('ACCESS_DENIED');
  }
  async function runCommand<T>(
    input: Command,
    action: string,
    payload: unknown,
    policy: RepositoryPolicy | null,
    work: (tx: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    assertWritable();
    return d.db.transaction(async (tx) => {
      attempts.set(tx, {
        users: new Map(),
        employees: new Map(),
        groups: new Map(),
        lockedGroups: new Set(),
        reuseGroups: ![
          'configure',
          'configureCalendar',
          'recoverRouting',
        ].includes(action),
      });
      try {
        // Freeze intake snapshots; configuration also needs predicate conflict detection across actors.
        if (tx.dialect === 'postgres')
          await (
            await tx.client<Knex.Transaction>()
          ).raw(
            ['configure', 'configureCalendar', 'recoverRouting'].includes(
              action,
            )
              ? 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE'
              : 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ',
          );
        const lockStarted = performance.now();
        const target =
          payload && typeof payload === 'object' && 'assigneeId' in payload
            ? payload.assigneeId
            : undefined;
        const identities = [
          ...new Set([
            input.actorId,
            ...(typeof target === 'string' ? [target] : []),
          ]),
        ].sort();
        for (const identity of identities)
          await lockUserForAdministration(tx, identity, 'shared');
        d.onLockAcquired?.(performance.now() - lockStarted);
        const account = await userFact(input.actorId, tx);
        if (
          !account ||
          account.disabledAt ||
          (!['configure', 'configureCalendar', 'recoverRouting'].includes(
            action,
          ) &&
            !(await active(input.actorId, tx)))
        )
          fail('ACCESS_DENIED');
        const id = hash([input.actorId, input.requestKey]),
          payloadHash = hash({ action, input, payload });
        if (input.id && policy) await get(input.id, input.actorId, policy, tx);
        const previous = await tx
          .repository<{
            id: string;
            payloadHash: string;
            repairId: string | null;
            result: unknown;
          }>('itRepairCommands')
          .findOne({ filter: { id } });
        if (previous) {
          if (previous.payloadHash !== payloadHash) fail('REQUEST_CONFLICT');
          if (previous.repairId && policy)
            await get(previous.repairId, input.actorId, policy, tx);
          return previous.result as T;
        }
        const result = await work(tx);
        await tx.repository('itRepairCommands').createOne({
          values: {
            id,
            actorId: input.actorId,
            repairId:
              input.id ?? (action === 'save' ? (result as Repair).id : null),
            payloadHash,
            result: JSON.parse(JSON.stringify(result)) as JsonObject,
            createdAt: now(),
          },
        });
        return result;
      } finally {
        attempts.delete(tx);
      }
    });
  }
  async function command<T>(
    input: Command,
    action: string,
    payload: unknown,
    policy: RepositoryPolicy | null,
    work: (tx: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await runCommand(input, action, payload, policy, work);
      } catch (error) {
        if (error instanceof LifecycleError && error.code === 'CONFLICT')
          fail('VERSION_CONFLICT');
        let cause: unknown = error;
        let serialization = false;
        for (
          let depth = 0;
          depth < 8 && cause && typeof cause === 'object';
          depth++
        ) {
          const e = cause as { code?: string; cause?: unknown };
          if (e.code === '40001' || e.code === '40P01' || e.code === '23505')
            serialization = true;
          cause = e.cause;
        }
        if (!serialization) throw error;
        if (attempt >= 3) fail('VERSION_CONFLICT');
      }
    }
  }
  async function mutate(
    input: Command & { id: string; expectedVersion: number },
    action: string,
    values: RepositoryRecord,
    policy: RepositoryPolicy,
    tx: DatabaseConnection,
  ) {
    const row = await get(input.id, input.actorId, policy, tx);
    if (row.requesterId !== input.actorId) fail('ACCESS_DENIED');
    if (row.status !== 'draft' || row.version !== input.expectedVersion)
      fail('VERSION_CONFLICT');
    await check(
      tx,
      policy,
      {
        ...values,
        version: row.version + 1,
        status: action === 'submit' ? 'triage' : 'draft',
        statusChangedAt: now(),
      },
      row.id,
    );
    return (
      await runtime.fire('oa.itRepair', row.id, action, {
        actor: { id: input.actorId },
        expect: { version: row.version },
        input: JSON.parse(JSON.stringify(values)) as JsonObject,
        transaction: tx,
      })
    ).record as unknown as Repair;
  }
  async function audit(
    tx: DatabaseConnection,
    input: Command,
    action: string,
    row: Repair,
    before?: Repair,
    reason?: string,
  ) {
    await d.audit.record(
      {
        actorId: input.actorId,
        action: `itRepair.${action}`,
        targetType: 'itRepairs',
        targetId: row.id,
        ...(before
          ? {
              before: {
                status: before.status,
                version: before.version,
                priority: before.priority,
                groupId: before.groupId,
                assigneeId: before.assigneeId ?? null,
              },
            }
          : {}),
        after: {
          ...(reason ? { reason: reason.slice(0, 1000) } : {}),
          version: row.version,
          status: row.status,
          requestKey: input.requestKey,
        },
      },
      tx,
    );
  }
  /** A configuration save recovers at most five orphans. Further batches use the same restricted command. */
  async function reconcileRouting(
    input: Command,
    group: Group,
    tx: DatabaseConnection,
  ) {
    const repo = tx.repository<Repair>('itRepairs');
    const filter = (f: FilterBuilder) =>
      f.and([
        f.string('status').eq('triage'),
        f.string('groupId').eq(null),
        f.or(
          group.categories.map((category) => f.string('category').eq(category)),
        ),
      ]);
    const orphans =
      group.active && group.categories.length
        ? await repo.findMany({
            filter,
            sort: (s) => s.field('id').asc(),
            limit: 6,
          })
        : [];
    const eligible: string[] = [];
    for (const id of new Set(group.active ? group.leaderIds : []))
      if (await active(id, tx)) eligible.push(id);
    let changed = 0;
    for (const row of orphans.slice(0, 5)) {
      const recipients = eligible.filter((id) => id !== row.requesterId);
      const previous = await d.writer.listBySourceKey(row.id, tx);
      const pending = previous.filter((item) => item.status === 'pending');
      if (
        row.groupId === group.id &&
        hash(pending.map((item) => item.userId).sort()) ===
          hash([...recipients].sort())
      )
        continue;
      for (const item of pending)
        if (!recipients.includes(item.userId))
          await d.writer.setStatus(
            { userId: item.userId, sourceKey: row.id },
            'cancelled',
            tx,
          );
      for (const userId of recipients)
        if (!pending.some((item) => item.userId === userId))
          await d.writer.put(
            {
              userId,
              sourceKey: row.id,
              subject: 'oa.itRepair',
              title: row.number!,
              status: 'pending',
            },
            tx,
          );
      const result = await runtime.fire(
        'oa.itRepair',
        row.id,
        'refreshRouting',
        {
          actor: { id: input.actorId },
          expect: { version: row.version },
          input: { groupId: group.id, updatedAt: now().toISOString() },
          transaction: tx,
        },
      );
      await d.audit.record(
        {
          actorId: input.actorId,
          action: 'itRepair.refreshRouting',
          targetType: 'itRepairs',
          targetId: row.id,
          before: {
            groupId: row.groupId,
            leaderIds: pending.map((item) => item.userId),
          },
          after: {
            groupId: group.id,
            leaderIds: recipients,
            version: result.record.version,
            requestKey: input.requestKey,
          },
        },
        tx,
      );
      changed++;
    }
    return { processed: changed, hasMore: orphans.length > 5 };
  }
  async function groupFor(row: Repair, tx: DatabaseConnection) {
    if (!row.groupId) return undefined;
    const context = attempts.get(tx);
    return fact(
      context?.reuseGroups && context.lockedGroups.has(row.groupId)
        ? context.groups
        : undefined,
      row.groupId,
      () =>
        tx
          .repository<Group>('itRepairGroups')
          .findOne({ filter: { id: row.groupId, active: true } }),
    );
  }
  async function fullAccess(
    row: Repair,
    actorId: string,
    tx = d.db.connection(),
  ) {
    if (!(await active(actorId, tx))) return false;
    if (row.requesterId === actorId) return true;
    const g = await groupFor(row, tx);
    if (g?.leaderIds.includes(actorId)) return true;
    return !!g?.engineerIds.includes(actorId) && row.assigneeId === actorId;
  }
  async function isLeader(
    row: Repair,
    actorId: string,
    tx: DatabaseConnection,
  ) {
    return (
      row.requesterId !== actorId &&
      !!(await groupFor(row, tx))?.leaderIds.includes(actorId) &&
      (await active(actorId, tx))
    );
  }
  async function qualified(row: Repair, id: string, tx: DatabaseConnection) {
    return (
      id !== row.requesterId &&
      !!(await groupFor(row, tx))?.engineerIds.includes(id) &&
      (await active(id, tx))
    );
  }
  async function allowed(
    row: Repair,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<Action[]> {
    const owner = row.requesterId === actorId;
    const leader = await isLeader(row, actorId, tx);
    const engineer =
      row.assigneeId === actorId && (await qualified(row, actorId, tx));
    const a: Action[] = [];
    if (row.status === 'closed')
      return owner &&
        row.processing?.closureMode === 'user' &&
        !row.processing.rating
        ? ['rate']
        : [];
    if (!OPEN.includes(row.status as (typeof OPEN)[number])) return [];
    if (owner) {
      a.push('comment');
      if (!row.processing?.cancelPending) a.push('cancel');
      if (row.status === 'supplement') a.push('supplement');
      if (row.status === 'acceptance' && !row.processing?.cancelPending)
        a.push('accept', 'return');
    }
    if (leader) {
      a.push('priority', 'internal', 'comment', 'manageClose', 'link');
      if (
        (await d.rules.get<number>('itRepair.securityTransfer', now(), tx)) ===
        1
      )
        a.push('transferSecurity');
      if (row.status === 'triage') a.push('requestSupplement', 'triage');
      if (['pool', 'assigned', 'processing', 'waiting'].includes(row.status))
        a.push('assign');
      if (['triage', 'pool'].includes(row.status)) a.push('duplicate');
      if (row.processing?.cancelPending) a.push('reviewCancel');
      if (
        row.status === 'waiting' &&
        row.processing?.pauseRequested &&
        !row.processing.pauseSince
      )
        a.push('approvePause');
    }
    if (row.status === 'pool' && (await qualified(row, actorId, tx)))
      a.push('claim');
    if (engineer) {
      a.push('comment', 'internal', 'link');
      if (row.status === 'assigned') a.push('release', 'start');
      if (row.status === 'processing') {
        a.push('wait');
        if (!row.processing?.cancelPending) a.push('resolve');
      }
      if (row.status === 'waiting') a.push('resume');
    }
    return [...new Set(a)];
  }
  async function present(row: Repair, actorId: string, tx = d.db.connection()) {
    if (await fullAccess(row, actorId, tx)) {
      if (row.processing) {
        const {
          noticeRecipients: _notice,
          handoverRecipients: _handover,
          ...visible
        } = row.processing;
        row = { ...row, processing: visible };
      }
      if (row.requesterId === actorId && row.processing) {
        const { duplicateId, alerted: _alerted, ...safe } = row.processing;
        return {
          ...row,
          processing: {
            ...safe,
            ...(duplicateId ? { duplicateLinked: true } : {}),
          },
        };
      }

      return row;
    }
    // Engineers in a pool see only a safe summary until an assignment grants full material access.
    return {
      id: row.id,
      number: row.number,
      title: row.title,
      category: row.category,
      priority: row.priority,
      groupId: row.groupId,
      status: row.status,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      requesterId: row.requesterId,
    };
  }
  async function syncTasks(row: Repair, tx: DatabaseConnection) {
    let changed = false;
    const g = await groupFor(row, tx),
      recipients = new Set<string>();
    if (['triage'].includes(row.status))
      for (const id of g?.leaderIds ?? [])
        if (id !== row.requesterId && (await active(id, tx)))
          recipients.add(id);
    if (
      ['supplement', 'acceptance'].includes(row.status) &&
      (await active(row.requesterId, tx))
    )
      recipients.add(row.requesterId);
    if (row.status === 'pool')
      for (const id of g?.engineerIds ?? [])
        if (await qualified(row, id, tx)) recipients.add(id);
    if (
      ['assigned', 'processing', 'waiting'].includes(row.status) &&
      row.assigneeId &&
      (await qualified(row, row.assigneeId, tx))
    )
      recipients.add(row.assigneeId);
    const reconcile = async (key: string, ids: Set<string>) => {
      const old = await d.writer.listBySourceKey(key, tx);
      if (
        hash(
          old
            .filter((i) => i.status === 'pending')
            .map((i) => i.userId)
            .sort(),
        ) !== hash([...ids].sort())
      )
        changed = true;
      for (const item of old)
        if (item.status === 'pending' && !ids.has(item.userId))
          await d.writer.setStatus(
            { userId: item.userId, sourceKey: key },
            ['closed', 'cancelled'].includes(row.status)
              ? 'completed'
              : 'cancelled',
            tx,
          );
      for (const id of ids)
        if (
          !old.some((item) => item.userId === id && item.status === 'pending')
        )
          await d.writer.put(
            {
              userId: id,
              sourceKey: key,
              subject: 'oa.itRepair',
              title: row.number!,
              status: 'pending',
            },
            tx,
          );
    };
    await reconcile(row.id, recipients);
    const review = new Set<string>();
    if (
      row.processing?.cancelPending &&
      !['closed', 'cancelled'].includes(row.status)
    )
      for (const id of g?.leaderIds ?? [])
        if (id !== row.requesterId && (await active(id, tx))) review.add(id);
    await reconcile(`${row.id}:cancel`, review);
    if (
      review.size &&
      !(await tx.repository('oaTaskCenterTargets').findOne({
        filter: { sourceType: 'oa.itRepair', sourceKey: `${row.id}:cancel` },
      }))
    )
      await tx.repository('oaTaskCenterTargets').createOne({
        values: {
          sourceType: 'oa.itRepair',
          sourceKey: `${row.id}:cancel`,
          subject: 'oa.itRepair',
          recordId: row.id,
        },
      });
    return changed;
  }

  async function recoverMembership(
    group: Group,
    tx: DatabaseConnection,
    actorId: string,
  ) {
    // Zero is an orphan-only continuation marker, never a membership scan position.
    if (group.routingCursor === '00000000-0000-0000-0000-000000000000') {
      const result = await tx.repository('itRepairGroups').updateMany({
        filter: {
          id: group.id,
          version: group.version,
          routingCursor: group.routingCursor,
        },
        values: { routingCursor: null },
      });
      if (result.updatedCount !== 1) fail('VERSION_CONFLICT');
      return { processed: 0, hasMore: false };
    }
    const rows = await tx.repository<Repair>('itRepairs').findMany({
      filter: (f) =>
        f.and([
          f.string('groupId').eq(group.id),
          f.or(OPEN.map((state) => f.string('status').eq(state))),
        ]),
      sort: (s) => s.field('id').asc(),
      cursor: group.routingCursor ? { id: group.routingCursor } : undefined,
      direction: group.routingCursor ? 'forward' : undefined,
      limit: 6,
    });
    let changed = 0;
    for (const row of rows.slice(0, 5))
      if (await syncTasks(row, tx)) {
        changed++;
        const result = await runtime.fire(
          'oa.itRepair',
          row.id,
          row.status === 'triage'
            ? 'refreshRouting'
            : `routing_${row.status}_${row.status}`,
          {
            actor: { id: actorId },
            expect: { version: row.version },
            input:
              row.status === 'triage'
                ? { groupId: group.id, updatedAt: now().toISOString() }
                : {
                    updatedAt: now().toISOString(),
                    nextDueAt: now().toISOString(),
                    processing: (await noticeProcessing(row, tx)) as JsonObject,
                  },
            transaction: tx,
          },
        );
        await appendEvent(
          tx,
          row,
          'routing',
          actorId,
          {},
          `routing:${group.id}:${group.version}:${row.id}`,
          'internal',
        );
        await d.audit.record(
          {
            actorId,
            action: 'itRepair.refreshMembership',
            targetType: 'itRepairs',
            targetId: row.id,
            after: {
              version: result.record.version,
              groupVersion: group.version,
            },
          },
          tx,
        );
      }
    const fence = await tx.repository('itRepairGroups').updateMany({
      filter: { id: group.id, version: group.version },
      values: { routingCursor: rows.length > 5 ? rows[4].id : null },
    });
    if (fence.updatedCount !== 1) fail('VERSION_CONFLICT');
    return { processed: changed, hasMore: rows.length > 5 };
  }
  function text(data: Record<string, unknown>, key: string, max = 2000) {
    const value = data[key];
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
      fail('INVALID_INPUT', key);
    return value.trim();
  }
  async function appendEvent(
    tx: DatabaseConnection,
    row: Repair,
    type: string,
    actorId: string | null,
    data: JsonObject,
    eventKey: string,
    visibility = 'public',
  ) {
    await tx.repository('itRepairEvents').createOne({
      values: {
        id: randomUUID(),
        repairId: row.id,
        type,
        actorId,
        data,
        eventKey,
        visibility,
        createdAt: now(),
      },
    });
  }
  async function noticeProcessing(
    row: Repair,
    tx: DatabaseConnection,
    internal = false,
    previousAssignee?: string | null,
  ): Promise<Processing> {
    const p = structuredClone(row.processing ?? {}),
      g = await groupFor(row, tx),
      recipients = new Set<string>();
    for (const id of [
      ...(g?.leaderIds ?? []),
      ...(row.assigneeId ? [row.assigneeId] : []),
      ...(row.status === 'pool' ? (g?.engineerIds ?? []) : []),
      ...(!internal ? [row.requesterId] : []),
    ])
      if (
        !(internal && id === row.requesterId) &&
        (await active(id, tx)) &&
        (await canRead(row, id, tx))
      )
        recipients.add(id);
    p.noticeRecipients = [...recipients].sort();
    p.handoverRecipients =
      previousAssignee && previousAssignee !== row.assigneeId
        ? [previousAssignee]
        : [];
    return p;
  }
  let groupPhysical:
    ReturnType<DatabaseConnection['collections']['getPhysical']> | undefined;
  async function holdGroup(tx: DatabaseConnection, id: string) {
    if (tx.dialect !== 'postgres') {
      await tx
        .repository('itRepairGroups')
        .updateMany({ filter: { id }, values: { version: { increment: 0 } } });
      return;
    }
    const table = await (groupPhysical ??=
      tx.collections.getPhysical('itRepairGroups'));
    if (!table) fail('CONFIGURATION_REQUIRED');
    await (
      await tx.client<Knex.Transaction>()
    )
      .withSchema(table.schema)
      .from(table.tableName)
      .select('id')
      .where('id', id)
      .forShare();
    // A pre-lock locating read is never admitted as a protected group fact.
    attempts.get(tx)?.lockedGroups.add(id);
  }
  async function act(
    input: Command & { id: string; expectedVersion: number },
    action: Action,
    data: Record<string, unknown>,
    policy: RepositoryPolicy,
    referencePolicy?: RepositoryPolicy,
  ) {
    const accepted: Record<Action, string[]> = {
      transferSecurity: ['groupId', 'reason'],
      requestSupplement: ['reason'],
      supplement: ['message'],
      triage: [
        'priority',
        'advice',
        'assigneeId',
        'category',
        'groupId',
        'reason',
      ],
      assign: ['assigneeId', 'reason'],
      claim: [],
      release: ['reason'],
      start: [],
      comment: ['message', 'effective', 'advice'],
      internal: ['message'],
      wait: ['reason', 'party', 'followUpAt', 'pauseRequested'],
      approvePause: ['reason'],
      resume: ['reason'],
      resolve: ['cause', 'solution', 'completion', 'resultType'],
      accept: ['rating', 'evaluation'],
      return: ['reason'],
      rate: ['rating', 'evaluation'],
      cancel: ['reason'],
      reviewCancel: ['approve', 'reason'],
      duplicate: ['mainId', 'reason'],
      manageClose: ['reason', 'completion'],
      priority: ['priority', 'reason'],
      link: ['kind', 'sourceId', 'reason'],
    };
    if (Object.keys(data).some((k) => !accepted[action].includes(k)))
      fail('INVALID_INPUT');
    for (const k of ['effective', 'pauseRequested'])
      if (data[k] !== undefined && typeof data[k] !== 'boolean')
        fail('INVALID_INPUT', k);
    return command(input, action, data, policy, async (tx) => {
      const row = await get(input.id, input.actorId, policy, tx);
      if (row.groupId) await holdGroup(tx, row.groupId);
      if (row.version !== input.expectedVersion) fail('VERSION_CONFLICT');
      if (!(await allowed(row, input.actorId, tx)).includes(action))
        fail('ACCESS_DENIED');
      const at = now(),
        iso = at.toISOString();
      const { p, cal, consumed } = clock(row, at);
      const thresholdAlerts = settleThresholds(row, p, at);
      let status = row.status;
      const values: RepositoryRecord = {};
      const stop = () => {
        p.consumedHours = consumed;
        p.runningSince = null;
      };
      const respond = () => {
        if (!p.firstResponseAt && row.requesterId !== input.actorId)
          p.firstResponseAt = iso;
      };
      const reason = () => text(data, 'reason', 1000);
      const assign = async (id: unknown) => {
        if (typeof id === 'string')
          await lockUserForAdministration(tx, id, 'shared');
        if (
          typeof id !== 'string' ||
          !(await qualified(
            {
              ...row,
              groupId:
                typeof values.groupId === 'string'
                  ? values.groupId
                  : row.groupId,
            },
            id,
            tx,
          ))
        )
          fail('INVALID_INPUT', 'assigneeId');
        values.assigneeId = id;
      };
      switch (action) {
        case 'link': {
          reason();
          const kind = text(data, 'kind', 32),
            sourceId = text(data, 'sourceId', 64);
          if (
            !['purchase', 'expensePlan'].includes(kind) ||
            !referencePolicy ||
            !d.references ||
            !(await d.references.summary(
              kind,
              input.actorId,
              referencePolicy,
              sourceId,
              tx,
            ))
          )
            fail('ACCESS_DENIED');
          if (
            await tx
              .repository('itRepairLinks')
              .exists({ filter: { repairId: row.id, kind, sourceId } })
          )
            fail('INVALID_INPUT', 'sourceId');
          await tx.repository('itRepairLinks').createOne({
            values: {
              id: randomUUID(),
              repairId: row.id,
              kind,
              sourceId,
              cursor: 0,
              receipts: {},
              nextCheckAt: at,
              createdAt: at,
            },
          });
          break;
        }
        case 'transferSecurity': {
          reason();
          const enabled = await d.rules.snapshot(
            ['itRepair.securityTransfer'],
            at,
            tx,
          );
          if (enabled['itRepair.securityTransfer'] !== 1)
            fail('SECURITY_TRANSFER_DISABLED');
          const target = await tx.repository<Group>('itRepairGroups').findOne({
            filter: {
              id: text(data, 'groupId', 64),
              active: true,
              security: true,
            },
          });
          if (
            !target ||
            target.id === row.groupId ||
            !(
              await Promise.all(
                target.leaderIds
                  .filter((id) => id !== row.requesterId)
                  .map((id) => active(id, tx)),
              )
            ).some(Boolean)
          )
            fail('INVALID_INPUT', 'groupId');
          await holdGroup(tx, target.id);
          values.groupId = target.id;
          values.assigneeId = null;
          if (status !== 'acceptance' && status !== 'supplement') {
            if (p.waitSince)
              p.waitHours =
                (p.waitHours ?? 0) +
                cal.workingHoursBetween(new Date(p.waitSince), at);
            if (p.pauseSince) {
              p.pausedHours =
                (p.pausedHours ?? 0) +
                cal.workingHoursBetween(new Date(p.pauseSince), at);
              p.runningSince = iso;
            }
            p.waitSince = null;
            p.pauseSince = null;
            p.pauseRequested = false;
            p.followUpAt = null;
            status = 'triage';
          }
          break;
        }
        case 'requestSupplement':
          reason();
          status = 'supplement';
          break;
        case 'supplement':
          text(data, 'message', 5000);
          status = 'triage';
          break;
        case 'triage': {
          text(data, 'advice');
          respond();
          if (
            typeof data.groupId === 'string' &&
            data.groupId &&
            data.groupId !== row.groupId
          ) {
            const target = await tx
              .repository<Group>('itRepairGroups')
              .findOne({ filter: { id: String(data.groupId), active: true } });
            if (target?.security || (await groupFor(row, tx))?.security)
              fail('ACCESS_DENIED');
            if (!target?.leaderIds.includes(input.actorId))
              fail('ACCESS_DENIED');
            await holdGroup(tx, target.id);
            reason();
            values.groupId = target.id;
          }
          if (
            typeof data.category === 'string' &&
            data.category &&
            data.category !== row.category
          ) {
            const category = await d.dictionaries.get(
              'itRepairCategory',
              String(data.category),
              tx,
            );
            if (!category?.active) fail('INVALID_INPUT', 'category');
            reason();
            values.category = String(data.category);
          }

          if (
            typeof data.priority !== 'string' ||
            !['P1', 'P2', 'P3', 'P4'].includes(data.priority)
          )
            fail('INVALID_INPUT', 'priority');
          values.priority = data.priority;
          if (data.assigneeId) {
            await assign(data.assigneeId);
            status = 'assigned';
          } else {
            const target = { ...row, ...values },
              g = await groupFor(target, tx);
            const available = await Promise.all(
              (g?.engineerIds ?? []).map((id) => qualified(target, id, tx)),
            );
            status = available.some(Boolean) ? 'pool' : 'triage';
          }
          break;
        }
        case 'assign':
          reason();
          await assign(data.assigneeId);
          if (status === 'pool') status = 'assigned';
          break;
        case 'claim':
          values.assigneeId = input.actorId;
          status = 'assigned';
          break;
        case 'release':
          reason();
          values.assigneeId = null;
          status = 'pool';
          break;
        case 'start':
          status = 'processing';
          break;
        case 'comment':
          text(data, 'message', 5000);
          if (data.effective === true) {
            if (row.requesterId === input.actorId) fail('ACCESS_DENIED');
            text(data, 'advice');
            respond();
          }
          break;
        case 'internal':
          text(data, 'message', 5000);
          break;
        case 'wait': {
          reason();
          if (
            ![
              'employee',
              'vendor',
              'purchase',
              'authorization',
              'internal',
            ].includes(String(data.party))
          )
            fail('INVALID_INPUT', 'party');
          if (
            typeof data.followUpAt !== 'string' ||
            !Number.isFinite(+new Date(data.followUpAt)) ||
            +new Date(data.followUpAt) <= +at
          )
            fail('INVALID_INPUT', 'followUpAt');
          if (data.pauseRequested && data.party === 'internal')
            fail('INVALID_INPUT', 'party');
          if (
            ['purchase', 'authorization'].includes(String(data.party)) &&
            !(await tx.repository('itRepairLinks').exists({
              filter: {
                repairId: row.id,
                kind: data.party === 'purchase' ? 'purchase' : 'expensePlan',
              },
            }))
          )
            fail('REFERENCE_REQUIRED', 'party');
          p.waitingParty = String(data.party);
          p.followUpAt = data.followUpAt;
          p.waitSince = iso;
          p.pauseRequested = data.pauseRequested === true;
          status = 'waiting';
          break;
        }
        case 'approvePause':
          reason();
          if (
            !['employee', 'vendor', 'purchase', 'authorization'].includes(
              p.waitingParty ?? '',
            )
          )
            fail('INVALID_INPUT', 'party');
          stop();
          p.pauseSince = iso;
          break;
        case 'resume':
          reason();
          if (p.pauseSince) {
            p.pausedHours =
              (p.pausedHours ?? 0) +
              cal.workingHoursBetween(new Date(p.pauseSince), at);
            p.pauseSince = null;
            p.runningSince = iso;
          }
          p.waitHours =
            (p.waitHours ?? 0) +
            cal.workingHoursBetween(new Date(p.waitSince!), at);
          p.waitSince = null;
          p.followUpAt = null;
          p.pauseRequested = false;
          status = 'processing';
          break;
        case 'resolve':
          p.resolutionTargetHours = Number(
            (row.ruleSnapshot as { values: Record<string, number> }).values[
              `itRepair.${row.priority}.resolution`
            ],
          );
          p.completedResolutionDueAt = deadlines(row, p, at).resolutionDueAt;
          for (const key of ['cause', 'solution', 'completion'])
            text(data, key);
          if (
            !['restored', 'alternative', 'otherService'].includes(
              String(data.resultType),
            )
          )
            fail('INVALID_INPUT', 'resultType');
          stop();
          p.round = (p.round ?? 0) + 1;
          p.acceptanceSince = iso;
          p.acceptanceDueAt = cal
            .addWorkingDays(
              at,
              Number(
                (row.ruleSnapshot as { values: Record<string, number> }).values[
                  'itRepair.acceptanceDays'
                ] ?? 2,
              ),
            )
            .toISOString();
          status = 'acceptance';
          break;
        case 'accept':
          status = 'closed';
          p.closureMode = 'user';
          p.closedAt = iso;
          p.acceptanceHours =
            (p.acceptanceHours ?? 0) +
            cal.workingHoursBetween(new Date(p.acceptanceSince!), at);
          p.acceptanceSince = null;
          p.acceptanceDueAt = null;
          if (data.rating !== undefined) {
            if (
              !Number.isInteger(data.rating) ||
              Number(data.rating) < 1 ||
              Number(data.rating) > 5
            )
              fail('INVALID_INPUT', 'rating');
            p.rating = Number(data.rating);
          }
          if (data.evaluation !== undefined) {
            if (
              typeof data.evaluation !== 'string' ||
              data.evaluation.length > 1000
            )
              fail('INVALID_INPUT', 'evaluation');
            p.evaluation = data.evaluation;
          }
          break;
        case 'return':
          reason();
          p.returnCount =
            (p.returnCount ??
              Number(row.returnCount ?? Math.max(0, (p.round ?? 0) - 1))) + 1;
          delete p.resolutionTargetHours;
          delete p.completedResolutionDueAt;
          p.acceptanceHours =
            (p.acceptanceHours ?? 0) +
            cal.workingHoursBetween(new Date(p.acceptanceSince!), at);
          p.acceptanceSince = null;
          p.acceptanceDueAt = null;
          p.runningSince = iso;
          status =
            row.assigneeId && (await qualified(row, row.assigneeId, tx))
              ? 'processing'
              : 'triage';
          if (status === 'triage') values.assigneeId = null;
          break;
        case 'rate':
          if (
            !Number.isInteger(data.rating) ||
            Number(data.rating) < 1 ||
            Number(data.rating) > 5
          )
            fail('INVALID_INPUT', 'rating');
          if (
            data.evaluation !== undefined &&
            (typeof data.evaluation !== 'string' ||
              data.evaluation.length > 1000)
          )
            fail('INVALID_INPUT', 'evaluation');
          p.rating = Number(data.rating);
          p.evaluation = String(data.evaluation ?? '');
          break;
        case 'cancel':
          reason();
          if (['triage', 'supplement', 'pool'].includes(status))
            status = 'cancelled';
          else {
            if (p.cancelPending) fail('VERSION_CONFLICT');
            p.cancelPending = true;
            p.cancelReason = String(data.reason);
            p.cancelFollowUpAt = cal
              .addWorkingDays(
                at,
                Number(
                  (row.ruleSnapshot as { values: Record<string, number> })
                    .values['itRepair.followUpDays'] ?? 2,
                ),
              )
              .toISOString();
          }
          break;
        case 'reviewCancel':
          reason();
          if (typeof data.approve !== 'boolean')
            fail('INVALID_INPUT', 'approve');
          p.cancelPending = false;
          p.cancelFollowUpAt = null;
          if (data.approve) status = 'cancelled';
          break;
        case 'duplicate': {
          reason();
          const id = text(data, 'mainId', 64);
          if (id === row.id) fail('INVALID_INPUT', 'mainId');
          const main = await get(id, input.actorId, policy, tx);
          if (main.status === 'cancelled' || main.status === 'draft')
            fail('INVALID_INPUT', 'mainId');
          let next: Repair | undefined = main;
          const seen = new Set([row.id]);
          while (next) {
            if (seen.has(next.id)) fail('INVALID_INPUT', 'mainId');
            seen.add(next.id);
            next = next.processing?.duplicateId
              ? await get(
                  next.processing.duplicateId,
                  input.actorId,
                  policy,
                  tx,
                )
              : undefined;
          }
          p.duplicateId = id;
          status = 'cancelled';
          break;
        }
        case 'manageClose':
          reason();
          text(data, 'completion');
          p.closureMode = 'management';
          p.closedAt = iso;
          status = 'closed';
          break;
        case 'priority':
          reason();
          if (!['P1', 'P2', 'P3', 'P4'].includes(String(data.priority)))
            fail('INVALID_INPUT', 'priority');
          values.priority = String(data.priority);
          break;
      }
      if (['closed', 'cancelled'].includes(status)) {
        stop();
        if (p.waitSince)
          p.waitHours =
            (p.waitHours ?? 0) +
            cal.workingHoursBetween(new Date(p.waitSince), at);
        if (p.pauseSince)
          p.pausedHours =
            (p.pausedHours ?? 0) +
            cal.workingHoursBetween(new Date(p.pauseSince), at);
        if (p.acceptanceSince)
          p.acceptanceHours =
            (p.acceptanceHours ?? 0) +
            cal.workingHoursBetween(new Date(p.acceptanceSince), at);
        p.waitSince = null;
        p.pauseSince = null;
        p.acceptanceSince = null;
        p.followUpAt = null;
        p.acceptanceDueAt = null;
        p.cancelPending = false;
        p.cancelFollowUpAt = null;
      }
      const candidate = { ...row, ...values, status, processing: p } as Repair;
      if (p.firstResponseAt && !row.processing?.firstResponseAt) {
        p.responseTargetHours = Number(
          (row.ruleSnapshot as { values: Record<string, number> }).values[
            `itRepair.${candidate.priority}.response`
          ],
        );
        candidate.responseDueAt = cal
          .addWorkingHours(new Date(row.submittedAt!), p.responseTargetHours)
          .toISOString();
      }
      thresholdAlerts.push(...settleThresholds(candidate, p, at));
      if (action === 'triage' && status === 'triage') {
        const key = `noCandidates:${candidate.groupId}`;
        if (!p.alerted?.includes(key)) {
          p.alerted = [...(p.alerted ?? []), key];
          thresholdAlerts.push(key);
        }
      }
      Object.assign(
        p,
        await noticeProcessing(
          candidate,
          tx,
          action === 'internal',
          ['assign', 'transferSecurity'].includes(action)
            ? row.assigneeId
            : null,
        ),
      );

      Object.assign(values, deadlines(candidate, p, at), {
        processing: p,
        updatedAt: iso,
      });
      await check(
        tx,
        action === 'transferSecurity'
          ? {
              ...policy,
              update:
                policy.update === true
                  ? true
                  : policy.update
                    ? { ...policy.update, scope: true }
                    : false,
            }
          : policy,
        { ...values, status, statusChangedAt: at, version: row.version + 1 },
        row.id,
      );
      const result = (
        await runtime.fire(
          'oa.itRepair',
          row.id,
          `${action}_${row.status}_${status}`,
          {
            actor: { id: input.actorId },
            expect: { version: row.version },
            input: JSON.parse(JSON.stringify(values)) as JsonObject,
            transaction: tx,
          },
        )
      ).record as unknown as Repair;
      await appendEvent(
        tx,
        result,
        action,
        input.actorId,
        (action === 'link'
          ? { kind: String(data.kind), reason: String(data.reason) }
          : action === 'duplicate'
            ? { reason: String(data.reason) }
            : JSON.parse(JSON.stringify(data))) as JsonObject,
        `${row.id}:${input.actorId}:${input.requestKey}`,
        action === 'internal' ? 'internal' : 'public',
      );
      for (const key of thresholdAlerts)
        await appendEvent(
          tx,
          result,
          'alert',
          null,
          { key },
          `${row.id}:alert:${key}`,
        );
      await syncTasks(result, tx);
      await audit(
        tx,
        input,
        action,
        result,
        row,
        typeof data.reason === 'string' ? data.reason : undefined,
      );
      if (
        action === 'transferSecurity' &&
        !(await canRead(result, input.actorId, tx))
      )
        return {
          id: result.id,
          status: result.status,
          version: result.version,
          transferred: true,
        };
      return present(result, input.actorId, tx);
    }).catch((error) => {
      if (
        action === 'claim' &&
        error instanceof RepairError &&
        error.code === 'ACCESS_DENIED'
      )
        fail('VERSION_CONFLICT');
      throw error;
    });
  }
  async function handling(
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
    historyPage = 1,
  ) {
    const row = await get(id, actorId, policy),
      tx = d.db.connection();
    const full = await fullAccess(row, actorId, tx),
      internal = full && row.requesterId !== actorId;
    const g = await groupFor(row, tx),
      candidates: { id: string; name: string }[] = [];
    if (await isLeader(row, actorId, tx))
      for (const id of g?.engineerIds ?? [])
        if (await qualified(row, id, tx)) {
          const u = await d.users.withConnection(tx).get(id);
          candidates.push({ id, name: u!.name });
        }
    const routingGroups = [];
    if (await isLeader(row, actorId, tx))
      for (const target of await groups(tx))
        if (target.leaderIds.includes(actorId)) {
          const candidates = [];
          for (const id of target.engineerIds)
            if (await qualified({ ...row, groupId: target.id }, id, tx))
              candidates.push({
                id,
                name: (await d.users.withConnection(tx).get(id))!.name,
              });
          routingGroups.push({
            id: target.id,
            title: target.title,
            candidates,
          });
        }
    const history = full
      ? await tx.repository('itRepairEvents').findMany({
          filter: internal
            ? { repairId: id }
            : { repairId: id, visibility: 'public' },
          sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
          offset: (historyPage - 1) * 100,
          limit: 101,
        })
      : [];
    return {
      securityTargets:
        (await isLeader(row, actorId, tx)) &&
        (await d.rules.get<number>('itRepair.securityTransfer', now(), tx)) ===
          1
          ? (await groups(tx))
              .filter((g) => g.security && g.id !== row.groupId)
              .map((g) => ({ id: g.id, title: g.title }))
          : [],
      internalFiles: internal
        ? (
            await tx.repository('itRepairFiles').findMany({
              filter: { repairId: row.id, visibility: 'internal' },
              select: (s) => s.fields('id'),
              limit: 100,
            })
          ).map((f) => String(f.id as string))
        : [],
      groups: routingGroups,
      categories: (await isLeader(row, actorId, tx))
        ? (await d.dictionaries.list('itRepairCategory'))
            .filter((c) => c.active)
            .map((c) => ({ code: c.code, label: c.label }))
        : [],
      actions: await allowed(row, actorId, tx),
      candidates,
      assigneeLabel:
        full && row.assigneeId
          ? ((await d.users.withConnection(tx).get(row.assigneeId))?.name ??
            null)
          : null,
      full,
      internal,
      events: history.slice(0, 100).reverse(),
      hasMoreHistory: history.length > 100,
      clocks:
        row.submittedAt && full
          ? (({ consumed, response, paused, acceptance, waiting }) => ({
              consumed,
              response,
              paused,
              acceptance,
              waiting,
            }))(clock(row, now()))
          : null,
    };
  }
  async function rebuildMetrics(limit = 100) {
    assertWritable();
    const rows = await d.db.repository<Repair>('itRepairs').findMany({
      filter: (f) =>
        f.and([
          f.string('status').ne('draft'),
          f.number('metricRevision').empty(),
        ]),
      sort: (s) => s.field('id').asc(),
      limit,
    });
    for (const candidate of rows)
      await d.db.transaction(async (tx) => {
        const row = await tx.repository<Repair>('itRepairs').findOne({
          filter: { id: candidate.id, version: candidate.version },
        });
        if (!row) return;
        const returns = await tx
          .repository('itRepairEvents')
          .count({ filter: { repairId: row.id, type: 'return' } });
        await tx.repository('itRepairs').updateMany({
          filter: { id: row.id, version: row.version, metricRevision: null },
          values: { ...metricsOf(row, now()), returnCount: returns },
        });
      });
    return rows.length;
  }
  /** Bounded index scan, one transaction per due record, idempotent event keys survive restarts. */
  let eligibilityCursor: string | undefined;
  async function tick(limit = 100) {
    assertWritable();
    await rebuildMetrics(limit);
    const pending = await d.db.repository<Group>('itRepairGroups').findMany({
      filter: (f) => f.string('routingCursor').notEmpty(),
      limit: 10,
    });
    for (const group of pending)
      await d.db.transaction(async (tx) => {
        const fence = await tx.repository('itRepairGroups').updateMany({
          filter: {
            id: group.id,
            version: group.version,
            routingCursor: group.routingCursor,
          },
          values: { version: { increment: 0 } },
        });
        if (fence.updatedCount === 1) {
          const recovery = await reconcileRouting(
            {
              actorId: 'system',
              requestKey: `routing:${group.id}:${group.version}`,
            },
            group,
            tx,
          );
          const membership = await recoverMembership(group, tx, 'system');
          if (recovery.hasMore && !membership.hasMore)
            await tx.repository('itRepairGroups').updateMany({
              filter: { id: group.id, version: group.version },
              values: {
                routingCursor: '00000000-0000-0000-0000-000000000000',
              },
            });
        }
      });
    const at = now();
    const rows = await d.db.repository<Repair>('itRepairs').findMany({
      filter: (f) =>
        f.and([
          f.string('status').ne('draft'),
          f.string('status').ne('closed'),
          f.string('status').ne('cancelled'),
          f.or([f.date('nextDueAt').notAfter(at), f.date('nextDueAt').empty()]),
        ]),
      sort: (s) => s.field('nextDueAt').asc(),
      limit,
    });
    // Read-only bounded eligibility repair scan; valid rows are never rewritten.
    const eligibility = await d.db.repository<Repair>('itRepairs').findMany({
      filter: (f) =>
        f.and([
          f.string('assigneeId').notEmpty(),
          ...['draft', 'closed', 'cancelled'].map((state) =>
            f.string('status').ne(state),
          ),
        ]),
      sort: (s) => s.field('id').asc(),
      cursor: eligibilityCursor ? { id: eligibilityCursor } : undefined,
      direction: eligibilityCursor ? 'forward' : undefined,
      limit,
    });
    eligibilityCursor =
      eligibility.length === limit ? eligibility.at(-1)!.id : undefined;
    const assigneeIds = [
      ...new Set(
        eligibility.flatMap((row) => (row.assigneeId ? [row.assigneeId] : [])),
      ),
    ];
    const people = assigneeIds.length
      ? await d.users.list({
          userIds: assigneeIds,
          pageSize: 100,
          kind: 'person',
        })
      : { items: [] };
    const accounts = new Map(people.items.map((user) => [user.id, user]));
    const employees = await d.employees.getByUserIds(assigneeIds);
    const currentGroups = new Map(
      (await groups(d.db.connection())).map((group) => [group.id, group]),
    );
    const invalid: Repair[] = eligibility.filter((row) => {
      const id = row.assigneeId!,
        account = accounts.get(id),
        employee = employees.get(id),
        group = currentGroups.get(row.groupId ?? '');
      return (
        !row.processing?.alerted?.includes(`invalidAssignee:${id}`) &&
        (!account ||
          account.disabledAt ||
          !employee?.active ||
          employee.status === 'left' ||
          !group?.engineerIds.includes(id) ||
          id === row.requesterId)
      );
    });
    const selected = [
      ...new Map([...invalid, ...rows].map((row) => [row.id, row])).values(),
    ].slice(0, limit);
    let changed = 0;
    for (const candidate of selected) {
      try {
        await d.db.transaction(async (tx) => {
          const row = await tx
            .repository<Repair>('itRepairs')
            .findOne({ filter: { id: candidate.id } });
          if (
            !row ||
            row.version !== candidate.version ||
            ['closed', 'cancelled'].includes(row.status)
          )
            return;
          const { p, cal } = clock(row, at),
            values = (row.ruleSnapshot as { values: Record<string, number> })
              .values;
          delete p.noticeRecipients;
          delete p.handoverRecipients;
          const alerts = settleThresholds(row, p, at, true),
            seen = new Set(p.alerted ?? []);
          const add = (key: string) => {
            if (!seen.has(key)) {
              seen.add(key);
              alerts.push(key);
            }
          };
          if (p.acceptanceDueAt && +at >= +new Date(p.acceptanceDueAt))
            add(`acceptance:${p.round ?? 0}`);
          if (p.followUpAt && +at >= +new Date(p.followUpAt)) {
            add(`followUp:${p.followUpAt}`);
            p.followUpAt = cal
              .addWorkingDays(at, Number(values['itRepair.followUpDays'] ?? 2))
              .toISOString();
          }
          if (
            p.cancelPending &&
            p.cancelFollowUpAt &&
            +at >= +new Date(p.cancelFollowUpAt)
          ) {
            add(`cancelFollowUp:${p.cancelFollowUpAt}`);
            p.cancelFollowUpAt = cal
              .addWorkingDays(at, Number(values['itRepair.followUpDays'] ?? 2))
              .toISOString();
          }
          if (['triage', 'pool'].includes(row.status)) {
            const g = await groupFor(row, tx);
            if (
              g &&
              !(
                await Promise.all(
                  g.engineerIds.map((id) => qualified(row, id, tx)),
                )
              ).some(Boolean)
            )
              add(`noCandidates:${row.groupId}`);
          }
          if (row.assigneeId && !(await qualified(row, row.assigneeId, tx)))
            add(`invalidAssignee:${row.assigneeId}`);
          p.alerted = [...seen];
          if (alerts.length)
            Object.assign(
              p,
              await noticeProcessing({ ...row, processing: p }, tx),
            );
          const timing = deadlines(row, p, at);
          // No timers remain: park in a bounded eligibility check instead of repeatedly selecting NULL.
          if (!timing.nextDueAt)
            timing.nextDueAt = cal.addWorkingHours(at, 8).toISOString();
          const result = (
            await runtime.fire(
              'oa.itRepair',
              row.id,
              `${alerts.length ? 'alert' : 'timer'}_${row.status}_${row.status}`,
              {
                actor: { id: 'system' },
                expect: { version: row.version },
                input: {
                  ...timing,
                  processing: p as unknown as JsonObject,
                  updatedAt: at.toISOString(),
                },
                transaction: tx,
              },
            )
          ).record as unknown as Repair;
          for (const key of alerts)
            await appendEvent(
              tx,
              row,
              'alert',
              null,
              { key },
              `${row.id}:alert:${key}`,
            );
          await syncTasks(result, tx);
          await d.audit.record(
            {
              actorId: null,
              action: 'itRepair.timer',
              targetType: 'itRepairs',
              targetId: row.id,
              after: { alerts, version: result.version },
            },
            tx,
          );
          changed++;
        });
      } catch (e) {
        if (!(e instanceof LifecycleError && e.code === 'CONFLICT')) throw e;
      }
    }
    return {
      scanned: rows.length,
      eligibilityScanned: eligibility.length,
      changed,
      references: await followReferences(limit),
    };
  }

  async function followReferences(limit: number) {
    if (!d.references) return 0;
    const at = now(),
      links = await d.db
        .repository<{
          id: string;
          repairId: string;
          kind: string;
          sourceId: string;
          cursor: number;
          nextCheckAt: string;
          receipts: Record<string, number>;
        }>('itRepairLinks')
        .findMany({
          filter: (f) => f.date('nextCheckAt').notAfter(at),
          sort: (s) => s.field('nextCheckAt').asc(),
          limit,
        });
    let changes = 0;
    for (const link of links)
      await d.db.transaction(async (tx) => {
        const current = await tx
          .repository<typeof link>('itRepairLinks')
          .findOne({ filter: { id: link.id, cursor: link.cursor } });
        if (!current) return;
        const row = await tx
          .repository<Repair>('itRepairs')
          .findOne({ filter: { id: link.repairId } });
        if (!row) return;
        if (['closed', 'cancelled'].includes(row.status)) {
          await tx.repository('itRepairLinks').updateMany({
            filter: { id: link.id },
            values: { nextCheckAt: null },
          });
          return;
        }
        const events = await d.references!.changes(
          link.kind,
          link.sourceId,
          link.cursor,
          tx,
        );
        const receipts =
          link.kind === 'purchase'
            ? await d.references!.receipts(link.sourceId, tx)
            : [];
        const additions = [
          ...events.map((e) => ({
            key: `source:${link.id}:${e.id}`,
            status: e.status,
          })),
          ...receipts
            .filter((r) => (current.receipts[r.id] ?? 0) < r.version)
            .map((r) => ({
              key: `receipt:${link.id}:${r.id}:${r.version}`,
              status: r.status,
            })),
        ];
        const cursor = events.at(-1)?.version ?? link.cursor;
        // Predicate update is the single consumer competition point, rollback includes cursor and appended events.
        const updated = await tx.repository('itRepairLinks').updateMany({
          filter: (f) =>
            f.and([
              f.string('id').eq(link.id),
              f.number('cursor').eq(link.cursor),
              f.date('nextCheckAt').notBefore(new Date(link.nextCheckAt)),
              f.date('nextCheckAt').notAfter(new Date(link.nextCheckAt)),
            ]),
          values: {
            cursor,
            receipts: Object.fromEntries(
              receipts.map((r) => [r.id, r.version]),
            ),
            nextCheckAt: new Date(+at + 60000),
          },
        });
        if (updated.updatedCount !== 1) return;
        if (additions.length) {
          await runtime.fire(
            'oa.itRepair',
            row.id,
            `sourceProgress_${row.status}_${row.status}`,
            {
              actor: { id: 'system' },
              expect: { version: row.version },
              input: {
                updatedAt: at.toISOString(),
                processing: (await noticeProcessing(row, tx)) as JsonObject,
              },
              transaction: tx,
            },
          );
          for (const e of additions)
            if (
              !(await tx
                .repository('itRepairEvents')
                .exists({ filter: { eventKey: e.key } }))
            )
              await appendEvent(
                tx,
                row,
                'sourceChange',
                null,
                { kind: link.kind, status: e.status },
                e.key,
              );
          await d.audit.record(
            {
              actorId: null,
              action: 'itRepair.sourceFollowUp',
              targetType: 'itRepairs',
              targetId: row.id,
              after: { count: additions.length },
            },
            tx,
          );
          changes += additions.length;
        }
      });
    return changes;
  }
  async function calendarConfiguration(tx = d.db.connection()) {
    const keys = ['itRepair.morning', 'itRepair.afternoon'];
    const values = await d.rules.snapshot(keys, now(), tx);
    const versions = await d.rules.versions(keys, tx);
    return {
      revision: hash(
        versions.map((v) => [v.id, v.key, v.value, v.effectiveFrom]),
      ),
      windows: [
        values[keys[0]],
        values[keys[1]],
      ] as CalendarSnapshot['windows'],
    };
  }
  return {
    runtime,
    assertWritable,
    mode: d.readOnly ? ('readOnly' as const) : ('active' as const),
    get,
    act,
    handling,
    present,
    fullAccess,
    syncTasks,
    tick,
    async engineerGroups(actorId: string, tx = d.db.connection()) {
      return (await groups(tx))
        .filter((g) => g.engineerIds.includes(actorId))
        .map((g) => g.id);
    },
    leaderGroups,
    calendarConfiguration,
    async notificationHealth() {
      const failed = await runtime.listEffectRuns({
        lifecycle: 'oa.itRepair',
        status: 'failed',
        limit: 1,
      });
      const dead = await runtime.listEffectRuns({
        lifecycle: 'oa.itRepair',
        status: 'dead',
        limit: 1,
      });
      return { needsAttention: failed.length + dead.length > 0 };
    },
    async configureCalendar(
      input: Command,
      expectedRevision: string,
      windows: CalendarSnapshot['windows'],
    ) {
      try {
        new FrozenCalendar({
          schemaVersion: 1,
          version: 'validation',
          timeZone: 'Asia/Singapore',
          capturedAt: now().toISOString(),
          weekdays: [1, 2, 3, 4, 5],
          windows,
          days: [],
        });
      } catch {
        fail('INVALID_INPUT', 'windows');
      }
      return command(
        input,
        'configureCalendar',
        { expectedRevision, windows },
        null,
        async (tx) => {
          if ((await calendarConfiguration(tx)).revision !== expectedRevision)
            fail('VERSION_CONFLICT');
          await d.rules.setMany(
            ['itRepair.morning', 'itRepair.afternoon'].map((key, i) => ({
              key,
              value: windows[i],
              actorId: input.actorId,
            })),
            tx,
          );
          return calendarConfiguration(tx);
        },
      );
    },
    query: createRepairQueries({ db: d.db, now, active, groups, fail }),
    rebuildMetrics,
    async list(
      actorId: string,
      policy: RepositoryPolicy,
      page: number,
      pageSize: number,
      q = '',
      status?: string,
      sort: 'createdAt' | 'updatedAt' = 'updatedAt',
      direction: 'asc' | 'desc' = 'desc',
    ) {
      return createRepairQueries({ db: d.db, now, active, groups, fail }).list(
        actorId,
        policy,
        page,
        pageSize,
        { q, status, sort, direction },
      );
    },
    async referenceSummaries(
      id: string,
      actorId: string,
      viewPolicy: RepositoryPolicy,
      policies: Record<string, RepositoryPolicy | undefined>,
    ) {
      await get(id, actorId, viewPolicy);
      const tx = d.db.connection();
      const links = await tx
        .repository<{
          id: string;
          repairId: string;
          kind: string;
          sourceId: string;
        }>('itRepairLinks')
        .findMany({ filter: { repairId: id }, limit: 100 });
      return Promise.all(
        links.map(async (link) => {
          const p = policies[link.kind];
          const summary =
            p && d.references
              ? await d.references.summary(
                  link.kind,
                  actorId,
                  p,
                  link.sourceId,
                  tx,
                )
              : null;
          return summary
            ? {
                key: link.id,
                kind: link.kind,
                readable: true,
                number: summary.number,
                status: summary.status,
                path: `/${link.kind === 'purchase' ? 'purchase' : 'expensePlan'}/${encodeURIComponent(summary.id)}`,
              }
            : { key: link.id, kind: link.kind, readable: false };
        }),
      );
    },
    async queryOptions(actorId: string, policy: RepositoryPolicy) {
      const query = createRepairQueries({
        db: d.db,
        now,
        active,
        groups,
        fail,
      });
      const { repo, scope } = await query.prepare(actorId, policy, {});
      const groupIds = (
        await repo.groupBy({
          by: ['groupId'],
          filter: scope,
          aggregate: (a) => ({ count: a.count() }),
        })
      )
        .map((r) => r.groupId)
        .filter((id): id is string => typeof id === 'string');
      const accessible = (
        await d.db.repository<Group>('itRepairGroups').findMany()
      ).filter((g) => groupIds.includes(g.id));
      const assignees = (
        await repo.groupBy({
          by: ['assigneeId'],
          filter: scope,
          aggregate: (a) => ({ count: a.count() }),
        })
      )
        .map((r) => r.assigneeId)
        .filter((id): id is string => typeof id === 'string');
      const ids = [
        ...new Set([...assignees, ...accessible.flatMap((g) => g.engineerIds)]),
      ];
      const employees = await d.employees.getByUserIds(ids);
      return {
        groups: accessible.map((g) => ({ id: g.id, title: g.title })),
        engineers: ids.flatMap((id) => {
          const e = employees.get(id);
          return e ? [{ id, name: e.name }] : [];
        }),
        actorId,
        timeZone: await d.rules.get<string>('calendar.timeZone'),
      };
    },
    async auditExport(
      actorId: string,
      requestKey: string,
      query: import('./reporting.js').RepairQuery,
      policy: RepositoryPolicy,
    ) {
      await createRepairQueries({
        db: d.db,
        now,
        active,
        groups,
        fail,
      }).prepare(actorId, policy, query);
      return command(
        { actorId, requestKey },
        'export',
        query,
        null,
        async (tx) => {
          await d.audit.record(
            {
              actorId,
              action: 'itRepair.export',
              targetType: 'itRepairs',
              after: { query: JSON.parse(JSON.stringify(query)) as JsonObject },
            },
            tx,
          );
          return { accepted: true };
        },
      );
    },
    async save(input: Command, draft: Draft, policy: RepositoryPolicy) {
      assertWritable();
      const normalized: Draft = {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        location: draft.location.trim(),
        contact: draft.contact.trim(),
      };
      validateDraft(normalized, false, now());
      return command(input, 'save', normalized, policy, async (tx) => {
        const values = { ...normalized, updatedAt: now() };
        let row: Repair;
        if (input.id)
          row = await mutate(
            input as Command & { id: string; expectedVersion: number },
            'edit',
            values,
            policy,
            tx,
          );
        else {
          const created = {
            id: randomUUID(),
            requesterId: input.actorId,
            ...values,
            createdAt: now(),
          };
          await check(tx, policy, {
            ...created,
            status: 'draft',
            version: 1,
            statusChangedAt: now(),
          });
          row = (
            await runtime.create('oa.itRepair', created, {
              actor: { id: input.actorId },
              transaction: tx,
            })
          ).record as unknown as Repair;
        }
        await audit(tx, input, 'save', row);
        return row;
      });
    },
    async submit(
      input: Command & { id: string; expectedVersion: number },
      policy: RepositoryPolicy,
      assetPolicy?: RepositoryPolicy,
      explicitAssetPolicy?: RepositoryPolicy,
    ) {
      return command(input, 'submit', null, policy, async (tx) => {
        const at = now();
        const row = await get(input.id, input.actorId, policy, tx);
        validateDraft(row, true, at);
        const category = await d.dictionaries.get(
          'itRepairCategory',
          row.category,
          tx,
        );
        if (!category?.active) fail('INVALID_INPUT', 'category');
        const employee = await employeeFact(input.actorId, tx);
        if (
          row.assetId &&
          (!employee ||
            !(await d.assets.repairEligibility(
              row.assetId,
              employee.id,
              tx,
              assetPolicy,
              explicitAssetPolicy,
            )))
        )
          fail('INVALID_INPUT', 'assetId');
        const matching = (await groups(tx)).filter((g) =>
          g.categories.includes(row.category),
        );
        if (matching.length > 1) fail('CONFIGURATION_REQUIRED', 'category');
        const g = matching[0],
          rules = await d.rules.snapshot(RULE_KEYS, at, tx);
        const versions = (await d.rules.versions(RULE_KEYS, tx))
          .filter((v) => v.effectiveFrom <= at)
          .map((v) => ({
            id: v.id,
            key: v.key,
            effectiveFrom: v.effectiveFrom.toISOString(),
          }));
        const calendarSnapshot = await d.calendar.captureSnapshot(tx, at, [
          rules['itRepair.morning'],
          rules['itRepair.afternoon'],
        ] as CalendarSnapshot['windows']);
        const cal = new FrozenCalendar(calendarSnapshot),
          priority = (
            {
              unable: 'P2',
              partial: 'P3',
              multiple: 'P2',
              outage: 'P1',
            } as Record<string, string>
          )[row.impact];
        const department = await d.org.primaryDepartmentOf(input.actorId, tx);
        const values = {
          number: await d.sequences.next(
            'IT',
            tx,
            at,
            calendarSnapshot.timeZone,
          ),
          groupId: g?.id ?? null,
          priority,
          submittedAt: at,
          updatedAt: at,
          responseDueAt: cal.addWorkingHours(
            at,
            Number(rules[`itRepair.${priority}.response`]),
          ),
          resolutionDueAt: cal.addWorkingHours(
            at,
            Number(rules[`itRepair.${priority}.resolution`]),
          ),
          nextDueAt: cal.addWorkingHours(
            at,
            Number(rules[`itRepair.${priority}.response`]) * 0.8,
          ),
          calendarSnapshot: { ...calendarSnapshot },
          ruleSnapshot: { values: rules, versions },
          submissionSnapshot: {
            department: department
              ? { id: department.id, name: department.title }
              : null,
            location: row.location,
            category: { code: row.category, label: category.label },
          },
        };
        const result = await mutate(input, 'submit', values, policy, tx);
        const previous = await d.writer.listBySourceKey(row.id, tx);
        for (const userId of new Set(g?.leaderIds ?? []))
          if (userId !== row.requesterId && (await active(userId, tx))) {
            if (
              !previous.some(
                (p) => p.userId === userId && p.status === 'pending',
              )
            )
              await d.writer.put(
                {
                  userId,
                  sourceKey: row.id,
                  subject: 'oa.itRepair',
                  title: values.number,
                  status: 'pending',
                  createdAt: at,
                },
                tx,
              );
          }
        await tx.repository('oaTaskCenterTargets').createOne({
          values: {
            sourceType: 'oa.itRepair',
            sourceKey: row.id,
            subject: 'oa.itRepair',
            recordId: row.id,
          },
        });
        await audit(tx, input, 'submit', result);
        return result;
      });
    },
    async upload(
      input: Command & { id: string; expectedVersion: number },
      file: File,
      policy: RepositoryPolicy,
      metadata: {
        purpose: 'fault' | 'processing' | 'resolution';
        visibility: 'public' | 'internal';
      } = { purpose: 'fault', visibility: 'public' },
    ) {
      const digest = await validateFile(file);
      return command(
        input,
        'upload',
        { digest, name: file.name, type: file.type, size: file.size, metadata },
        policy,
        async (tx) => {
          const row = await get(input.id, input.actorId, policy, tx);
          if (row.groupId) await holdGroup(tx, row.groupId);
          if (row.version !== input.expectedVersion) fail('VERSION_CONFLICT');
          const isDraft = row.status === 'draft';
          const permitted = isDraft
            ? row.requesterId === input.actorId &&
              metadata.purpose === 'fault' &&
              metadata.visibility === 'public'
            : (await allowed(row, input.actorId, tx)).includes(
                metadata.visibility === 'internal' ? 'internal' : 'comment',
              ) &&
              (row.requesterId !== input.actorId ||
                (metadata.visibility === 'public' &&
                  metadata.purpose === 'fault'));
          if (!permitted) fail('ACCESS_DENIED');
          if (!isDraft)
            await check(
              tx,
              policy,
              { updatedAt: now(), version: row.version + 1 },
              row.id,
            );
          const result = isDraft
            ? await mutate(input, 'upload', { updatedAt: now() }, policy, tx)
            : ((
                await runtime.fire(
                  'oa.itRepair',
                  row.id,
                  `${metadata.visibility === 'internal' ? 'uploadInternal' : 'upload'}_${row.status}_${row.status}`,
                  {
                    actor: { id: input.actorId },
                    expect: { version: row.version },
                    input: {
                      updatedAt: now().toISOString(),
                      processing: (await noticeProcessing(
                        row,
                        tx,
                        metadata.visibility === 'internal',
                      )) as JsonObject,
                    },
                    transaction: tx,
                  },
                )
              ).record as unknown as Repair);
          if (
            (await tx.repository('itRepairFiles').count({
              filter: { repairId: row.id, purpose: metadata.purpose },
            })) >= 10
          )
            fail('ATTACHMENT_LIMIT');
          const upload = await d.files
            .repository('itRepairFiles', {
              transaction: tx,
              disk: 'local',
              accessPath: '/uploads/it-repairs',
              policy: {
                read: { scope: true },
                create: {
                  scope: { repairId: row.id, ownerId: input.actorId },
                  defaults: {
                    repairId: row.id,
                    ownerId: input.actorId,
                    purpose: metadata.purpose,
                    visibility: metadata.visibility,
                  },
                },
                update: false,
                delete: false,
              },
            })
            .uploadOne({ file });
          await audit(tx, input, 'upload', result);
          const { disk: _disk, key: _key, ...safe } = upload.record;
          return { file: safe, version: result.version };
        },
      );
    },
    async configure(
      input: Command & { id: string; expectedVersion: number },
      group: Pick<
        Group,
        | 'id'
        | 'title'
        | 'leaderIds'
        | 'engineerIds'
        | 'categories'
        | 'active'
        | 'security'
      >,
    ) {
      return command(input, 'configure', group, null, async (tx) => {
        const repo = tx.repository<Group>('itRepairGroups');
        const old = await repo.findOne({ filter: { id: input.id } });
        if ((old?.version ?? 0) !== input.expectedVersion)
          fail('VERSION_CONFLICT');
        if (
          group.active &&
          (await groups(tx)).some(
            (other) =>
              other.id !== input.id &&
              other.categories.some((category) =>
                group.categories.includes(category),
              ),
          )
        )
          fail('CONFIGURATION_REQUIRED', 'categories');
        const security = group.security ?? old?.security ?? false;
        if (security && group.categories.length)
          fail('INVALID_INPUT', 'categories');
        if (
          old &&
          !!old.security !== security &&
          (await tx
            .repository('itRepairs')
            .exists({ filter: { groupId: old.id } }))
        )
          fail('INVALID_INPUT', 'security');
        const values = {
          ...group,
          security,
          version: input.expectedVersion + 1,
          updatedAt: now(),
        };
        if (old) {
          const result = await repo.updateMany({
            filter: { id: input.id, version: old.version },
            values,
          });
          if (result.updatedCount !== 1) fail('VERSION_CONFLICT');
        } else await repo.createOne({ values });
        const routingChanged =
          !old ||
          old.active !== group.active ||
          hash([...new Set(old.leaderIds)].sort()) !==
            hash([...new Set(group.leaderIds)].sort());
        const recovery = await reconcileRouting(input, values, tx);
        if (
          routingChanged ||
          !old ||
          hash([...new Set(old.engineerIds)].sort()) !==
            hash([...new Set(group.engineerIds)].sort())
        ) {
          const membership = await recoverMembership(
            { ...values, routingCursor: null },
            tx,
            input.actorId,
          );
          recovery.hasMore ||= membership.hasMore;
          recovery.processed += membership.processed;
        }
        if (recovery.hasMore) {
          const stored = await repo.findOne({ filter: { id: group.id } });
          if (!stored?.routingCursor)
            await repo.updateMany({
              filter: { id: group.id, version: values.version },
              values: { routingCursor: '00000000-0000-0000-0000-000000000000' },
            });
        }
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'itRepair.configure',
            targetType: 'itRepairGroups',
            targetId: input.id,
            after: { version: values.version },
          },
          tx,
        );
        return { ...values, recovery };
      });
    },
    async recoverRouting(
      input: Command & { id: string; expectedVersion: number },
    ) {
      return command(input, 'recoverRouting', null, null, async (tx) => {
        const group = await tx
          .repository<Group>('itRepairGroups')
          .findOne({ filter: { id: input.id } });
        if (!group || group.version !== input.expectedVersion)
          fail('VERSION_CONFLICT');
        const recovery = await reconcileRouting(input, group, tx);
        if (group.routingCursor) {
          const membership = await recoverMembership(group, tx, input.actorId);
          recovery.hasMore ||= membership.hasMore;
          recovery.processed += membership.processed;
        }
        if (recovery.hasMore) {
          const stored = await tx
            .repository<Group>('itRepairGroups')
            .findOne({ filter: { id: group.id } });
          if (!stored?.routingCursor)
            await tx.repository('itRepairGroups').updateMany({
              filter: { id: group.id, version: group.version },
              values: {
                routingCursor: '00000000-0000-0000-0000-000000000000',
              },
            });
        }
        return recovery;
      });
    },
  };
}
export const repairServiceToken =
  createServiceToken<ReturnType<typeof createRepairService>>('oa/it-repairs');
