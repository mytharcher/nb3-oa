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
test('real main SDK return and resubmission batches preserve ordinary scope, safe Excel and revocation', async ({
  app,
  testApp,
  request,
}) => {
  const db = app.container.resolve(databaseManagerToken),
    leave = app.container.resolve(leaveServiceToken),
    authz = app.container.resolve(authorizationToken);
  const reader = await createUser(testApp, 'Return rate reader'),
    other = await createUser(testApp, 'Return rate other'),
    manager = await createUser(testApp, 'Return rate manager');
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
      title: 'Return rate department',
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
      expect(
        typeof (await db
          .repository('leaveRequests')
          .findOne({ filter: { id } }))!.days,
      ).toBe('string');
      expect(typeof firstRun.run.content.days).toBe('string');
      expect(firstRun.run.content.days).toBe('1');
      const revision = await leave.detail(id, applicant.id);
      await leave.transition(
        id,
        'submit',
        applicant.id,
        Number(revision.record.lifecycleVersion),
        randomUUID(),
      );
    }
  }
  expect(
    (await request('/reports/leave-approval-return-rate?year=2026')).status,
  ).toBe(401);
  const response = await reader.fetch(
    '/reports/leave-approval-return-rate?year=2026&month=11',
  );
  expect(response.status).toBe(200);
  const body = await response.json();
  const detail = await leave.detail(ids[0], reader.user.id);
  const tasks = detail.runs
    .flatMap((r) => r.tasks)
    .filter((t) => t.kind === 'decide' && t.status === 'completed');
  expect(tasks).toHaveLength(1);
  expect(new Set(tasks.map((task) => task.id)).size).toBe(1);
  expect(body).toMatchObject({
    data: [
      {
        year: 2026,
        month: 11,
        submittedRunCount: 2,
        returnedRunCount: 1,
        returnDecisionCount: 1,
        returnRateBasisPoints: 5000,
      },
    ],
    meta: {
      includesHistoricalRuns: true,
      includesOpenRuns: true,
      dateBasis: 'request-current-start-company-date',
      basis: 'leave-returned-runs-over-submitted-runs',
    },
  });
  expect(JSON.stringify(body)).not.toContain('secret');
  expect(JSON.stringify(body)).not.toContain(manager.user.id);
  const excel = await reader.fetch(
    '/reports/leave-approval-return-rate/export?year=2026&month=11',
  );
  expect(excel.status).toBe(200);
  expect(excel.headers.get('cache-control')).toBe('no-store');
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await excel.arrayBuffer());
  expect(book.worksheets[0].getRow(1).values.slice(1)).toEqual([
    'Current start year',
    'Current start month',
    'Submitted runs (includes open)',
    'Runs with a return',
    'Return decision count',
    'Return rate basis points',
  ]);
  expect(book.worksheets[0].getRow(2).values.slice(1)).toEqual([
    2026, 11, 2, 1, 1, 5000,
  ]);
  expect(
    (
      await reader.fetch(
        '/reports/leave-approval-return-rate?year=2026&month=13',
      )
    ).status,
  ).toBe(400);
  expect(
    (await reader.fetch('/reports/leave-approval-return-rate?year=9999'))
      .status,
  ).toBe(400);
  const chinese = await reader.fetch(
    '/reports/leave-approval-return-rate/export?year=2026&month=11&locale=zh-CN',
  );
  const chineseBook = new ExcelJS.Workbook();
  await chineseBook.xlsx.load(await chinese.arrayBuffer());
  expect(chineseBook.worksheets[0].getRow(1).values.slice(1)).toEqual([
    '当前开始年',
    '当前开始月',
    '提交批次数（含在途）',
    '发生退回的批次数',
    '实际退回决策数',
    '退回率基点',
  ]);
  const document = await (await reader.fetch('/swagger')).json();
  for (const path of [
    '/api/reports/leave-approval-return-rate',
    '/api/reports/leave-approval-return-rate/export',
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
          task.answer === 'return' ? { ...task, closedAt } : task,
        ),
      })),
    );
    try {
      expect(
        (
          await reader.fetch(
            '/reports/leave-approval-return-rate?year=2026&month=11',
          )
        ).status,
      ).toBe(412);
      expect(
        (
          await reader.fetch(
            '/reports/leave-approval-return-rate/export?year=2026&month=11',
          )
        ).status,
      ).toBe(412);
    } finally {
      spy.mockRestore();
    }
  }
  await expect(
    leave.approvalReturnRateReport(
      { year: 2026, page: 1, pageSize: 20 },
      undefined as unknown as RepositoryPolicy,
    ),
  ).rejects.toMatchObject({
    code: 'LEAVE_FIELDS_RESTRICTED',
    kind: 'permission',
  });
  const narrow: RepositoryPolicy = {
    read: { scope: true, fields: ['id', 'startDate'] },
    create: false,
    update: false,
    delete: false,
  };
  await expect(
    leave.approvalReturnRateReport(
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
          '/reports/leave-approval-return-rate?year=2026&month=11',
        )
      ).json()
    ).data[0].submittedRunCount,
  ).toBe(3);
  const set = await authz.permissionSets.get(key);
  if (!set) throw new Error('Missing grant');
  await authz.permissionSets.update(key, { ...set, grants: [] });
  expect(
    (
      await (
        await reader.fetch(
          '/reports/leave-approval-return-rate?year=2026&month=11',
        )
      ).json()
    ).data[0].submittedRunCount,
  ).toBe(2);
  expect(
    (
      await (
        await reader.fetch(
          '/reports/leave-approval-return-rate?year=2026&month=10',
        )
      ).json()
    ).data,
  ).toEqual([]);
  const draft = await leave.create(
    {
      leaveType: 'personal',
      startDate: '2026-11-03',
      endDate: '2026-11-03',
      startHalf: 'am',
      endHalf: 'pm',
      reason: 'synthetic draft',
      attachments: [],
      handoverUserId: null,
      enableDelegation: false,
    },
    reader.user.id,
  );
  const report = () =>
    reader
      .fetch('/reports/leave-approval-return-rate?year=2026&month=11')
      .then((r) => r.json());
  expect((await report()).data[0].submittedRunCount).toBe(2);
  await leave.transition(
    String(draft.record.id),
    'submit',
    reader.user.id,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  expect((await report()).data[0]).toMatchObject({
    submittedRunCount: 3,
    returnedRunCount: 1,
    returnDecisionCount: 1,
    returnRateBasisPoints: 3333,
  });
  const duplicate = vi
    .spyOn(leave.approvals, 'runViewsFor')
    .mockResolvedValue([...actualViews, actualViews[0]]);
  try {
    expect(
      (
        await reader.fetch(
          '/reports/leave-approval-return-rate?year=2026&month=11',
        )
      ).status,
    ).toBe(412);
  } finally {
    duplicate.mockRestore();
  }
  const current = await leave.detail(String(draft.record.id), manager.user.id);
  const task = current.taskActions.find((t) =>
    t.actions.some((a) => a.name === 'return'),
  )!;
  const activeRun = current.runs.find((r) => r.run.id === task.task.runId)!;
  await leave.action(
    String(draft.record.id),
    {
      target: { taskId: task.task.id },
      action: 'return',
      comment: 'Move synthetic dates',
      input: { to: 'revision' },
      contentHash: activeRun.run.contentHash,
      requestId: randomUUID(),
    },
    manager.user.id,
  );
  const revision = await leave.detail(String(draft.record.id), reader.user.id);
  await leave.transition(
    String(draft.record.id),
    'edit',
    reader.user.id,
    Number(revision.record.lifecycleVersion),
    randomUUID(),
    { startDate: '2026-12-01', endDate: '2026-12-01' },
  );
  const edited = await leave.detail(String(draft.record.id), reader.user.id);
  await leave.transition(
    String(draft.record.id),
    'submit',
    reader.user.id,
    Number(edited.record.lifecycleVersion),
    randomUUID(),
  );
  expect((await report()).data[0]).toMatchObject({
    submittedRunCount: 2,
    returnRateBasisPoints: 5000,
  });
  const december = await (
    await reader.fetch('/reports/leave-approval-return-rate?year=2026&month=12')
  ).json();
  expect(december.data[0]).toMatchObject({
    month: 12,
    submittedRunCount: 2,
    returnedRunCount: 1,
    returnDecisionCount: 1,
    returnRateBasisPoints: 5000,
  });
}, 120000);
