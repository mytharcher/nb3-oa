import { demoNow } from '../demo-data/context.js';
import { randomUUID } from 'node:crypto';
import type { DatabaseManager } from '@nocobase/db';
import type { CalendarService } from '../platform/calendar.js';
import type { LoanLedgerService } from '../loan-ledger/contract.js';
import type { ApprovalDirectoryService } from '../approval-directory/contract.js';
import type { ApprovalNotificationService } from '../approval-notifications/contract.js';
import type { LoanRequestRecord } from './contract.js';
interface Reminder {
  id: string;
  loanId: string;
  requestId: string;
  eventDate: string;
  kind: 'beforeDue' | 'overdue';
  state: 'pending' | 'sent' | 'skipped';
  createdAt: Date;
  sentAt: Date | null;
}
const day = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86400000;
export function createLoanReminderService(d: {
  db: DatabaseManager;
  calendar: CalendarService;
  ledger: LoanLedgerService;
  directory: ApprovalDirectoryService;
  notifications: ApprovalNotificationService;
}) {
  return {
    async run(now = demoNow()) {
      const today = d.calendar.localDate(now),
        connection = d.db.connection(),
        repo = connection.repository<Reminder>('loanReminderEvents');
      const records = await connection
        .repository<LoanRequestRecord>('loanRequests')
        .findMany({ filter: { status: 'paid' } });
      let created = 0,
        sent = 0,
        skipped = 0;
      for (const record of records) {
        const loan = (
          await d.ledger.listFor(record.applicantId, connection)
        ).find((l) => l.sourceId === record.id);
        if (!loan || loan.outstandingCents === 0) continue;
        const due =
            record.returnDueDate && record.returnDueDate < loan.dueDate
              ? record.returnDueDate
              : loan.dueDate,
          diff = day(today) - day(due),
          kind =
            diff === -3
              ? 'beforeDue'
              : diff >= 1 && (diff - 1) % 7 === 0
                ? 'overdue'
                : null;
        if (!kind) continue;
        if (
          await repo.findOne({
            filter: { loanId: loan.id, eventDate: today, kind },
          })
        )
          continue;
        try {
          await d.db.transaction((tx) =>
            tx.repository<Reminder>('loanReminderEvents').createOne({
              values: {
                id: randomUUID(),
                loanId: loan.id,
                requestId: record.id,
                eventDate: today,
                kind,
                state: 'pending',
                createdAt: now,
                sentAt: null,
              },
            }),
          );
          created++;
        } catch (error) {
          if (
            !(await repo.findOne({
              filter: { loanId: loan.id, eventDate: today, kind },
            }))
          )
            throw error;
        }
      }
      const directory = await d.directory.snapshot();
      for (const event of await repo.findMany({
        filter: { state: 'pending' },
      })) {
        const loan = await d.ledger.get(event.loanId),
          record = await connection
            .repository<LoanRequestRecord>('loanRequests')
            .findOne({ filter: { id: event.requestId } });
        const effectiveDue =
          loan && record
            ? record.returnDueDate && record.returnDueDate < loan.dueDate
              ? record.returnDueDate
              : loan.dueDate
            : null;
        const relevant =
          loan &&
          record &&
          loan.outstandingCents > 0 &&
          effectiveDue &&
          (event.kind === 'overdue'
            ? today > effectiveDue
            : today <= effectiveDue);
        if (!relevant) {
          await repo.updateOne({
            filter: { id: event.id },
            values: { state: 'skipped' },
          });
          skipped++;
          continue;
        }
        const recipients = [
          loan.applicantId,
          directory.managerOf(loan.applicantId),
        ].filter((id): id is string => Boolean(id) && directory.isActive(id!));
        if (!recipients.length) {
          await repo.updateOne({
            filter: { id: event.id },
            values: { state: 'skipped' },
          });
          skipped++;
          continue;
        }
        await d.notifications.alarm({
          kind: 'oa.loan',
          recordId: record.id,
          recipients: [...new Set(recipients)],
          eventId: `loan-due:${event.loanId}:${event.kind}:${event.eventDate}`,
          reason: event.kind,
        });
        await repo.updateOne({
          filter: { id: event.id },
          values: { state: 'sent', sentAt: now },
        });
        sent++;
      }
      return { created, sent, skipped };
    },
  };
}
