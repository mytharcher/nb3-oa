// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { Application } from '@nocobase/app-server/application';
import { ApiError } from '@nocobase/app-server/router';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import routes from '../../../server/routes/task-center/index.js';
import type { MiddlewareHandler } from 'hono';
async function fixture() {
  const get = vi.fn().mockResolvedValue(undefined);
  const center = vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 2, pageSize: 10, total: 0 },
    counts: { pending: 0, completed: 0, cancelled: 0 },
    facets: [],
  });
  const findMany = vi.fn().mockResolvedValue([]),
    count = vi.fn().mockResolvedValue(0),
    groupBy = vi.fn().mockResolvedValue([]);
  const repository = vi.fn().mockReturnValue({ findMany, count, groupBy });
  const state = { signedIn: true, allowed: true };
  const auth: MiddlewareHandler = async (c, next) => {
    if (!state.signedIn) return c.json({}, 401);
    c.set('auth', { user: { id: 'session-owner' } });
    await next();
  };
  const authz: MiddlewareHandler = async (c, next) => {
    c.set('authz', {
      authorize: async () => ({ effect: state.allowed ? 'allow' : 'deny' }),
    });
    await next();
  };
  const container = {
    resolve(token: unknown) {
      if (token === authenticationToken) return { required: () => auth };
      if (token === authorizationToken) return { middleware: () => authz };
      if (token === userTaskServiceToken) return { get, center };
      if (token === databaseManagerToken)
        return {
          repository,
          transaction: async (
            work: (connection: {
              repository: typeof repository;
            }) => Promise<unknown>,
          ) => work({ repository }),
        };
      throw new Error('Unexpected service');
    },
  };
  const router = await routes[0].createRouter({
    container,
  } as unknown as Application);
  router.onError((error, c) =>
    error instanceof ApiError
      ? c.json({ error: error.reason }, error.code)
      : c.json({}, 500),
  );
  return { router, get, center, repository, findMany, count, groupBy, state };
}
it('rejects identity injection and requires the page grant for list and reference reads', async () => {
  const f = await fixture();
  expect((await f.router.request('/taskCenter?userId=other')).status).toBe(400);
  f.state.allowed = false;
  expect((await f.router.request('/taskCenter')).status).toBe(403);
  expect((await f.router.request('/taskCenter/entry/target')).status).toBe(403);
  expect(f.repository).not.toHaveBeenCalled();
  f.state.allowed = true;
  f.state.signedIn = false;
  expect((await f.router.request('/taskCenter')).status).toBe(401);
});
it('resolves through the session owner and does not read targets for a foreign or missing index item', async () => {
  const f = await fixture();
  expect(
    (await f.router.request('/taskCenter/foreign-entry/target')).status,
  ).toBe(404);
  expect(f.get).toHaveBeenCalledWith('session-owner', 'foreign-entry');
  expect(f.repository).not.toHaveBeenCalled();
  f.get.mockResolvedValue({
    sourceType: 'approval.application',
    sourceKey: 'oa.leave:record',
    subject: 'oa.leave',
  });
  const response = await f.router.request('/taskCenter/owned/target');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    data: { subject: 'oa.leave', recordId: 'record' },
  });
});
it('uses a bounded server page and counts/facets from a fixed set of database reads', async () => {
  const f = await fixture();
  const response = await f.router.request(
    '/taskCenter?source=approval.task&subject=oa.leave&status=closed&page=2&pageSize=10',
  );
  expect(response.status).toBe(200);
  expect(f.center).toHaveBeenCalledWith('session-owner', {
    sourceType: 'approval.task',
    subject: 'oa.leave',
    status: 'closed',
    page: 2,
    pageSize: 10,
    orderBy: 'updatedAt',
    direction: 'desc',
  });
  expect(f.repository).not.toHaveBeenCalled();
  expect(await response.json()).toEqual({
    data: {
      tasks: [],
      total: 0,
      counts: { pending: 0, closed: 0, all: 0 },
      facets: [],
    },
  });
});

it('pages drafts from the session-owned summary index and preserves the source facets', async () => {
  const f = await fixture();
  f.count.mockResolvedValue(11);
  f.findMany.mockResolvedValue([
    {
      id: 7,
      subject: 'oa.leave',
      recordId: 'draft-record',
      status: 'draft',
      createdAt: '2026-10-22T12:00:00Z',
    },
  ]);
  const response = await f.router.request(
    '/taskCenter?source=approval.application&category=drafts&subject=oa.leave&page=2',
  );
  expect(response.status).toBe(200);
  expect(f.count).toHaveBeenCalledWith({
    filter: {
      applicantId: 'session-owner',
      status: 'draft',
      subject: 'oa.leave',
    },
  });
  expect(f.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      filter: {
        applicantId: 'session-owner',
        status: 'draft',
        subject: 'oa.leave',
      },
      offset: 10,
      limit: 10,
    }),
  );
  expect(await response.json()).toMatchObject({
    data: {
      tasks: [
        {
          recordId: 'draft-record',
          businessStatus: 'draft',
          status: 'pending',
        },
      ],
      total: 11,
      counts: { pending: 11, closed: 0, all: 11 },
    },
  });
  f.findMany.mockClear();
  const closed = await f.router.request(
    '/taskCenter?source=approval.application&category=drafts&status=closed',
  );
  expect(await closed.json()).toMatchObject({ data: { tasks: [], total: 0 } });
  expect(f.findMany).not.toHaveBeenCalled();
  expect(
    (await f.router.request('/taskCenter?source=approval.task&category=drafts'))
      .status,
  ).toBe(400);
});

it('keeps drafts in the ordinary personal-application list with their business state', async () => {
  const f = await fixture();
  f.center.mockResolvedValue({
    data: [
      {
        id: 'personal-draft',
        userId: 'session-owner',
        sourceType: 'approval.application',
        sourceKey: 'oa.leave:record',
        subject: 'oa.leave',
        title: 'oa.leave',
        status: 'pending',
        createdAt: '2026-10-22T00:00:00Z',
        updatedAt: '2026-10-22T00:00:00Z',
      },
    ],
    meta: { total: 1 },
    counts: { pending: 1, completed: 0, cancelled: 0 },
    facets: [],
  });
  f.findMany.mockImplementation(
    async (options: {
      select?: (builder: {
        fields: (...fields: string[]) => string[];
      }) => string[];
    }) => {
      const selected = options.select?.({ fields: (...fields) => fields });
      return selected?.includes('status')
        ? [{ subject: 'oa.leave', recordId: 'record', status: 'draft' }]
        : [];
    },
  );
  const response = await f.router.request(
    '/taskCenter?source=approval.application',
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    data: {
      tasks: [
        { id: 'personal-draft', recordId: 'record', businessStatus: 'draft' },
      ],
      total: 1,
      counts: { pending: 1, closed: 0, all: 1 },
    },
  });
});
