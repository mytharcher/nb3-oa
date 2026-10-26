// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { Application } from '@nocobase/app-server/application';
import { ApiError } from '@nocobase/app-server/router';
import {
  authenticationToken,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import type { MiddlewareHandler } from 'hono';
import { workbenchTaskRoutes } from '../../../server/routes/workbench/tasks.js';

function fixture() {
  const users = vi.fn().mockResolvedValue({
    items: [
      { id: 'applicant', name: 'Applicant' },
      { id: 'session-owner', name: 'Viewer' },
    ],
  });
  const list = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });
  const targets = { findMany: vi.fn().mockResolvedValue([]) };
  const summaries = {
    findMany: vi.fn().mockResolvedValue([]),
    groupBy: vi.fn().mockResolvedValue([]),
  };
  const repository = vi.fn((name: string) => {
    if (name === 'oaTaskCenterTargets') return targets;
    if (name === 'oaTaskCenterSummaries') return summaries;
    throw new Error(`Business repository read: ${name}`);
  });
  const state = { signedIn: true, allowed: true };
  const auth: MiddlewareHandler = async (c, next) => {
    if (!state.signedIn) return c.json({}, 401);
    c.set('auth', { user: { id: 'session-owner' } });
    await next();
  };
  const authorize = vi.fn(async () => ({
    effect: state.allowed ? 'allow' : 'deny',
  }));
  const authz: MiddlewareHandler = async (c, next) => {
    c.set('authz', { authorize });
    await next();
  };
  const app = {
    container: {
      resolve(token: unknown) {
        if (token === authenticationToken) return { required: () => auth };
        if (token === authorizationToken) return { middleware: () => authz };
        if (token === userTaskServiceToken) return { list };
        if (token === userAdministrationServiceToken) return { list: users };
        if (token === databaseManagerToken) return { repository };
        throw new Error('Unexpected business service');
      },
    },
  } as unknown as Application;
  const router = workbenchTaskRoutes(app);
  router.onError((error, c) =>
    error instanceof ApiError
      ? c.json({ error: error.reason }, error.code)
      : c.json({}, 500),
  );
  return {
    router,
    list,
    users,
    targets,
    summaries,
    state,
    authorize,
    repository,
  };
}
const task = {
  id: 'personal-entry',
  userId: 'session-owner',
  sourceType: 'approval.task',
  sourceKey: 'opaque-task',
  subject: 'oa.leave',
  title: 'LEAVE-1',
  status: 'pending',
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-02T00:00:00Z'),
};

it('requires authentication and access, rejects identity injection and does not mount middleware on other routes', async () => {
  const f = fixture();
  expect((await f.router.request('/unrelated')).status).toBe(404);
  expect(f.authorize).not.toHaveBeenCalled();
  for (const path of ['/workbench/tasks', '/workbench/announcementReceipts']) {
    expect((await f.router.request(`${path}?userId=foreign`)).status).toBe(400);
    f.state.allowed = false;
    expect((await f.router.request(path)).status).toBe(403);
    f.state.allowed = true;
    f.state.signedIn = false;
    expect((await f.router.request(path)).status).toBe(401);
    f.state.signedIn = true;
  }
  expect(f.list).not.toHaveBeenCalled();
  expect(f.repository).not.toHaveBeenCalled();
});

it('reads three fixed plugin sources and exact plugin totals without opening approval businesses', async () => {
  const f = fixture();
  f.list.mockImplementation(async (_userId, query) => ({
    data: query.sourceType === 'approval.task' ? [task] : [],
    meta: { total: query.sourceType === 'approval.task' ? 1001 : 0 },
  }));
  f.targets.findMany.mockResolvedValue([
    {
      sourceType: 'approval.task',
      sourceKey: 'opaque-task',
      recordId: 'business-record',
    },
  ]);
  f.summaries.findMany.mockResolvedValue([
    {
      subject: 'oa.leave',
      recordId: 'business-record',
      status: 'manager',
      applicantId: 'applicant',
      dueAt: null,
    },
  ]);
  const response = await f.router.request(
    '/workbench/tasks?view=pending&pageSize=100',
  );
  expect(response.status).toBe(200);
  expect(
    f.list.mock.calls.map(([userId, query]) => [userId, query.sourceType]),
  ).toEqual([
    ['session-owner', 'approval.task'],
    ['session-owner', 'oa.workItem'],
    ['session-owner', 'oa.announcementReceipt'],
  ]);
  expect(
    f.list.mock.calls.every(
      ([, query]) => query.pageSize === 100 && query.status === 'pending',
    ),
  ).toBe(true);
  expect(await response.json()).toMatchObject({
    data: [
      {
        id: 'business-record',
        title: 'LEAVE-1',
        applicant: { id: 'applicant', name: 'Applicant' },
        status: 'manager',
        amount: null,
      },
    ],
    meta: { total: 1001 },
  });
});

