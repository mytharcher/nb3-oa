// @vitest-environment node
import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
import { expect } from 'vitest';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
import { grantToUser } from '../employees/helpers.js';
const test = createPlatformAppTest();
test('monthly approved request report enforces current row/field policies, original start month and fixed Excel', async ({
  app,
  testApp,
  request,
}) => {
  const db = app.container.resolve(databaseManagerToken),
    authz = app.container.resolve(authorizationToken);
  const reader = await createUser(testApp, 'Monthly reader'),
    other = await createUser(testApp, 'Monthly other');
  for (const [applicantId, startDate, days, status] of [
    [reader.user.id, '2026-01-31', '2.50', 'approved'],
    [reader.user.id, '2026-01-01', '0.50', 'approved'],
    [reader.user.id, '2026-01-02', '8', 'withdrawn'],
    [reader.user.id, '2026-02-01', '1', 'approved'],
    [other.user.id, '2026-01-31', '9', 'approved'],
  ] as const)
    await db.repository('leaveRequests').createOne({
      values: {
        id: randomUUID(),
        applicantId,
        createdById: applicantId,
        number: null,
        leaveType: 'annual',
        startDate,
        endDate: '2026-02-05',
        startHalf: 'am',
        endHalf: 'pm',
        days,
        reason: 'private synthetic reason',
        attachments: [],
        handoverUserId: null,
        enableDelegation: false,
        ruleSnapshot: {},
        hrRecipients: [],
        managerApproverId: null,
        requiresHr: false,
        status,
        statusChangedAt: new Date(),
        lifecycleVersion: 0,
        createdAt: new Date(),
      },
    });
  expect((await request('/reports/leave-monthly?year=2026')).status).toBe(401);
  const result = await (
    await reader.fetch('/reports/leave-monthly?year=2026&month=1')
  ).json();
  expect(result).toMatchObject({
    data: [
      {
        year: 2026,
        month: 1,
        leaveType: 'Annual leave',
        approvedRequestCount: 2,
        approvedRequestedDays: 3,
      },
    ],
    meta: { total: 1 },
  });
  expect(JSON.stringify(result)).not.toContain('private');
  expect(JSON.stringify(result)).not.toContain(other.user.id);
  const secondPage = await (
    await reader.fetch(
      '/reports/leave-monthly?year=2026&page=2&pageSize=1&direction=asc',
    )
  ).json();
  expect(secondPage).toMatchObject({
    data: [{ month: 2, approvedRequestCount: 1, approvedRequestedDays: 1 }],
    meta: { total: 2, page: 2, pageSize: 1 },
  });
  const response = await reader.fetch(
    '/reports/leave-monthly.xlsx?year=2026&month=1',
  );
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await response.arrayBuffer());
  expect(book.worksheets[0].getRow(1).values.slice(1)).toEqual([
    'Year',
    'Start month',
    'Leave type',
    'Approved request count',
    'Approved requested days (before cancellation)',
  ]);
  expect(book.worksheets[0].getRow(2).values.slice(1)).toEqual([
    2026,
    1,
    'Annual leave',
    2,
    3,
  ]);
  expect((await reader.fetch('/reports/leave-monthly?month=13')).status).toBe(
    400,
  );
  const publicService = app.container.resolve(leaveServiceToken);
  const policy: RepositoryPolicy = {
    read: { scope: true, fields: ['id', 'status', 'startDate', 'leaveType'] },
    create: false,
    update: false,
    delete: false,
  };
  await expect(
    publicService.monthlyReport({ year: 2026, page: 1, pageSize: 20 }, policy),
  ).rejects.toMatchObject({ code: 'LEAVE_FIELDS_RESTRICTED' });
  await expect(
    publicService.monthlyReport(
      { year: 2026, month: 13, page: 1, pageSize: 20 },
      policy,
    ),
  ).rejects.toMatchObject({ code: 'INVALID_REPORT_QUERY' });
  const key = `monthly-${randomUUID()}`;
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
  const all = await (
    await reader.fetch('/reports/leave-monthly?year=2026&month=1')
  ).json();
  expect(all.data[0]).toMatchObject({
    approvedRequestCount: 3,
    approvedRequestedDays: 12,
  });
  const set = await authz.permissionSets.get(key);
  if (!set) throw new Error('Missing fixture');
  await authz.permissionSets.update(key, { ...set, grants: [] });
  const revoked = await (
    await reader.fetch('/reports/leave-monthly?year=2026&month=1')
  ).json();
  expect(revoked.data[0].approvedRequestedDays).toBe(3);
});
