// @vitest-environment node
import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
import { expect, vi } from 'vitest';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
import { grantToUser } from '../employees/helpers.js';
const test = createPlatformAppTest();
test('real main SDK completed tasks retain history, current ordinary scope, safe fixed Excel and revocation', async ({
  app,
  testApp,
  request,
}) => {
  const db = app.container.resolve(databaseManagerToken),
    leave = app.container.resolve(leaveServiceToken),
    authz = app.container.resolve(authorizationToken);
  const reader = await createUser(testApp, 'Efficiency reader'),
    other = await createUser(testApp, 'Efficiency other'),
    manager = await createUser(testApp, 'Efficiency manager');
  const managerEmployee = randomUUID(),
    departmentId = randomUUID();
  for (const [user, id, managerId] of [
    [manager.user, managerEmployee, null],
    [reader.user, randomUUID(), managerEmployee],
    [other.user, randomUUID(), managerEmployee],
  ] as const)
    await db.repository('employees').createOne({
      values: {
        id,
        code: id,
        userId: user.id,
        name: user.name,
        managerId,
        status: 'regular',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  await db.repository('departments').createOne({
    values: {
      id: departmentId,
      title: 'Efficiency department',
      managerId: manager.user.id,
      active: true,
    },
  });
  for (const user of [reader.user, other.user])
    await db.repository('departmentMembers').createOne({
      values: {
        id: randomUUID(),
        departmentId,
        userId: user.id,
        primary: true,
        active: true,
      },
    });
  const ids: string[] = [];
  for (const applicant of [reader.user, other.user]) {
    const draft = await leave.create(
      {
        leaveType: 'personal',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        startHalf: 'am',
        endHalf: 'pm',
        reason: 'secret synthetic reason',
        attachments: [],
        handoverUserId: null,
        enableDelegation: false,
      },
      applicant.id,
    );
    const id = String(draft.record.id);
    ids.push(id);
    await leave.transition(
      id,
      'submit',
      applicant.id,
      Number(draft.record.lifecycleVersion),
      randomUUID(),
    );
    if (applicant.id === reader.user.id) {
      const first = await leave.detail(id, manager.user.id);
      const firstOffer = first.taskActions.find((t) =>
        t.actions.some((a) => a.name === 'return'),
      )!;
      const firstRun = first.runs.find(
        (r) => r.run.id === firstOffer.task.runId,
      )!;
      await leave.action(
        id,
        {
          target: { taskId: firstOffer.task.id },
          action: 'return',
          comment: 'Synthetic correction needed',
          input: { to: 'revision' },
          contentHash: firstRun.run.contentHash,
          requestId: randomUUID(),
        },
        manager.user.id,
      );
      const revision = await leave.detail(id, applicant.id);
      await leave.transition(
        id,
        'submit',
        applicant.id,
        Number(revision.record.lifecycleVersion),
        randomUUID(),
      );
    }
    const detail = await leave.detail(id, manager.user.id);
    const offer = detail.taskActions.find((t) =>
      t.actions.some((a) => a.name === 'approve'),
    )!;
    expect(offer).toBeDefined();
    const run = detail.runs.find((r) => r.run.id === offer.task.runId)!;
    await leave.action(
      id,
      {
        target: { taskId: offer.task.id },
        action: 'approve',
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
      },
      manager.user.id,
    );
  }
  expect(
    (await request('/reports/leave-approval-efficiency?year=2026')).status,
  ).toBe(401);
  const response = await reader.fetch(
    '/reports/leave-approval-efficiency?year=2026&month=11',
  );
  expect(response.status).toBe(200);
  const body = await response.json();
  const detail = await leave.detail(ids[0], reader.user.id);
  const tasks = detail.runs
    .flatMap((r) => r.tasks)
    .filter((t) => t.kind === 'decide' && t.status === 'completed');
  expect(tasks).toHaveLength(2);
  expect(new Set(tasks.map((task) => task.id)).size).toBe(2);
  const duration = tasks.reduce(
    (total, task) =>
      total + Date.parse(task.closedAt!) - Date.parse(task.createdAt),
    0,
  );
  expect(body).toMatchObject({
    data: [
      {
        stage: 'manager',
        completedTaskCount: 2,
        totalElapsedMs: duration,
        averageElapsedMs: Math.round(duration / 2),
      },
    ],
    meta: {
      includesHistoricalRuns: true,
      dateBasis: 'request-original-start-company-date',
    },
  });
  expect(JSON.stringify(body)).not.toContain('secret');
  expect(JSON.stringify(body)).not.toContain(manager.user.id);
  const excel = await reader.fetch(
    '/reports/leave-approval-efficiency/export?year=2026&month=11',
  );
  expect(excel.status).toBe(200);
  expect(excel.headers.get('cache-control')).toBe('no-store');
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await excel.arrayBuffer());
  expect(book.worksheets[0].getRow(1).values.slice(1)).toEqual([
    'Stage',
    'Completed decision task count',
    'Total natural elapsed ms (includes waiting)',
    'Mean natural elapsed ms (includes waiting)',
  ]);
  expect(book.worksheets[0].getRow(2).values.slice(1)).toEqual([
    'Manager',
    2,
    duration,
    Math.round(duration / 2),
  ]);
  expect(
    (
      await reader.fetch(
        '/reports/leave-approval-efficiency?year=2026&month=13',
      )
    ).status,
  ).toBe(400);
  expect(
    (await reader.fetch('/reports/leave-approval-efficiency?year=9999')).status,
  ).toBe(400);
  const chinese = await reader.fetch(
    '/reports/leave-approval-efficiency/export?year=2026&month=11&locale=zh-CN',
  );
  const chineseBook = new ExcelJS.Workbook();
  await chineseBook.xlsx.load(await chinese.arrayBuffer());
  expect(chineseBook.worksheets[0].getRow(1).values.slice(1)).toEqual([
    '环节',
    '已完成决策任务数',
    '自然总耗时毫秒（含等待）',
    '自然平均耗时毫秒（含等待）',
  ]);
  expect(chineseBook.worksheets[0].getCell('A2').value).toBe('直属上级');
  const document = await (await reader.fetch('/swagger')).json();
  for (const path of [
    '/api/reports/leave-approval-efficiency',
    '/api/reports/leave-approval-efficiency/export',
  ]) {
    expect(document.paths[path]).toBeDefined();
    const responseSchema =
      document.paths[path].get.responses['412'].content['application/json']
        .schema;
    expect(responseSchema).toBeDefined();
    expect(JSON.stringify(responseSchema)).not.toContain('undefined');
    if (responseSchema.$ref)
      expect(
        document.components.schemas[responseSchema.$ref.split('/').at(-1)],
      ).toBeDefined();
  }
  const actualViews = await leave.approvals.runViewsFor('oa.leave', ids[0]);
  for (const closedAt of [null, 'not-a-date', '1900-01-01T00:00:00Z']) {
    const spy = vi.spyOn(leave.approvals, 'runViewsFor').mockResolvedValue(
      actualViews.map((view) => ({
        ...view,
        tasks: view.tasks.map((task) =>
          task.status === 'completed' ? { ...task, closedAt } : task,
        ),
      })),
    );
    try {
      expect(
        (
          await reader.fetch(
            '/reports/leave-approval-efficiency?year=2026&month=11',
          )
        ).status,
      ).toBe(412);
      expect(
        (
          await reader.fetch(
            '/reports/leave-approval-efficiency/export?year=2026&month=11',
          )
        ).status,
      ).toBe(412);
    } finally {
      spy.mockRestore();
    }
  }
  const narrow: RepositoryPolicy = {
    read: { scope: true, fields: ['id', 'startDate'] },
    create: false,
    update: false,
    delete: false,
  };
  await expect(
    leave.approvalEfficiencyReport(
      { year: 2026, page: 1, pageSize: 20 },
      narrow,
    ),
  ).rejects.toMatchObject({ code: 'LEAVE_FIELDS_RESTRICTED' });
  const key = randomUUID();
  await grantToUser(
    testApp,
    key,
    [
      {
        resource: { type: 'composite', id: 'oa.leave' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { leaveRequests: 'allRecords' },
            },
          },
        ],
      },
    ],
    reader.user.id,
  );
  expect(
    (
      await (
        await reader.fetch(
          '/reports/leave-approval-efficiency?year=2026&month=11',
        )
      ).json()
    ).data[0].completedTaskCount,
  ).toBe(3);
  const set = await authz.permissionSets.get(key);
  if (!set) throw new Error('Missing grant');
  await authz.permissionSets.update(key, { ...set, grants: [] });
  expect(
    (
      await (
        await reader.fetch(
          '/reports/leave-approval-efficiency?year=2026&month=11',
        )
      ).json()
    ).data[0].completedTaskCount,
  ).toBe(2);
  expect(
    (
      await (
        await reader.fetch(
          '/reports/leave-approval-efficiency?year=2026&month=10',
        )
      ).json()
    ).data,
  ).toEqual([]);
});
