import { demoNow } from '../demo-data/context.js';
import { createHash, randomUUID } from 'node:crypto';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import {
  LifecycleRuntime,
  defineLifecycle,
  defineEffect,
  type EffectDispatcher,
  type JsonObject,
} from '@nocobase/lifecycle';
import { createAppLifecycleStore } from '../approval-runtime/repository-store.js';
import type { AuditService } from '../audit/index.js';
import type { OrgService } from '../org/contract.js';
import type { Employee } from '../employees/contract.js';
import {
  ANNOUNCEMENT_FIELDS,
  RECEIPT_FIELDS,
  type Announcement,
  type Receipt,
  type Command,
  type AnnouncementService,
} from './contract.js';
export class AnnouncementError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
function fail(code: string): never {
  throw new AnnouncementError(code);
}
const hash = (x: unknown) =>
  createHash('sha256')
    .update(
      JSON.stringify(x, (_key, v: unknown) =>
        v && typeof v === 'object' && !Array.isArray(v)
          ? Object.fromEntries(
              Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
            )
          : v,
      ),
    )
    .digest('hex');
export function createAnnouncementService(d: {
  db: DatabaseManager;
  audit: AuditService;
  org: OrgService;
  dispatcher?: EffectDispatcher;
  now?: () => Date;
  notify?: (users: string[], id: string, key: string) => Promise<void>;
  knowledgeSnapshot?: (
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ) => Promise<NonNullable<Announcement['knowledgeLink']>>;
}): AnnouncementService & { runtime: LifecycleRuntime } {
  const now = () => d.now?.() ?? demoNow();
  const active = (a: Announcement) =>
    a.status === 'published' &&
    new Date(a.validFrom) <= now() &&
    now() < new Date(a.validUntil);
  const notice = defineEffect<{
    record: Announcement & { readonly [key: string]: unknown };
    state: Announcement['status'];
  }>({
    name: 'oa.announcement.notice',
    retry: { attempts: 5, backoffMs: 5000, factor: 2 },
    run: async ({ record, idempotencyKey }) => {
      const current = await d.db
        .repository<Announcement>('announcements')
        .findOne({ filter: { id: record.id } });
      if (!current || !active(current)) return;
      const rows = await d.db
        .repository<Receipt>('announcementReceipts')
        .findMany({ filter: { announcementId: record.id } });
      const candidates = rows
        .filter((r) =>
          record.requiresConfirmation ? r.status === 'pending' : true,
        )
        .map((r) => r.userId);
      const employees = await d.db.repository<Employee>('employees').findMany({
        filter: (f) =>
          f.and([f.boolean('active').isTrue(), f.string('status').ne('left')]),
      });
      const activeUsers = new Set(employees.map((e) => e.userId));
      const users = candidates.filter((id) => activeUsers.has(id));
      if (users.length) await d.notify?.(users, record.id, idempotencyKey);
    },
  });
  const life = defineLifecycle<{
    record: Announcement & { readonly [key: string]: unknown };
    state: Announcement['status'];
  }>({
    name: 'oa.announcement',
    collection: 'announcements',
    versionField: 'version',
    initial: 'draft',
    states: [
      'draft',
      'scheduled',
      'published',
      { name: 'revoked', final: true },
    ],
    onEnter: { published: [notice] },
    triggers: {
      activate: {
        transition: 'activate',
        when: 'scheduled',
        after: () => 0,
      },
    },
    transitions: {
      publish: {
        from: 'draft',
        to: ['scheduled', 'published'],
        route: ({ input }) => (input.deferred ? 'scheduled' : 'published'),
        accept: ['publishedAt'],
      },
      revoke: { from: ['scheduled', 'published'], to: 'revoked' },
      activate: {
        from: 'scheduled',
        to: 'published',
        guard: ({ record }) => new Date(record.validFrom) <= now(),
      },
      remind: { from: 'published', to: 'published' },
      edit: {
        from: 'draft',
        to: 'draft',
        accept: [
          'title',
          'body',
          'audience',
          'requiresConfirmation',
          'pinned',
          'attachments',
          'knowledgeLink',
          'validFrom',
          'validUntil',
        ],
      },
    },
  });
  const receiptLife = defineLifecycle<{
    record: Receipt & { readonly [key: string]: unknown };
    state: Receipt['status'];
  }>({
    name: 'oa.announcementReceipt',
    collection: 'announcementReceipts',
    versionField: 'version',
    initial: 'pending',
    states: ['pending', { name: 'confirmed', final: true }],
    transitions: {
      confirm: { from: 'pending', to: 'confirmed', accept: ['confirmedAt'] },
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
  runtime.register(life);
  runtime.register(receiptLife);
  async function fire(
    name: string,
    id: string,
    action: string,
    values: unknown,
    actorId: string,
    version: number,
    tx: DatabaseConnection,
  ) {
    return (
      await runtime.fire(name, id, action, {
        input: JSON.parse(JSON.stringify(values)) as JsonObject,
        actor: { id: actorId },
        expect: { version },
        transaction: tx,
      })
    ).record;
  }
  async function lock(id: string, tx: DatabaseConnection) {
    const r = await tx
      .repository('announcements')
      .updateMany({ filter: { id }, values: { version: { increment: 0 } } });
    if (r.updatedCount !== 1) fail('NOT_FOUND');
    return (await tx
      .repository<Announcement>('announcements')
      .findOne({ filter: { id } }))!;
  }
  async function checked(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ) {
    if (policy?.read === false) fail('ACCESS_DENIED');
    const repo = tx.repository<Announcement>('announcements');
    const row = await (policy ? repo.withPolicy(policy) : repo).findOne({
      filter: { id },
    });
    if (!row) return undefined;
    if (ANNOUNCEMENT_FIELDS.some((k) => !(k in row))) fail('ACCESS_DENIED');
    const employee = await tx
      .repository<Employee>('employees')
      .findOne({ filter: { userId: actorId } });
    if (!employee?.active || employee.status === 'left') return undefined;
    if (row.publisherUserId === actorId) return row as Announcement;
    if (
      !active(row as Announcement) ||
      !(await tx
        .repository('announcementReceipts')
        .exists({ filter: { announcementId: id, userId: actorId } }))
    )
      return undefined;
    return row as Announcement;
  }
  async function writePolicy(
    tx: DatabaseConnection,
    p: RepositoryPolicy | undefined,
    values: Record<string, unknown>,
    id?: string,
  ) {
    if (!p) return;
    if ((id ? p.update : p.create) === false) fail('ACCESS_DENIED');
    const r = tx.repository('announcements').withPolicy(p);
    const result = await r.validateMutation(
      id
        ? {
            operation: 'updateOne',
            filter: { id },
            values: values as RepositoryRecord,
          }
        : { operation: 'createOne', values: values as RepositoryRecord },
    );
    if (!result.valid) fail('ACCESS_DENIED');
  }
  async function command<T>(
    input: Command,
    kind: string,
    tx: DatabaseConnection,
    work: () => Promise<T>,
    replay?: (value: T) => Promise<void>,
  ): Promise<T> {
    if (!input.requestId || input.requestId.length > 128) fail('INVALID_INPUT');
    const id = hash(input.requestId),
      payloadHash = hash({ kind, input });
    const old = await tx
      .repository<{
        id: string;
        actorId: string;
        payloadHash: string;
        result: T;
      }>('announcementCommands')
      .findOne({ filter: { id } });
    if (old) {
      if (old.actorId !== input.actorId || old.payloadHash !== payloadHash)
        fail('COMMAND_CONFLICT');
      await replay?.(old.result);
      return old.result;
    }
    const result = await work();
    await tx.repository('announcementCommands').createOne({
      values: {
        id,
        actorId: input.actorId,
        payloadHash,
        result: JSON.parse(JSON.stringify(result)) as Record<string, unknown>,
      },
    });
    const document = result as { id?: unknown; announcementId?: unknown };
    await d.audit.record(
      {
        actorId: input.actorId,
        action: `announcement.${kind}`,
        targetType:
          kind === 'confirm' ? 'announcementReceipts' : 'announcements',
        targetId: typeof document.id === 'string' ? document.id : id,
        after: {
          kind,
          commandId: id,
          ...(typeof document.announcementId === 'string'
            ? { announcementId: document.announcementId }
            : {}),
        },
      },
      tx,
    );
    return result;
  }
  async function recipients(a: Announcement, tx: DatabaseConnection) {
    const wanted = new Set<string>();
    for (const dept of a.audience.departmentIds) {
      const ids = await d.org.subtreeIds(dept, tx);
      if (!ids.length || !(await d.org.activeChain(dept, tx)))
        fail('INVALID_AUDIENCE');
      for (const id of ids) wanted.add(id);
    }
    const roles = new Set<string>();
    for (const code of a.audience.dutyRoleCodes) {
      const exists = await tx
        .repository('dutyRoles')
        .exists({ filter: { code, active: true } });
      if (!exists) fail('INVALID_AUDIENCE');
      for (const userId of await d.org.dutyRoleMembers(code, tx))
        roles.add(userId);
    }
    const employees = await tx.repository<Employee>('employees').findMany({
      filter: (f) =>
        f.and([f.boolean('active').isTrue(), f.string('status').ne('left')]),
    });
    const departments = await d.org.primaryDepartmentsOf(
      employees.map((e) => e.userId),
      tx,
    );
    return employees.filter(
      (e) =>
        a.audience.all ||
        roles.has(e.userId) ||
        wanted.has(departments.get(e.userId)?.id ?? ''),
    );
  }
  return {
    runtime,
    get: checked,
    async linkedVersionAudience(documentId, tx) {
      const rows = await tx.repository<Announcement>('announcements').findMany({
        filter: { status: 'published' },
      });
      const result: { announcementId: string; userIds: string[] }[] = [];
      for (const row of rows) {
        if (!active(row) || row.knowledgeLink?.documentId !== documentId)
          continue;
        const receipts = await tx
          .repository<Receipt>('announcementReceipts')
          .findMany({
            filter: { announcementId: row.id },
            select: (s) => s.fields('userId'),
          });
        result.push({
          announcementId: row.id,
          userIds: [...new Set(receipts.map((r) => r.userId))],
        });
      }
      return result;
    },
    async versionNoticeEligible(input, tx, policy) {
      try {
        const row = await checked(
          input.announcementId,
          input.actorId,
          tx,
          policy,
        );
        return Boolean(
          row &&
          active(row) &&
          row.knowledgeLink?.documentId === input.documentId,
        );
      } catch (error) {
        if (
          error instanceof AnnouncementError &&
          error.code === 'ACCESS_DENIED'
        )
          return false;
        throw error;
      }
    },
    async save(input, connection, policy, knowledgePolicy) {
      return connection.transaction(async (tx) => {
        const employee = await tx
          .repository<Employee>('employees')
          .findOne({ filter: { userId: input.actorId } });
        if (!employee?.active || employee.status === 'left')
          fail('ACCESS_DENIED');
        if (input.id) await lock(input.id, tx);
        return command(
          input,
          'save',
          tx,
          async () => {
            const previous = input.id
              ? await checked(input.id, input.actorId, tx, policy)
              : undefined;
            if (
              input.id &&
              (!previous || previous.publisherUserId !== input.actorId)
            )
              fail('ACCESS_DENIED');
            if (
              previous &&
              (previous.status !== 'draft' ||
                previous.version !== input.expectedVersion)
            )
              fail('VERSION_CONFLICT');
            const start = new Date(input.validFrom),
              end = new Date(input.validUntil);
            if (
              !input.title.trim() ||
              input.title.length > 200 ||
              !input.body.trim() ||
              input.body.length > 100000 ||
              !Number.isFinite(+start) ||
              !Number.isFinite(+end) ||
              end <= start ||
              end <= now() ||
              (!input.audience.all &&
                !input.audience.departmentIds.length &&
                !input.audience.dutyRoleCodes.length) ||
              input.attachments.length > 10 ||
              new Set(input.attachments).size !== input.attachments.length
            )
              fail('INVALID_INPUT');
            const id = previous?.id ?? randomUUID();
            for (const fileId of input.attachments) {
              if (
                !(await tx.repository('announcementFiles').exists({
                  filter: {
                    id: fileId,
                    announcementId: id,
                    ownerId: input.actorId,
                  },
                }))
              )
                fail('INVALID_ATTACHMENT');
            }
            // An omitted optional field preserves a draft's existing reference, including
            // one redacted by the current knowledge view policy in the browser DTO.
            // Explicit null still removes it; new selections require a fresh snapshot.
            let knowledgeLink: Announcement['knowledgeLink'] =
              input.knowledgeDocumentId === undefined
                ? (previous?.knowledgeLink ?? null)
                : null;
            if (input.knowledgeDocumentId) {
              if (!knowledgePolicy || !d.knowledgeSnapshot)
                fail('KNOWLEDGE_UNAVAILABLE');
              knowledgeLink = await d.knowledgeSnapshot(
                input.knowledgeDocumentId,
                input.actorId,
                tx,
                knowledgePolicy,
              );
            }
            const values = {
              title: input.title.trim(),
              body: input.body,
              audience: input.audience,
              requiresConfirmation: input.requiresConfirmation,
              pinned: input.pinned,
              attachments: input.attachments,
              knowledgeLink,
              validFrom: start,
              validUntil: end,
            };
            await writePolicy(
              tx,
              policy,
              previous
                ? {
                    ...values,
                    status: 'draft',
                    version: previous.version + 1,
                    statusChangedAt: now(),
                  }
                : {
                    id,
                    publisherUserId: input.actorId,
                    status: 'draft',
                    version: 1,
                    publishedAt: null,
                    statusChangedAt: now(),
                    ...values,
                  },
              previous?.id,
            );
            if (previous)
              return (await fire(
                'oa.announcement',
                id,
                'edit',
                values,
                input.actorId,
                previous.version,
                tx,
              )) as unknown as Announcement;
            return (
              await runtime.create(
                'oa.announcement',
                {
                  id,
                  publisherUserId: input.actorId,
                  publishedAt: null,
                  ...values,
                },
                { actor: { id: input.actorId }, transaction: tx },
              )
            ).record as unknown as Announcement;
          },
          async (value) => {
            const a = await checked(value.id, input.actorId, tx, policy);
            if (!a || a.publisherUserId !== input.actorId)
              fail('ACCESS_DENIED');
            await writePolicy(
              tx,
              policy,
              input.id
                ? {
                    title: input.title,
                    body: input.body,
                    version: a.version,
                    statusChangedAt: now(),
                  }
                : { ...a },
              input.id,
            );
          },
        );
      });
    },
    async act(input, connection, policy, knowledgePolicy) {
      return connection.transaction(async (tx) => {
        await lock(input.id, tx);
        return command(
          input,
          input.action,
          tx,
          async () => {
            const a = await checked(input.id, input.actorId, tx, policy);
            if (!a || a.publisherUserId !== input.actorId)
              fail('ACCESS_DENIED');
            if (a.version !== input.expectedVersion) fail('VERSION_CONFLICT');
            await writePolicy(
              tx,
              policy,
              {
                status:
                  input.action === 'revoke'
                    ? 'revoked'
                    : input.action === 'publish' &&
                        new Date(a.validFrom) > now()
                      ? 'scheduled'
                      : 'published',
                version: a.version + 1,
                statusChangedAt: now(),
                ...(input.action === 'publish' ? { publishedAt: now() } : {}),
              },
              a.id,
            );
            if (input.action === 'publish') {
              if (a.knowledgeLink) {
                if (!knowledgePolicy || !d.knowledgeSnapshot)
                  fail('KNOWLEDGE_UNAVAILABLE');
                await d.knowledgeSnapshot(
                  a.knowledgeLink.documentId,
                  input.actorId,
                  tx,
                  knowledgePolicy,
                );
              }
              if (a.status !== 'draft' || new Date(a.validUntil) <= now())
                fail('INVALID_STATE');
              const people = await recipients(a, tx);
              if (!people.length) fail('EMPTY_AUDIENCE');
              for (const employee of people)
                await runtime.create(
                  'oa.announcementReceipt',
                  {
                    id: randomUUID(),
                    announcementId: a.id,
                    userId: employee.userId,
                    employeeId: employee.id,
                    name: employee.name,
                    confirmedAt: null,
                  },
                  { actor: { id: input.actorId }, transaction: tx },
                );
            } else if (
              !['published', 'scheduled'].includes(a.status) ||
              (input.action === 'remind' &&
                (!active(a) || !a.requiresConfirmation))
            )
              fail('INVALID_STATE');
            return (await fire(
              'oa.announcement',
              a.id,
              input.action,
              input.action === 'publish'
                ? {
                    publishedAt: now(),
                    deferred: new Date(a.validFrom) > now(),
                  }
                : {},
              input.actorId,
              a.version,
              tx,
            )) as unknown as Announcement;
          },
          async () => {
            const a = await checked(input.id, input.actorId, tx, policy);
            if (!a || a.publisherUserId !== input.actorId)
              fail('ACCESS_DENIED');
            await writePolicy(
              tx,
              policy,
              { status: a.status, version: a.version, statusChangedAt: now() },
              a.id,
            );
          },
        );
      });
    },
    async confirm(input, connection, policy) {
      return connection.transaction(async (tx) => {
        await lock(input.id, tx);
        return command(
          input,
          'confirm',
          tx,
          async () => {
            const a = await checked(input.id, input.actorId, tx, policy);
            if (!a || !active(a) || !a.requiresConfirmation)
              fail('ACCESS_DENIED');
            const receipt = await tx
              .repository<Receipt>('announcementReceipts')
              .findOne({
                filter: { announcementId: a.id, userId: input.actorId },
              });
            if (!receipt) fail('ACCESS_DENIED');
            if (receipt.status === 'confirmed') return receipt;
            return (await fire(
              'oa.announcementReceipt',
              receipt.id,
              'confirm',
              { confirmedAt: now() },
              input.actorId,
              receipt.version,
              tx,
            )) as unknown as Receipt;
          },
          async () => {
            const a = await checked(input.id, input.actorId, tx, policy);
            if (!a || !active(a) || !a.requiresConfirmation)
              fail('ACCESS_DENIED');
          },
        );
      });
    },
    async ownReceipt(id, actorId, tx, policy) {
      const a = await checked(id, actorId, tx, policy);
      if (!a) return null;
      return (
        (await tx
          .repository<Receipt>('announcementReceipts')
          .findOne({ filter: { announcementId: a.id, userId: actorId } })) ??
        null
      );
    },
    async receipts(id, actorId, tx, policy, receiptPolicy) {
      const a = await checked(id, actorId, tx, policy);
      if (!a || a.publisherUserId !== actorId) fail('ACCESS_DENIED');
      const repo = tx.repository<Receipt>('announcementReceipts');
      const rows = await (
        receiptPolicy ? repo.withPolicy(receiptPolicy) : repo
      ).findMany({ filter: { announcementId: id } });
      if (rows.some((r) => RECEIPT_FIELDS.some((k) => !(k in r))))
        fail('ACCESS_DENIED');
      return rows as Receipt[];
    },
    async listForCenter(actorId, tx, policies) {
      const pending = await this.pending(actorId, tx, policies.view);
      const items = [];
      for (const summary of pending.items) {
        const a = await checked(
          summary.announcementId,
          actorId,
          tx,
          policies.confirm,
        );
        if (!a || !active(a) || !a.requiresConfirmation) continue;
        items.push({
          id: a.id,
          initiatorId: a.publisherUserId,
          title: summary.title,
          status: 'pending' as const,
          dueAt: summary.dueAt.toISOString(),
          createdAt: new Date(a.publishedAt!).toISOString(),
        });
      }
      return items;
    },
    async pending(actorId, tx, policy) {
      const receipts = await tx
        .repository<Receipt>('announcementReceipts')
        .findMany({ filter: { userId: actorId, status: 'pending' } });
      const items = [];
      for (const r of receipts) {
        const a = await checked(r.announcementId, actorId, tx, policy);
        if (a && active(a) && a.requiresConfirmation)
          items.push({
            id: r.id,
            announcementId: a.id,
            title: a.title,
            dueAt: new Date(a.validUntil),
          });
      }
      items.sort((a, b) => +a.dueAt - +b.dueAt);
      return { items, count: items.length };
    },
  };
}
