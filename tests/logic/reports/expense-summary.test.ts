// @vitest-environment node
import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
import { expect, vi } from 'vitest';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { reimbursementExpenseSummaryToken } from '../../../server/providers/reimbursement/expense-summary.js';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
import { grantToUser } from '../employees/helpers.js';
const test = createPlatformAppTest();
test('settled expense owner, API and Excel enforce ordinary scope, safe gross totals, rollback and revocation', async ({
  app,
  testApp,
  request,
}) => {
  const db = app.container.resolve(databaseManagerToken),
    service = app.container.resolve(reimbursementExpenseSummaryToken),
    authz = app.container.resolve(authorizationToken);
  const reader = await createUser(testApp, 'Expense reader'),
    other = await createUser(testApp, 'Expense other');
  const ids: string[] = [];
  for (const [applicantId, status] of [
    [reader.user.id, 'paid'],
    [other.user.id, 'forcedPaid'],
    [reader.user.id, 'cashier'],
  ] as const) {
    const id = randomUUID(),
      paymentId = randomUUID();
    ids.push(id);
    await db.repository('reimbursementRequests').createOne({
      values: {
        id,
        applicantId,
        createdById: applicantId,
        reason: 'private expense',
        authorizationId: null,
        loanId: null,
        offsetCents: 7,
        overrunReason: '',
        lines: [
          {
            id: randomUUID(),
            category: 'other',
            date: '2026-01-31',
            amountCents: 11,
            invoiceNumber: 'private invoice',
            attachmentIds: [],
            standardExceptionReason: '',
          },
          {
            id: randomUUID(),
            category: 'other',
            date: '2026-02-01',
            amountCents: 6,
            invoiceNumber: 'private invoice',
            attachmentIds: [],
            standardExceptionReason: '',
          },
        ],
        totalCents: 17,
        financeLineFacts: {},
        status,
        paymentId,
        statusChangedAt: new Date(),
        lifecycleVersion: 1,
        createdAt: new Date(),
      },
    });
    if (status !== 'cashier')
      await db.repository('reimbursementPayments').createOne({
        values: {
          id: paymentId,
          requestId: id,
          actorId: applicantId,
          grossCents: 17,
          offsetCents: 7,
          netCents: 10,
          voucherNumber: 'private voucher',
          forced: status === 'forcedPaid',
          reason: null,
          at: new Date(),
        },
      });
  }
  expect((await request('/reports/expense-summary')).status).toBe(401);
  const response = await reader.fetch(
    '/reports/expense-summary?year=2026&month=1',
  );
  expect(response.status).toBe(200);
  const document = await (await reader.fetch('/swagger')).json();
  for (const path of [
    '/api/reports/expense-summary',
    '/api/reports/expense-summary/export',
  ]) {
    const operation = document.paths[path]?.get;
    expect(operation).toBeDefined();
    const response = operation.responses['412'];
    expect(JSON.stringify(response)).not.toContain('undefined');
    if (response.$ref)
      expect(
        document.components.responses[response.$ref.split('/').at(-1)],
      ).toBeDefined();
  }
  const result = await response.json();
  expect(result).toMatchObject({
    data: [
      {
        month: 1,
        category: 'other',
        settledRequestCount: 1,
        settledExpenseCents: 11,
      },
    ],
    meta: { total: 1 },
  });
  expect(JSON.stringify(result)).not.toContain('private');
  expect(JSON.stringify(result)).not.toContain(other.user.id);
  const exported = await reader.fetch(
    '/reports/expense-summary/export?year=2026&month=1',
  );
  expect(exported.status).toBe(200);
  expect(exported.headers.get('cache-control')).toBe('no-store');
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await exported.arrayBuffer());
  expect(book.worksheets[0].getRow(1).values.slice(1)).toEqual([
    'Year',
    'Expense month',
    'Category code',
    'Settled request count',
    'Settled gross expense cents (not cash)',
  ]);
  expect(book.worksheets[0].getRow(2).values.slice(1)).toEqual([
    2026,
    1,
    'other',
    1,
    11,
  ]);
  const chineseResponse = await reader.fetch(
    '/reports/expense-summary/export?year=2026&month=1&locale=zh-CN',
  );
  const chineseBook = new ExcelJS.Workbook();
  await chineseBook.xlsx.load(await chineseResponse.arrayBuffer());
  expect(chineseBook.worksheets[0].getCell('A1').value).toBe('年度');
  const limited = vi
    .spyOn(service, 'list')
    .mockResolvedValueOnce({ data: [], total: 10001, year: 2026 });
  expect(
    (await reader.fetch('/reports/expense-summary/export?year=2026')).status,
  ).toBe(412);
  limited.mockRestore();
  const policy: RepositoryPolicy = {
    read: {
      scope: true,
      fields: [
        'id',
        'status',
        'lines',
        'totalCents',
        'offsetCents',
        'paymentId',
      ],
    },
    create: false,
    update: false,
    delete: false,
  };
  await expect(
    service.list(
      { year: 2026, page: 1, pageSize: 20 },
      { ...policy, read: { scope: true, fields: ['id'] } },
    ),
  ).rejects.toMatchObject({ code: 'REPORT_FIELDS_RESTRICTED' });
  await expect(
    service.list({ year: 2026, month: 13, page: 1, pageSize: 20 }, policy),
  ).rejects.toMatchObject({ code: 'INVALID_REPORT_QUERY' });
  await expect(
    db.transaction(async (tx) => {
      await tx.repository('reimbursementPayments').updateMany({
        filter: { requestId: ids[0] },
        values: { netCents: 999 },
      });
      throw new Error('rollback');
    }),
  ).rejects.toThrow('rollback');
  expect(
    (
      await service.list(
        { year: 2026, month: 1, page: 1, pageSize: 20 },
        policy,
      )
    ).data[0].settledExpenseCents,
  ).toBe(22);
  const key = `expense-${randomUUID()}`;
  await grantToUser(
    testApp,
    key,
    [
      {
        resource: { type: 'composite', id: 'oa.reimbursement' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { reimbursementRequests: 'allRecords' },
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
        await reader.fetch('/reports/expense-summary?year=2026&month=1')
      ).json()
    ).data[0].settledExpenseCents,
  ).toBe(22);
  const set = await authz.permissionSets.get(key);
  if (!set) throw new Error('Missing fixture');
  await authz.permissionSets.update(key, { ...set, grants: [] });
  expect(
    (
      await (
        await reader.fetch('/reports/expense-summary?year=2026&month=1')
      ).json()
    ).data[0].settledExpenseCents,
  ).toBe(11);
  const denied = await other.fetch(
    '/reports/expense-summary?year=2026&month=1',
  );
  expect(denied.status).toBe(200);
  await db
    .repository('reimbursementPayments')
    .updateMany({ filter: { requestId: ids[0] }, values: { netCents: 999 } });
  expect(
    (await reader.fetch('/reports/expense-summary/export?year=2026')).status,
  ).toBe(412);
});
