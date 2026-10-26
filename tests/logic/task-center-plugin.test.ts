// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';

import { startOrgTestApp, type OrgTestApp } from './org/helpers.ts';

describe('Task Center plugin in the OA application', () => {
  let app: OrgTestApp;
  let owner: TestSession;
  let other: TestSession;
  let admin: TestSession;
  let taskId: string;
  let apiPaths: Record<string, { get?: unknown }>;

  beforeAll(async () => {
    app = await startOrgTestApp();
    admin = await app.admin();
    owner = await app.createUser('task-center-owner');
    other = await app.createUser('task-center-other');

    const response = await admin.fetch('/swagger');
    if (response.status !== 200) throw new Error('API document unavailable');
    const document = (await response.json()) as {
      paths: Record<string, { get?: unknown }>;
    };
    apiPaths = document.paths;

    const tasks =
      app.testApp.application.container.resolve(userTaskServiceToken);
    const writer = tasks.registerSource('oa.upgrade-verification');
    const task = await writer.put({
      userId: owner.user.id,
      sourceKey: 'installation-check',
      subject: 'test',
      title: 'Task Center installation verification',
      status: 'pending',
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('publishes all personal read endpoints in the API document', () => {
    for (const path of [
      '/api/userTasks',
      '/api/userTasks/statistics',
      '/api/userTasks/categoryStatistics',
      '/api/userTasks/{id}',
    ]) {
      expect(apiPaths[path]?.get).toBeDefined();
    }
  });

  it('requires authentication for lists, statistics and details', async () => {
    for (const path of [
      '/userTasks',
      '/userTasks/statistics',
      `/userTasks/${taskId}`,
    ]) {
      expect((await app.testApp.request(path)).status).toBe(401);
    }
  });

  it('returns the signed-in owner’s list, counts and detail', async () => {
    const list = await owner.fetch('/userTasks?status=pending');
    expect(list.status).toBe(200);
    expect(await list.json()).toMatchObject({
      data: [
        {
          id: taskId,
          status: 'pending',
          sourceType: 'oa.upgrade-verification',
        },
      ],
      meta: { total: 1 },
    });
    const counts = await owner.fetch('/userTasks/statistics');
    expect(counts.status).toBe(200);
    expect(await counts.json()).toEqual({
      data: { pending: 1, completed: 0, cancelled: 0 },
    });
    const detail = await owner.fetch(`/userTasks/${taskId}`);
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({ data: { id: taskId } });
  });

  it('keeps personal tasks isolated even from an administrator', async () => {
    for (const session of [other, admin]) {
      const list = await session.fetch('/userTasks');
      expect(list.status).toBe(200);
      expect(await list.json()).toMatchObject({ data: [], meta: { total: 0 } });
      const counts = await session.fetch('/userTasks/statistics');
      expect(counts.status).toBe(200);
      expect(await counts.json()).toEqual({
        data: { pending: 0, completed: 0, cancelled: 0 },
      });
      expect((await session.fetch(`/userTasks/${taskId}`)).status).toBe(404);
    }
  });

  it('rejects caller-supplied identities on personal reads', async () => {
    for (const path of ['/userTasks', '/userTasks/statistics']) {
      expect(
        (await other.fetch(`${path}?userId=${owner.user.id}`)).status,
      ).toBe(400);
    }
  });
  it('preserves closed pagination, tab scope and owner-wide zero-count categories through the OA route', async () => {
    const service =
      app.testApp.application.container.resolve(userTaskServiceToken);
    const writer = service.registerSource('oa.pagination-check');
    const second = service.registerSource('oa.pagination-other');
    const ids: string[] = [];
    for (const [index, status] of (
      ['completed', 'pending', 'cancelled', 'completed'] as const
    ).entries()) {
      const task = await writer.put({
        userId: admin.user.id,
        sourceKey: `row-${index}`,
        subject: 'shared-subject',
        title: `Row ${index}`,
        status,
        createdAt: new Date(`2026-10-2${index}T00:00:00Z`),
      });
      ids.push(task.id);
    }
    await second.put({
      userId: admin.user.id,
      sourceKey: 'closed-only',
      subject: 'shared-subject',
      title: 'Closed only',
      status: 'completed',
    });
    await writer.put({
      userId: admin.user.id,
      sourceKey: 'other-subject',
      subject: 'different-subject',
      title: 'Other subject',
      status: 'pending',
    });
    const query =
      '/taskCenter?source=oa.pagination-check&subject=shared-subject';
    const first = await admin.fetch(`${query}&status=closed&pageSize=2`);
    expect(first.status).toBe(200);
    const body = (await first.json()) as {
      data: {
        tasks: { id: string; status: string }[];
        total: number;
        counts: unknown;
        facets: unknown[];
      };
    };
    expect(body.data.tasks).toHaveLength(2);
    expect(body.data.tasks.every((task) => task.status !== 'pending')).toBe(
      true,
    );
    expect(body.data.total).toBe(3);
    expect(body.data.counts).toEqual({ pending: 1, closed: 3, all: 4 });
    expect(body.data.facets).toEqual(
      expect.arrayContaining([
        {
          sourceType: 'oa.pagination-check',
          subject: 'shared-subject',
          pending: 1,
        },
        {
          sourceType: 'oa.pagination-other',
          subject: 'shared-subject',
          pending: 0,
        },
        {
          sourceType: 'oa.pagination-check',
          subject: 'different-subject',
          pending: 1,
        },
      ]),
    );
    expect(body.data.facets).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceType: 'oa.upgrade-verification' }),
      ]),
    );
    const next = await admin.fetch(`${query}&status=closed&pageSize=2&page=2`);
    expect(next.status).toBe(200);
    const last = (await next.json()) as {
      data: { tasks: { id: string }[]; total: number };
    };
    expect(last.data.tasks).toHaveLength(1);
    expect(last.data.total).toBe(3);
    const actualIds = [...body.data.tasks, ...last.data.tasks].map(
      (task) => task.id,
    );
    expect(new Set(actualIds).size).toBe(3);
    expect(actualIds.sort()).toEqual([ids[0], ids[2], ids[3]].sort());
    const cursorQuery = {
      sourceType: 'oa.pagination-check',
      subject: 'shared-subject',
      status: ['completed', 'cancelled'] as ('completed' | 'cancelled')[],
      pagination: 'cursor' as const,
      pageSize: 2,
      includeTotal: true,
    };
    const cursor = await service.list(admin.user.id, cursorQuery);
    expect(cursor.data.map((task) => task.id)).toEqual([ids[3], ids[2]]);
    expect(cursor.meta.total).toBe(3);
    const cursorEnd = await service.list(admin.user.id, {
      ...cursorQuery,
      after: cursor.meta.nextCursor!,
    });
    expect(cursorEnd.data.map((task) => task.id)).toEqual([ids[0]]);
    expect(cursorEnd.meta.nextCursor).toBeNull();
    const publicList = await admin.fetch(
      '/userTasks?sourceType=oa.pagination-check&subject=shared-subject&status=completed&status=cancelled&pageSize=2',
    );
    expect(publicList.status).toBe(200);
    expect(await publicList.json()).toMatchObject({
      meta: { total: 3 },
      data: [{ id: ids[3] }, { id: ids[2] }],
    });
    const pending = await admin.fetch(`${query}&status=pending`);
    expect(await pending.json()).toMatchObject({
      data: { total: 1, counts: body.data.counts, facets: body.data.facets },
    });
    const all = await admin.fetch(`${query}&status=all`);
    expect(await all.json()).toMatchObject({
      data: { total: 4, counts: body.data.counts },
    });
    const categories = await other.fetch('/userTasks/categoryStatistics');
    expect(categories.status).toBe(200);
    expect(await categories.json()).toEqual({ data: [] });
    expect(
      (
        await other.fetch(
          '/userTasks/categoryStatistics?userId=' + admin.user.id,
        )
      ).status,
    ).toBe(400);
    expect(
      (await app.testApp.request('/userTasks/categoryStatistics')).status,
    ).toBe(401);
  });
});
