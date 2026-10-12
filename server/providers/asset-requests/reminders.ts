import { createHash } from 'node:crypto';
import type { DatabaseManager } from '@nocobase/db';
import type { CalendarService } from '../platform/index.js';
import type { ApprovalDirectoryService } from '../approval-directory/contract.js';
import type { ApprovalNotificationService } from '../approval-notifications/contract.js';
import type { AuditService } from '../audit/index.js';
import {
  ASSET_REQUEST_LIFECYCLE,
  type AssetRequestRecord,
} from './contract.js';
export function createAssetBorrowReminders(d: {
  db: DatabaseManager;
  calendar: CalendarService;
  directory: ApprovalDirectoryService;
  notifications: ApprovalNotificationService;
  audit: AuditService;
  enabled: () => boolean;
}) {
  return {
    async remindBorrowers(
      now: Date,
    ): Promise<{ sent: number; pending: number }> {
      const today = d.calendar.localDate(now),
        directory = await d.directory.snapshot();
      let sent = 0,
        pending = 0,
        lastId: string | undefined;
      for (;;) {
        const rows = await d.db
          .repository<AssetRequestRecord>('assetRequests')
          .findMany({
            filter: { operation: 'borrow', status: 'returning' },
            cursor: lastId ? { id: lastId } : undefined,
            direction: lastId ? 'forward' : undefined,
            limit: 100,
            sort: (s) => [s.field('id').asc()],
          });
        for (const record of rows) {
          const due = record.borrowDueDate;
          if (
            !due ||
            !/^\d{4}-\d{2}-\d{2}$/.test(due) ||
            !Number.isFinite(Date.parse(`${due}T00:00:00Z`)) ||
            new Date(`${due}T00:00:00Z`).toISOString().slice(0, 10) !== due
          ) {
            pending++;
            continue;
          }
          const before = d.calendar.addCalendarDays(due, -3);
          if (today < before) continue;
          const overdue = today > due;
          const week = overdue
            ? Math.floor(
                (Date.parse(`${today}T00:00:00Z`) -
                  Date.parse(`${due}T00:00:00Z`) -
                  86400000) /
                  (7 * 86400000),
              )
            : 0;
          const bucket = overdue ? `overdue:${due}:${week}` : `before:${due}`,
            id = createHash('sha256')
              .update(JSON.stringify([record.id, bucket]))
              .digest('hex');
          if (
            await d.db
              .repository('assetBorrowReminderReceipts')
              .exists({ filter: { id } })
          )
            continue;
          if (!d.enabled() || !directory.isActive(record.applicantId)) {
            pending++;
            continue;
          }
          // Notification delivery is its own public SDK transaction. Send first with a stable key,
          // then persist the receipt; an unknown commit/retry reuses that key and cannot duplicate delivery.
          await d.notifications.alarm({
            kind: ASSET_REQUEST_LIFECYCLE,
            recordId: record.id,
            recipients: [record.applicantId],
            eventId: `asset-borrow:${id}`,
            reason: overdue ? 'asset-borrow-overdue' : 'asset-borrow-due',
            detail: {
              key: overdue
                ? 'assetRequests.reminders.overdue'
                : 'assetRequests.reminders.before',
              values: {
                number: record.number ?? record.id,
                date: due,
                quantity: record.quantity,
              },
            },
          });
          try {
            await d.db.transaction(async (tx) => {
              if (
                await tx
                  .repository('assetBorrowReminderReceipts')
                  .exists({ filter: { id } })
              )
                return;
              await tx.repository('assetBorrowReminderReceipts').createOne({
                values: { id, sourceId: record.id, bucket, sentAt: now },
              });
              await d.audit.record(
                {
                  actorId: null,
                  action: 'assetRequest.borrowReminder',
                  targetType: 'assetRequests',
                  targetId: record.id,
                  after: { bucket },
                },
                tx,
              );
            });
          } catch (cause) {
            if (
              !(await d.db
                .repository('assetBorrowReminderReceipts')
                .exists({ filter: { id } }))
            )
              throw cause;
          }
          sent++;
        }
        if (rows.length < 100) break;
        lastId = rows.at(-1)!.id;
      }
      return { sent, pending };
    },
  };
}
