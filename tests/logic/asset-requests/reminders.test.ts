// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import { createAssetRequestsAppTest } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { assetRequestServiceToken } from '../../../server/providers/asset-requests/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
const test = createAssetRequestsAppTest();
test('company-local reminders use real inbox dedupe after audit rollback, weekly buckets and pagination beyond 100', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    calendar = c.resolve(calendarServiceToken),
    service = c.resolve(assetRequestServiceToken),
    audit = c.resolve(auditServiceToken),
    inbox = c.resolve(inAppNotificationStoreToken);
  const borrower = await createEmployee(testApp, 'Reminder borrower'),
    now = new Date('2026-10-11T16:30:00Z'),
    today = calendar.localDate(now),
    due = calendar.addCalendarDays(today, 3),
    id = randomUUID();
  async function fixture(requestId: string, borrowDueDate: string) {
    await db.repository('assetRequests').createOne({
      values: {
        id: requestId,
        applicantId: borrower.userId,
        createdById: borrower.userId,
        employeeId: borrower.employeeId,
        operation: 'borrow',
        category: null,
        assetIds: [],
        quantity: 1,
        purpose: 'Reminder fixture',
        borrowDueDate,
        scrapReason: '',
        photos: [],
        status: 'returning',
        lifecycleVersion: 1,
        statusChangedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  await fixture(id, due);
  expect(
    await service.remindBorrowers(new Date(now.getTime() - 86400000)),
  ).toEqual({ sent: 0, pending: 0 });
  const nativeAudit = audit.record.bind(audit);
  const spy = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, tx) => {
      if (entry.action === 'assetRequest.borrowReminder')
        throw new Error('Receipt audit failed');
      return nativeAudit(entry, tx);
    });
  await expect(service.remindBorrowers(now)).rejects.toThrow(
    'Receipt audit failed',
  );
  spy.mockRestore();
  expect(
    await db
      .repository('assetBorrowReminderReceipts')
      .count({ filter: { sourceId: id } }),
  ).toBe(0);
  await expect
    .poll(async () => (await inbox.list({ userId: borrower.userId })).length)
    .toBe(1);
  expect(await service.remindBorrowers(now)).toEqual({ sent: 1, pending: 0 });
  expect(
    await service.remindBorrowers(new Date(now.getTime() + 86400000)),
  ).toEqual({ sent: 0, pending: 0 });
  expect(await inbox.list({ userId: borrower.userId })).toHaveLength(1);
  const firstOverdue = new Date(now.getTime() + 4 * 86400000);
  expect(await service.remindBorrowers(firstOverdue)).toEqual({
    sent: 1,
    pending: 0,
  });
  expect(
    await service.remindBorrowers(
      new Date(firstOverdue.getTime() + 6 * 86400000),
    ),
  ).toEqual({ sent: 0, pending: 0 });
  expect(
    await service.remindBorrowers(
      new Date(firstOverdue.getTime() + 7 * 86400000),
    ),
  ).toEqual({ sent: 1, pending: 0 });
  await expect
    .poll(async () => (await inbox.list({ userId: borrower.userId })).length)
    .toBe(3);
  expect((await inbox.list({ userId: borrower.userId }))[0]!.body).toContain(
    due,
  );
  await db
    .repository('assetRequests')
    .updateMany({ filter: { id }, values: { status: 'returned' } });
  expect(
    await service.remindBorrowers(
      new Date(firstOverdue.getTime() + 14 * 86400000),
    ),
  ).toEqual({ sent: 0, pending: 0 });
  expect(await db.repository('assetBorrowReminderReceipts').count()).toBe(3);
});
