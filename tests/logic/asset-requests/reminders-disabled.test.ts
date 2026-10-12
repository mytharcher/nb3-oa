// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createAssetRequestsAppTest } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { assetRequestServiceToken } from '../../../server/providers/asset-requests/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
const test = createAssetRequestsAppTest({ inbox: null });
test('disabled actual borrower inbox keeps all 101 due records pending across pagination', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    calendar = c.resolve(calendarServiceToken),
    service = c.resolve(assetRequestServiceToken);
  const borrower = await createEmployee(testApp, 'Disabled reminder borrower'),
    now = new Date('2026-10-11T16:30:00Z'),
    due = calendar.addCalendarDays(calendar.localDate(now), 3);
  for (let index = 0; index < 101; index++)
    await db.repository('assetRequests').createOne({
      values: {
        id: randomUUID(),
        applicantId: borrower.userId,
        createdById: borrower.userId,
        employeeId: borrower.employeeId,
        operation: 'borrow',
        category: null,
        assetIds: [],
        quantity: 1,
        purpose: 'Reminder fixture',
        borrowDueDate: due,
        scrapReason: '',
        photos: [],
        status: 'returning',
        lifecycleVersion: 1,
        statusChangedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  expect(await service.remindBorrowers(now)).toEqual({
    sent: 0,
    pending: 101,
  });
  expect(await db.repository('assetBorrowReminderReceipts').count()).toBe(0);
});
