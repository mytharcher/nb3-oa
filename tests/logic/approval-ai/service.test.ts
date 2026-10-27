import { KnowledgeError } from '../../../server/providers/knowledge/service.js';
// @vitest-environment node
import { beforeAll, afterAll, beforeEach, expect, it, vi } from 'vitest';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createMigrator, databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { copyFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { ApprovalDirectoryService } from '../../../server/providers/approval-directory/contract.js';
import type { KnowledgeService } from '../../../server/providers/knowledge/contract.js';
import { createApprovalAiService } from '../../../server/providers/approval-ai/service.js';
import { definition, task, output } from './fixture.js';
let testDb: Awaited<ReturnType<typeof createTestDatabase>>, directory: string;
beforeAll(async () => {
  testDb = await createTestDatabase();
  directory = await mkdtemp(path.join(tmpdir(), 'oa-ai-'));
  await copyFile(
    path.resolve(
      import.meta.dirname,
      '../../../database/main/migrations/202610260001_approval_ai.ts',
    ),
    path.join(directory, '202610260001_approval_ai.ts'),
  );
  await symlink(
    path.resolve('node_modules'),
    path.join(directory, 'node_modules'),
    'dir',
  );
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, testDb.database);
  await createMigrator({
    database: testDb.database,
    container,
    sources: [{ packageName: 'approval-ai-test', directory }],
  }).latest();
});
afterAll(async () => {
  await testDb?.destroy();
  if (directory) await rm(directory, { recursive: true, force: true });
});
beforeEach(async () => {
  for (const name of [
    'oaApprovalAiTaskReviews',
    'oaApprovalAiResults',
    'oaApprovalAiSettings',
  ])
    await testDb.database.repository(name).deleteMany({ all: true });
});
async function fixture() {
  const db = testDb.database,
    def = definition();
  let clock = new Date('2026-10-26T00:00:00Z');
  let delegate: string | undefined;
  const tasks = [task('a'), task('b', 'bob')];
  def.host.task = async (id) => tasks.find((t) => t.id === id) ?? null;
  def.host.tasks = async () => tasks;
  def.host.openTasks = async () =>
    tasks.filter((t) => ['pending', 'claimed'].includes(t.status));
  const gateway = {
    catalog: vi.fn(async () => ({
      services: [{ name: 'test', models: [{ value: 'chat', kind: 'chat' }] }],
    })),
    generate: vi.fn(async () => ({ text: JSON.stringify(output()) })),
  };
  const knowledge: Partial<KnowledgeService> = {};
  const dispatch = vi.fn(async (_id: string) => {});
  const service = createApprovalAiService({
    db,
    audit: { record: async () => {} },
    authz: {
      subjects: { resolveFor: async () => [] },
      for: ({ principal }: { principal: { id: string } }) => ({
        authorize: async () => ({
          effect: 'permit',
          conditions: {
            database: {
              knowledgeDocuments: { read: true },
              knowledgeVersions: { read: true },
            },
          },
        }),
        principal,
      }),
    } as unknown as AppAuthorization,
    directory: {
      snapshot: async () => ({
        isActive: () => true,
        delegateOf: () =>
          delegate ? { to: delegate, mode: 'proxy' } : undefined,
      }),
    } as unknown as ApprovalDirectoryService,
    knowledge: knowledge as KnowledgeService,
    gateway: gateway as never,
    dispatch,
    warn: () => {},
    now: () => clock,
  });
  await service.register(def);
  await service.initialize();
  await service.saveSettings(
    def.id,
    {
      enabled: true,
      modelService: 'test',
      model: 'chat',
      basis: {},
      timeoutSeconds: 120,
      expectedVersion: 0,
    },
    'admin',
  );
  async function drain() {
    const rows = await db
      .repository('oaApprovalAiTaskReviews')
      .findMany({ filter: { status: 'queued' } });
    await Promise.all(rows.map((row) => service.process(String(row.id))));
  }
  return {
    knowledge,
    db,
    def,
    tasks,
    gateway,
    service,
    drain,
    dispatch,
    setTime: (at: string) => {
      clock = new Date(at);
    },
    setDelegate: (id: string | undefined) => {
      delegate = id;
    },
  };
}
it('GET is read-only; parallel handlers share one result, changed input creates another, old results survive disable/configuration changes', async () => {
  const f = await fixture();
  expect(
    (
      await f.service.reviews('proof.approvalAi', 'record', 'alice', (k) => k)
    )[0].status,
  ).toBe('none');
  expect(f.dispatch).not.toHaveBeenCalled();
  await Promise.all(f.tasks.map((t) => f.service.taskAssigned(t)));
  await f.drain();
  expect(f.gateway.generate).toHaveBeenCalledTimes(1);
  const rows = await f.db.repository('oaApprovalAiTaskReviews').findMany();
  expect(rows).toHaveLength(2);
  expect(rows[0].resultId).toBe(rows[1].resultId);
  const before = await f.service.reviews(
    'proof.approvalAi',
    'record',
    'alice',
    (k) => k,
  );
  expect(before[0].status).toBe('succeeded');
  await f.service.generate('a', 'alice', 'same');
  await f.drain();
  await f.service.generate('a', 'alice', 'same');
  await f.drain();
  expect(f.gateway.generate).toHaveBeenCalledTimes(1);
  f.def.host.content = async () => ({ amount: 101, text: 'changed' });
  await f.service.generate('a', 'alice', 'changed');
  await f.drain();
  expect(f.gateway.generate).toHaveBeenCalledTimes(2);
  await f.service.saveSettings(
    f.def.id,
    {
      enabled: false,
      modelService: 'test',
      model: 'chat',
      basis: {},
      timeoutSeconds: 120,
      expectedVersion: 1,
    },
    'admin',
  );
  expect(
    (
      await f.service.reviews('proof.approvalAi', 'record', 'alice', (k) => k)
    )[0],
  ).toMatchObject({ status: 'succeeded', canGenerate: false });
  await expect(f.service.generate('a', 'bob', 'foreign')).rejects.toMatchObject(
    { code: 'NOT_FOUND' },
  );
  await expect(
    f.service.saveSettings(
      f.def.id,
      {
        enabled: true,
        modelService: 'test',
        model: 'chat',
        basis: {},
        timeoutSeconds: 120,
        expectedVersion: 1,
      },
      'admin',
    ),
  ).rejects.toMatchObject({ code: 'CONFLICT' });
});
it('candidate tasks wait, delegates get independent permission-filtered input and lose access when delegation expires', async () => {
  const f = await fixture();
  f.tasks.splice(0, 2, task('a', 'alice', 'candidate'));
  f.setDelegate('proxy');
  await f.service.taskAssigned(f.tasks[0]);
  expect(f.dispatch).not.toHaveBeenCalled();
  f.tasks[0] = task('a', 'alice', 'claimed');
  f.def.host.content = async (actor, _task, content) =>
    actor.userId === 'proxy' ? { amount: content.amount } : { ...content };
  await f.service.taskAssigned(f.tasks[0]);
  await f.drain();
  expect(f.gateway.generate).toHaveBeenCalledTimes(2);
  const own = await f.service.reviews(
      'proof.approvalAi',
      'record',
      'alice',
      (k) => k,
    ),
    proxy = await f.service.reviews(
      'proof.approvalAi',
      'record',
      'proxy',
      (k) => k,
    );
  expect(own).toHaveLength(1);
  expect(proxy[0].via).toBe('delegate');
  expect(
    f.gateway.generate.mock.calls.map(
      (c) => JSON.parse((c[0] as unknown as { prompt: string }).prompt).fields,
    ),
  ).toContainEqual({ amount: 100 });
  await f.service.feedback('a', 'proxy', 'useful', 'Helpful');
  expect(
    (
      await f.service.reviews('proof.approvalAi', 'record', 'alice', (k) => k)
    )[0].feedback,
  ).toBeNull();
  f.setDelegate(undefined);
  expect(
    await f.service.reviews('proof.approvalAi', 'record', 'proxy', (k) => k),
  ).toEqual([]);
  await expect(f.service.generate('a', 'proxy', 'x')).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
});
it('model failure retries with backoff, invalid JSON requires manual retry, stale lease discards a late response', async () => {
  const f = await fixture();
  f.tasks.splice(1);
  f.gateway.generate.mockRejectedValueOnce({
    name: 'ModelError',
    code: 'rateLimit',
  });
  await f.service.taskAssigned(f.tasks[0]);
  await f.drain();
  expect(
    (
      await f.service.reviews('proof.approvalAi', 'record', 'alice', (k) => k)
    )[0].errorCode,
  ).toBe('rate_limited');
  await f.service.sweep();
  await f.drain();
  expect(f.gateway.generate).toHaveBeenCalledTimes(1);
  f.setTime('2026-10-26T00:01:01Z');
  await f.service.sweep();
  await f.drain();
  expect(f.gateway.generate).toHaveBeenCalledTimes(2);
  f.def.host.content = async () => ({ amount: 200 });
  f.gateway.generate.mockResolvedValueOnce({ text: '{' });
  await f.service.generate('a', 'alice', 'invalid');
  await f.drain();
  expect(
    (
      await f.service.reviews('proof.approvalAi', 'record', 'alice', (k) => k)
    )[0].errorCode,
  ).toBe('invalid_output');
  let complete!: (value: { text: string }) => void;
  f.gateway.generate.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  await f.service.generate('a', 'alice', 'late');
  const row = await f.db
    .repository('oaApprovalAiTaskReviews')
    .findOne({ filter: { taskId: 'a' } });
  const work = f.service.process(String(row!.id));
  await vi.waitFor(() => expect(complete).toBeTypeOf('function'));
  await f.db.repository('oaApprovalAiResults').updateMany({
    filter: { status: 'running' },
    values: {
      leaseToken: 'replacement',
      status: 'failed',
      errorCode: 'timeout',
    },
  });
  complete({ text: JSON.stringify(output()) });
  await work;
  expect(
    (
      await f.service.reviews('proof.approvalAi', 'record', 'alice', (k) => k)
    )[0],
  ).toMatchObject({ status: 'failed', errorCode: 'timeout' });
});

