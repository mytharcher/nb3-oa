import { demoNow } from '../demo-data/context.js';
import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import type { CalendarService } from '../platform/calendar.js';
import type { ReimbursementRecord } from './contract.js';
import type { ReimbursementPayment } from './settlement.js';
import { ReimbursementError } from './errors.js';
import { isLocalDate } from '../platform/time-zone.js';
export interface ExpenseSummaryQuery {
  year?: number;
  month?: number;
  page: number;
  pageSize: number;
}
export interface ExpenseSummaryRow {
  id: string;
  year: number;
  month: number;
  category: string;
  settledRequestCount: number;
  settledExpenseCents: number;
}
export const reimbursementExpenseSummaryToken = createServiceToken<
  ReturnType<typeof createExpenseSummary>
>('oa.reimbursement-expense-summary');
/** Owner projection: settlement gross expense by original line date, never a cash allocation. */
export function createExpenseSummary(
  db: DatabaseManager,
  calendar: CalendarService,
) {
  return {
    async list(query: ExpenseSummaryQuery, policy: RepositoryPolicy) {
      const year =
        query.year ?? Number(calendar.localDate(demoNow()).slice(0, 4));
      if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > 9999 ||
        !Number.isInteger(query.page) ||
        query.page < 1 ||
        !Number.isInteger(query.pageSize) ||
        query.pageSize < 1 ||
        query.pageSize > 10000 ||
        (query.month !== undefined &&
          (!Number.isInteger(query.month) ||
            query.month < 1 ||
            query.month > 12))
      )
        throw new ReimbursementError(
          'INVALID_REPORT_QUERY',
          'Invalid expense summary query.',
        );
      const fields = [
        'id',
        'status',
        'lines',
        'totalCents',
        'offsetCents',
        'paymentId',
      ];
      const read = policy.read,
        readable = typeof read === 'object' ? read.fields : undefined;
      if (
        !read ||
        readable === false ||
        (Array.isArray(readable) &&
          !readable.includes('*') &&
          fields.some((f) => !readable.includes(f)))
      )
        throw new ReimbursementError(
          'REPORT_FIELDS_RESTRICTED',
          'Expense reports require all settlement source fields.',
          'permission',
        );
      return db.connection().transaction(async (tx) => {
        const sources = await tx
          .repository<ReimbursementRecord>('reimbursementRequests')
          .withPolicy(policy)
          .findMany({
            limit: 10001,
            select: (s) =>
              s.fields(
                'id',
                'status',
                'lines',
                'totalCents',
                'offsetCents',
                'paymentId',
              ),
            filter: (f) =>
              f.or([
                f.string('status').eq('paid'),
                f.string('status').eq('forcedPaid'),
              ]),
          });
        if (sources.length > 10000)
          throw new ReimbursementError(
            'REPORT_SOURCE_LIMIT',
            'At most 10,000 authorized settled requests may be summarized.',
          );
        const groups = new Map<
          string,
          ExpenseSummaryRow & { requests: Set<string> }
        >();
        for (const source of sources) {
          if (
            fields.some((f) => !(f in source)) ||
            typeof source.id !== 'string' ||
            !source.id
          )
            throw new ReimbursementError(
              'REPORT_FIELDS_RESTRICTED',
              'Expense settlement fields are restricted.',
              'permission',
            );
          const payment = await tx
            .repository<ReimbursementPayment>('reimbursementPayments')
            .findOne({ filter: { requestId: source.id } });
          const gross = Number(source.totalCents),
            offset = Number(source.offsetCents);
          if (
            !payment ||
            payment.id !== source.paymentId ||
            payment.forced !== (source.status === 'forcedPaid') ||
            Number(payment.grossCents) !== gross ||
            Number(payment.offsetCents) !== offset ||
            Number(payment.netCents) !== gross - offset ||
            !Number.isSafeInteger(gross) ||
            !Number.isSafeInteger(offset) ||
            offset < 0 ||
            offset > gross ||
            !Array.isArray(source.lines) ||
            source.lines.some(
              (line) =>
                !line ||
                !isLocalDate(line.date) ||
                !Number.isSafeInteger(line.amountCents) ||
                line.amountCents < 0 ||
                typeof line.category !== 'string' ||
                !line.category,
            ) ||
            source.lines.reduce((sum, line) => sum + line.amountCents, 0) !==
              gross
          )
            throw new ReimbursementError(
              'REPORT_SETTLEMENT_CONFLICT',
              'The settled request does not match its immutable payment evidence.',
            );
          for (const line of source.lines) {
            if (
              !isLocalDate(line.date) ||
              !Number.isSafeInteger(line.amountCents) ||
              line.amountCents < 0 ||
              typeof line.category !== 'string' ||
              !line.category
            )
              throw new ReimbursementError(
                'REPORT_SETTLEMENT_CONFLICT',
                'Expense lines must contain exact safe cents and valid dates.',
              );
            const month = Number(line.date.slice(5, 7));
            if (
              Number(line.date.slice(0, 4)) !== year ||
              (query.month && query.month !== month)
            )
              continue;
            const id = `${year}-${month}-${line.category}`;
            const row = groups.get(id) ?? {
              id,
              year,
              month,
              category: line.category,
              settledRequestCount: 0,
              settledExpenseCents: 0,
              requests: new Set<string>(),
            };
            row.requests.add(source.id);
            row.settledRequestCount = row.requests.size;
            row.settledExpenseCents += line.amountCents;
            if (!Number.isSafeInteger(row.settledExpenseCents))
              throw new ReimbursementError(
                'REPORT_AMOUNT_OVERFLOW',
                'The aggregate exceeds exact safe cents.',
              );
            groups.set(id, row);
          }
        }
        const rows = [...groups.values()]
          .sort(
            (a, b) => b.month - a.month || a.category.localeCompare(b.category),
          )
          .map(({ requests: _requests, ...row }) => row);
        return {
          data: rows.slice(
            (query.page - 1) * query.pageSize,
            query.page * query.pageSize,
          ),
          total: rows.length,
          year,
        };
      });
    },
  };
}
