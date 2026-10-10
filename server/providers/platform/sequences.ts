/**
 * Document numbers (01 §8): `PREFIX-yyyyMM-0001`, numbered per prefix and month of the calendar's time zone.
 *
 * `next(prefix, connection)` must run inside the transaction that stores the number, typically a request's submit
 * transaction. It increments the counter with one conditional update (`next = next + 1 where prefix = ? and
 * period = ?`), which takes the row's write lock until that transaction ends, and reads the incremented row back
 * through the same update. Concurrent submissions of one prefix therefore queue on that row and never share a
 * number; no `select … for update` is used, so it works the same on SQLite.
 *
 * The first number of a period inserts the row instead. Two transactions may both find no row: the insert runs in a
 * savepoint, and the one that loses the unique constraint `(prefix, period)` rolls back only that savepoint and
 * retries the update, which then waits for and continues after the winner's row.
 *
 * Rollback: the increment is part of the caller's transaction, so a transaction that rolls back returns its number.
 * Numbers are gap-free among committed documents, and a number is never reused once its transaction commits.
 */
import type { DatabaseConnection } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { CalendarService } from './calendar.js';
import { PlatformError } from './errors.js';
import { periodOf } from './time-zone.js';

export interface SequenceCounter {
  readonly prefix: string;
  readonly period: string;
  /** The number the next document of the period receives. */
  readonly next: number;
}

export interface SequenceService {
  /**
   * The next document number of `prefix` for the month `at` falls in (now by default), such as `LV-202610-0001`.
   * Call it with the transaction connection that stores the number.
   */
  next(
    prefix: string,
    connection: DatabaseConnection,
    at?: Date,
  ): Promise<string>;
  /** Every counter, newest period first, optionally of one prefix. */
  list(
    options: { prefix?: string; page: number; pageSize: number },
    connection: DatabaseConnection,
  ): Promise<{ items: SequenceCounter[]; total: number }>;
}

export const sequenceServiceToken: ServiceToken<SequenceService> =
  createServiceToken<SequenceService>('oa/platform/sequence-service');

/** Prefixes are short upper-case codes such as `LV` or `SEAL`. */
export const SEQUENCE_PREFIX = /^[A-Z][A-Z0-9]{0,15}$/;

export function formatSequenceNumber(
  prefix: string,
  period: string,
  number: number,
): string {
  return `${prefix}-${period}-${String(number).padStart(4, '0')}`;
}

interface CounterRow {
  prefix: string;
  period: string;
  next: number | string;
}

async function increment(
  connection: DatabaseConnection,
  prefix: string,
  period: string,
): Promise<number | undefined> {
  const result = await connection.repository('sequences').updateMany({
    filter: { prefix, period },
    values: { next: { increment: 1 } },
    select: (select) => select.fields('next'),
  });
  const row = result.records[0] as unknown as CounterRow | undefined;
  return row ? Number(row.next) - 1 : undefined;
}

export function createSequenceService(
  calendar: Pick<CalendarService, 'timeZone'>,
): SequenceService {
  return {
    async next(prefix, connection, at = new Date()) {
      if (!SEQUENCE_PREFIX.test(prefix))
        throw new PlatformError(
          'SEQUENCE_INVALID_PREFIX',
          `"${prefix}" is not a sequence prefix (upper-case letters and digits).`,
          { field: 'prefix' },
        );
      const period = periodOf(calendar.timeZone(), at);
      const issued = await increment(connection, prefix, period);
      if (issued !== undefined)
        return formatSequenceNumber(prefix, period, issued);

      try {
        await connection.transaction(async (savepoint) => {
          await savepoint.repository('sequences').createOne({
            values: { prefix, period, next: 2 },
          });
        });
        return formatSequenceNumber(prefix, period, 1);
      } catch (error) {
        // Another transaction created the period's row first; continue after it.
        const retried = await increment(connection, prefix, period);
        if (retried === undefined) throw error;
        return formatSequenceNumber(prefix, period, retried);
      }
    },

    async list({ prefix, page, pageSize }, connection) {
      const repository = connection.repository('sequences');
      const filter = prefix ? { filter: { prefix } } : {};
      const [rows, total] = await Promise.all([
        repository.findMany({
          ...filter,
          sort: (sort) => [
            sort.field('period').desc(),
            sort.field('prefix').asc(),
          ],
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        repository.count(filter),
      ]);
      return {
        items: (rows as unknown as CounterRow[]).map((row) => ({
          prefix: row.prefix,
          period: row.period,
          next: Number(row.next),
        })),
        total,
      };
    },
  };
}