it('keeps applicant-owned counts and includes drafts in recent personal applications', async () => {
  const f = fixture();
  f.list.mockResolvedValue({
    data: [
      {
        ...task,
        sourceType: 'approval.application',
        sourceKey: 'oa.leave:business-record',
      },
    ],
    meta: { total: 42 },
  });
  f.summaries.findMany.mockResolvedValue([
    {
      subject: 'oa.leave',
      recordId: 'business-record',
      status: 'draft',
      applicantId: 'session-owner',
    },
  ]);
  f.summaries.groupBy.mockResolvedValue([
    { category: 'drafts', count: 8 },
    { category: 'revisions', count: 2 },
    { category: 'inProgress', count: 30 },
  ]);
  const response = await f.router.request(
    '/workbench/tasks?view=mine&pageSize=5&homeSummary=true',
  );
  expect(response.status).toBe(200);
  expect(f.list).toHaveBeenCalledExactlyOnceWith('session-owner', {
    sourceType: 'approval.application',
    includeTotal: true,
    page: 1,
    pageSize: 5,
    orderBy: 'createdAt',
    direction: 'desc',
  });
  expect(f.summaries.groupBy).toHaveBeenCalledWith(
    expect.objectContaining({ filter: { applicantId: 'session-owner' } }),
  );
  expect(f.targets.findMany).not.toHaveBeenCalled();
  expect(await response.json()).toMatchObject({
    data: [{ id: 'business-record', status: 'draft' }],
    meta: {
      total: 42,
      counts: { drafts: 8, revisions: 2, inProgress: 30 },
      attention: { submitted: [{ id: 'business-record' }] },
    },
  });
});

it('includes returned applicant work and keeps index failures from appearing as empty success', async () => {
  const f = fixture();
  f.summaries.groupBy.mockResolvedValue([{ category: 'revisions', count: 9 }]);
  f.summaries.findMany.mockResolvedValue([
    {
      subject: 'oa.leave',
      recordId: 'returned',
      status: 'revision',
      number: 'LEAVE-R',
      createdAt: task.createdAt,
    },
  ]);
  const response = await f.router.request('/workbench/tasks');
  expect(await response.json()).toMatchObject({
    data: [{ id: 'returned', status: 'revision' }],
    meta: { total: 9 },
  });
  expect(f.summaries.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      filter: { applicantId: 'session-owner', category: 'revisions' },
      limit: 100,
    }),
  );
  f.list.mockRejectedValue(new Error('index unavailable'));
  expect((await f.router.request('/workbench/tasks')).status).toBe(500);
});

it('reads announcement cards without requiring the approval page and resolves receipt IDs to announcements', async () => {
  const f = fixture();
  f.list.mockResolvedValue({
    data: [
      {
        ...task,
        sourceType: 'oa.announcementReceipt',
        sourceKey: 'receipt',
        subject: 'oa.announcementReceipt',
        title: 'Read notice',
      },
    ],
    meta: { total: 21 },
  });
  f.targets.findMany.mockResolvedValue([
    {
      sourceType: 'oa.announcementReceipt',
      sourceKey: 'receipt',
      recordId: 'announcement',
    },
  ]);
  f.summaries.findMany.mockResolvedValue([
    {
      subject: 'oa.announcementReceipt',
      recordId: 'announcement',
      status: 'published',
    },
  ]);
  const response = await f.router.request('/workbench/announcementReceipts');
  expect(response.status).toBe(200);
  expect(f.authorize).toHaveBeenCalledExactlyOnceWith({
    resource: { type: 'composite', id: 'oa.announcements' },
    action: 'view',
  });
  expect(f.list).toHaveBeenCalledWith(
    'session-owner',
    expect.objectContaining({
      sourceType: 'oa.announcementReceipt',
      status: 'pending',
      pageSize: 5,
    }),
  );
  expect(await response.json()).toEqual({
    data: {
      count: 21,
      items: [
        {
          id: 'announcement',
          announcementId: 'announcement',
          title: 'Read notice',
        },
      ],
    },
  });
});

it.each([1, 100])(
  'uses constant repository and plugin read counts for %i preview entries',
  async (size) => {
    const f = fixture();
    f.list.mockImplementation(async (_userId, query) => ({
      data:
        query.sourceType === 'approval.task'
          ? Array.from({ length: size }, (_, n) => ({ ...task, id: String(n) }))
          : [],
      meta: { total: query.sourceType === 'approval.task' ? size + 10000 : 0 },
    }));
    f.targets.findMany.mockResolvedValue([
      {
        sourceType: 'approval.task',
        sourceKey: 'opaque-task',
        recordId: 'record',
      },
    ]);
    f.summaries.findMany.mockResolvedValue([
      {
        subject: 'oa.leave',
        recordId: 'record',
        status: 'manager',
        applicantId: 'applicant',
      },
    ]);
    const response = await f.router.request('/workbench/tasks');
    expect(response.status).toBe(200);
    expect(f.list).toHaveBeenCalledTimes(3);
    expect(f.users).toHaveBeenCalledTimes(1);
    expect(f.targets.findMany).toHaveBeenCalledTimes(1);
    expect(f.summaries.findMany).toHaveBeenCalledTimes(1);
    expect(f.summaries.groupBy).toHaveBeenCalledTimes(1);
    expect((await response.json()).data).toHaveLength(size);
  },
);

it('fails closed on an incomplete index reference rather than querying a business as fallback', async () => {
  const f = fixture();
  f.list.mockResolvedValue({ data: [task], meta: { total: 1 } });
  expect((await f.router.request('/workbench/tasks')).status).toBe(500);
  expect(f.repository.mock.calls.map(([name]) => name)).toEqual([
    'oaTaskCenterTargets',
  ]);
});
