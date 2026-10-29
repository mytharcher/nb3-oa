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
}
export interface Group extends RepositoryRecord {
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
  notify: (
    id: string,
    number: string,
    recipients: string[],
    key: string,
  ) => Promise<void>;
}) {
  const now = () => d.now?.() ?? new Date();
  async function active(id: string, tx: DatabaseConnection) {
    const user = await d.users.withConnection(tx).get(id);
    const e = await d.employees.getByUserId(id, tx);
    return !!user && !user.disabledAt && !!e?.active && e.status !== 'left';
  }
  async function groups(tx: DatabaseConnection) {
    return tx
      .repository<Group>('itRepairGroups')
      .findMany({ filter: { active: true } });
  }
  async function leaderGroups(actorId: string, tx: DatabaseConnection) {
    return (await groups(tx))
      .filter((g) => g.leaderIds.includes(actorId))
      .map((g) => g.id);
  }
  async function canRead(row: Repair, actorId: string, tx: DatabaseConnection) {
    return (
      (await active(actorId, tx)) &&
      (row.requesterId === actorId ||
        (row.status !== 'draft' &&
          (await leaderGroups(actorId, tx)).includes(row.groupId ?? '')))
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
    run: async ({ record, idempotencyKey }) => {
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
      if (recipients.length)
        await d.notify(current.id, current.number!, recipients, idempotencyKey);
      if (!group?.leaderIds.some((id) => recipients.includes(id)))
        throw new Error('IT_REPAIR_GROUP_UNCONFIGURED');
    },
  });
  const lifecycle = defineLifecycle<{ record: Repair; state: string }>({
    name: 'oa.itRepair',
    collection: 'itRepairs',
    initial: 'draft',
    versionField: 'version',
    states: ['draft', 'triage'],
    transitions: {
      edit: {
        from: 'draft',
        to: 'draft',
        accept: [...INPUT_FIELDS, 'updatedAt'],
      },
      upload: { from: 'draft', to: 'draft', accept: ['updatedAt'] },
      refreshRouting: { from: 'triage', to: 'triage', accept: ['updatedAt'] },
      submit: {
        from: 'draft',
        to: 'triage',
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
    return d.db.transaction(async (tx) => {
      // PostgreSQL's default READ COMMITTED cannot freeze rule and calendar reads together.
      if (tx.dialect === 'postgres')
        await (
          await tx.client<Knex.Transaction>()
        ).raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      const lockStarted = performance.now();
      await lockUserForAdministration(tx, input.actorId);
      d.onLockAcquired?.(performance.now() - lockStarted);
      const account = await d.users.withConnection(tx).get(input.actorId);
      if (
        !account ||
        account.disabledAt ||
        (!['configure', 'configureCalendar'].includes(action) &&
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
  ) {
    await d.audit.record(
      {
        actorId: input.actorId,
        action: `itRepair.${action}`,
        targetType: 'itRepairs',
        targetId: row.id,
        after: {
          version: row.version,
          status: row.status,
          requestKey: input.requestKey,
        },
      },
      tx,
    );
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
    get,
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
      if (!(await active(actorId, d.db.connection()))) fail('ACCESS_DENIED');
      const ids = await leaderGroups(actorId, d.db.connection());
      const filter = (f: FilterBuilder) =>
        f.and([
          f.or([
            f.string('requesterId').eq(actorId),
            ...(ids.length
              ? [
                  f.and([
                    f.string('status').ne('draft'),
                    f.or(ids.map((id) => f.string('groupId').eq(id))),
                  ]),
                ]
              : []),
          ]),
          ...(q
            ? [
                f.or([
                  f.string('title').includes(q),
                  f.string('number').includes(q),
                ]),
              ]
            : []),
          ...(status ? [f.string('status').eq(status)] : []),
        ]);
      const repo = d.db.repository<Repair>('itRepairs').withPolicy(policy);
      return {
        items: await repo.findMany({
          select: (s) =>
            s.fields(
              'id',
              'title',
              'number',
              'status',
              'version',
              'updatedAt',
              'createdAt',
              'priority',
              'groupId',
              'requesterId',
            ),
          filter,
          sort: (s) =>
            direction === 'asc' ? s.field(sort).asc() : s.field(sort).desc(),
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        total: await repo.count({ filter }),
      };
    },
    async save(input: Command, draft: Draft, policy: RepositoryPolicy) {
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
        const employee = await d.employees.getByUserId(input.actorId, tx);
        if (
          row.assetId &&
          (!assetPolicy ||
            !employee ||
            !(await d.assets.read(row.assetId, tx, assetPolicy, employee.id)))
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
          if (await active(userId, tx)) {
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
    ) {
      const digest = await validateFile(file);
      return command(
        input,
        'upload',
        { digest, name: file.name, type: file.type, size: file.size },
        policy,
        async (tx) => {
          const row = await get(input.id, input.actorId, policy, tx);
          if (
            row.requesterId !== input.actorId ||
            row.status !== 'draft' ||
            row.version !== input.expectedVersion
          )
            fail('VERSION_CONFLICT');
          // Acquire the same conditional version point before counting slots or uploading bytes.
          const result = await mutate(
            input,
            'upload',
            { updatedAt: now() },
            policy,
            tx,
          );
          if (
            (await tx
              .repository('itRepairFiles')
              .count({ filter: { repairId: row.id, purpose: 'fault' } })) >= 10
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
                    purpose: 'fault',
                    visibility: 'public',
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
        'id' | 'title' | 'leaderIds' | 'engineerIds' | 'categories' | 'active'
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
        const values = {
          ...group,
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
        const repairs = await tx
          .repository<Repair>('itRepairs')
          .findMany({ filter: { groupId: input.id, status: 'triage' } });
        for (const row of repairs) {
          const previous = await d.writer.listBySourceKey(row.id, tx);
          const recipients = [];
          for (const userId of group.active ? group.leaderIds : [])
            if (await active(userId, tx)) recipients.push(userId);
          for (const item of previous)
            if (item.status === 'pending' && !recipients.includes(item.userId))
              await d.writer.setStatus(
                { userId: item.userId, sourceKey: row.id },
                'cancelled',
                tx,
              );
          for (const userId of recipients)
            if (
              !previous.some(
                (item) => item.userId === userId && item.status === 'pending',
              )
            )
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
          await runtime.fire('oa.itRepair', row.id, 'refreshRouting', {
            actor: { id: input.actorId },
            expect: { version: row.version },
            input: { updatedAt: now().toISOString() },
            transaction: tx,
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
        return values;
      });
    },
  };
}
export const repairServiceToken =
  createServiceToken<ReturnType<typeof createRepairService>>('oa/it-repairs');