it('keeps inaccessible knowledge text out of the prompt and forces required checks to uncovered', async () => {
  const f = await fixture();
  f.def.basis = [{ key: 'policy', titleKey: 'policy', required: true }];
  f.def.checks = [{ ...f.def.checks[0], basis: ['policy'] }];
  f.knowledge.detail = async (_id, actorId) => {
    if (actorId === 'bob') throw new KnowledgeError('ACCESS_DENIED');
    return {
      document: {
        id: 'policy',
        folderId: null,
        title: 'PRIVATE POLICY',
        ownerId: 'admin',
        latestVersionId: 'v1',
        version: 1,
        active: true,
        departmentIds: [],
        dutyRoleCodes: [],
        updatedAt: new Date(),
      },
      versions: [
        {
          id: 'v1',
          documentId: 'policy',
          version: 1,
          kind: 'markdown',
          markdown: 'PRIVATE BASIS TEXT',
          fileId: null,
          authorId: 'admin',
          createdAt: new Date(),
        },
      ],
    };
  };
  await f.service.saveSettings(
    f.def.id,
    {
      enabled: true,
      modelService: 'test',
      model: 'chat',
      basis: { policy: 'policy' },
      timeoutSeconds: 120,
      expectedVersion: 1,
    },
    'admin',
  );
  await Promise.all(f.tasks.map((task) => f.service.taskAssigned(task)));
  await f.drain();
  expect(f.gateway.generate).toHaveBeenCalledTimes(2);
  const prompts = f.gateway.generate.mock.calls.map(
    (call) => (call[0] as unknown as { prompt: string }).prompt,
  );
  expect(
    prompts.filter((prompt) => prompt.includes('PRIVATE BASIS TEXT')),
  ).toHaveLength(1);
  expect(
    (
      await f.service.reviews('proof.approvalAi', 'record', 'bob', (key) => key)
    )[0].findings?.[0].verdict,
  ).toBe('not_covered');
  expect(
    (
      await f.service.reviews(
        'proof.approvalAi',
        'record',
        'alice',
        (key) => key,
      )
    )[0].findings?.[0].verdict,
  ).toBe('conforms');
});

it('allows a newly assigned task to retry a shared failed input without confusing it with a sweeper retry', async () => {
  const f = await fixture();
  f.tasks.splice(1);
  f.gateway.generate.mockResolvedValueOnce({ text: 'invalid JSON' });
  await f.service.taskAssigned(f.tasks[0]);
  await f.drain();
  expect(
    (
      await f.service.reviews(
        'proof.approvalAi',
        'record',
        'alice',
        (key) => key,
      )
    )[0].errorCode,
  ).toBe('invalid_output');
  f.tasks.push(task('new-task', 'alice'));
  await f.service.taskAssigned(f.tasks[1]);
  await f.drain();
  expect(f.gateway.generate).toHaveBeenCalledTimes(2);
  expect(
    (
      await f.service.reviews(
        'proof.approvalAi',
        'record',
        'alice',
        (key) => key,
      )
    ).every((review) => review.status === 'succeeded'),
  ).toBe(true);
});
