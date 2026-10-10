/**
 * The work calendar (01 §6): explicit days in `calendarDays`, the working window in rule `calendar.workHours`
 * (versioned, so a future change of hours applies to the dates it covers) and the time zone in rule
 * `calendar.timeZone`. The service holds one immutable `WorkingCalendar` in memory and answers every computation from
 * it synchronously; it rebuilds it at application start, after every committed calendar edit or calendar rule change,
 * and every few minutes so other processes' edits and scheduled rule versions are picked up.
 *
 * Time zone: computations never use the server's own zone. Instants are read and produced in the zone of
 * `calendar.timeZone` (default `Asia/Shanghai`); local dates are `YYYY-MM-DD` strings of that zone.
 */
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { AuditService } from '../audit/index.js';
import { PlatformError } from './errors.js';
import type { RuleService } from './rules.js';
import { isLocalDate, type LocalDate } from './time-zone.js';
import {
  CALENDAR_DAY_KINDS,
  DEFAULT_TIME_ZONE,
  WorkingCalendar,
  type CalendarDayKind,
  type WorkdaysBetweenOptions,
  type WorkHours,
  type WorkHoursVersion,
} from './working-calendar.js';

export {
  CALENDAR_DAY_KINDS,
  type CalendarDayKind,
  type DayHalf,
  type WorkdaysBetweenOptions,
  type WorkHours,
} from './working-calendar.js';
export type { LocalDate } from './time-zone.js';

/**
 * Structurally the approval plugin's `ApprovalCalendar` (`@nocobase/app-plugin-approval/server`): an approval's
 * `calendar(services)` returns `calendarService.approvalCalendar()`.
 */
export interface ApprovalCalendarLike {
  addWorkingHours(from: Date, hours: number): Date;
}

export interface CalendarDayRecord {
  readonly date: LocalDate;
  readonly kind: CalendarDayKind;
  readonly note: string | null;
  readonly updatedAt: Date;
}

export interface CalendarDayInput {
  readonly date: LocalDate;
  readonly kind: CalendarDayKind;
  readonly note?: string | null;
}

export interface CalendarImportResult {
  readonly created: number;
  readonly updated: number;
  readonly unchanged: number;
  readonly removed: number;
}

export interface CalendarService {
  // Synchronous, in-memory computations — safe inside any transaction.
  /** The calendar's IANA time zone. */
  timeZone(): string;
  /** The local date `instant` falls on in the calendar's time zone. */
  localDate(instant: Date): LocalDate;
  isWorkday(date: Date | LocalDate): boolean;
  dayKind(date: Date | LocalDate): { kind: CalendarDayKind; explicit: boolean };
  workHoursOn(date: Date | LocalDate): WorkHours;
  addWorkingHours(from: Date, hours: number): Date;
  workingHoursBetween(from: Date, to: Date): number;
  workdaysBetween(
    from: Date | LocalDate,
    to: Date | LocalDate,
    options?: WorkdaysBetweenOptions,
  ): number;
  addWorkdays(date: LocalDate, count: number): LocalDate;
  addCalendarDays(date: LocalDate, days: number): LocalDate;
  addCalendarDays(date: Date, days: number): Date;
  /** What an approval's `calendar(services)` returns; it always answers from the latest loaded calendar. */
  approvalCalendar(): ApprovalCalendarLike;

  // Loading and administration.
  /** Rebuilds the in-memory calendar from the database. */
  reload(): Promise<void>;
  listDays(year: number): Promise<CalendarDayRecord[]>;
  setDay(
    input: CalendarDayInput,
    actorId: string | null,
    connection?: DatabaseConnection,
  ): Promise<CalendarDayRecord>;
  /** Removes an explicit day, so the date follows the weekday rule again. */
  removeDay(
    date: LocalDate,
    actorId: string | null,
    connection?: DatabaseConnection,
  ): Promise<CalendarDayRecord>;
  /**
   * Writes a year's explicit days in one transaction. With `replace`, days of that year missing from `entries` are
   * removed, so a re-imported official schedule replaces the previous one.
   */
  importYear(
    year: number,
    entries: readonly CalendarDayInput[],
    options: { replace: boolean },
    actorId: string | null,
    connection?: DatabaseConnection,
  ): Promise<CalendarImportResult>;
}

export const calendarServiceToken: ServiceToken<CalendarService> =
  createServiceToken<CalendarService>('oa/platform/calendar-service');

interface DayRow {
  id: number | string;
  date: string;
  kind: CalendarDayKind;
  note: string | null;
  updatedAt: Date | string;
}

function toRecord(row: DayRow): CalendarDayRecord {
  return {
    date: row.date,
    kind: row.kind,
    note: row.note ?? null,
    updatedAt: new Date(row.updatedAt),
  };
}

function assertDay(input: CalendarDayInput): void {
  if (!isLocalDate(input.date))
    throw new PlatformError(
      'CALENDAR_INVALID_DATE',
      `"${input.date}" is not a YYYY-MM-DD date.`,
      { field: 'date' },
    );
  if (!CALENDAR_DAY_KINDS.includes(input.kind))
    throw new PlatformError(
      'CALENDAR_INVALID_DATE',
      `"${input.kind}" is not a calendar day kind.`,
      { field: 'kind' },
    );
}

export interface CalendarServiceOptions {
  readonly onReloadError?: (error: unknown) => void;
}

export function createCalendarService(
  database: DatabaseManager,
  rules: RuleService,
  audit: AuditService,
  options: CalendarServiceOptions = {},
): CalendarService {
  let calendar = new WorkingCalendar({ timeZone: DEFAULT_TIME_ZONE, days: [] });

  async function build(): Promise<WorkingCalendar> {
    const rows = (await database.repository('calendarDays').findMany({
      sort: (sort) => sort.field('date').asc(),
    })) as unknown as DayRow[];
    const versions = await rules.versions([
      'calendar.workHours',
      'calendar.timeZone',
    ]);
    const workHours: WorkHoursVersion[] = versions
      .filter((version) => version.key === 'calendar.workHours')
      .map((version) => ({
        effectiveFrom: version.effectiveFrom,
        value: version.value as WorkHours,
      }));
    const now = Date.now();
    const zone = versions
      .filter(
        (version) =>
          version.key === 'calendar.timeZone' &&
          version.effectiveFrom.getTime() <= now,
      )
      .at(-1);
    return new WorkingCalendar({
      timeZone:
        typeof zone?.value === 'string' ? zone.value : DEFAULT_TIME_ZONE,
      days: rows.map((row) => [row.date, row.kind] as const),
      workHours,
    });
  }

  async function reload(): Promise<void> {
    calendar = await build();
  }

  function reloadAfterCommit(connection: DatabaseConnection): void {
    connection.afterCommit(async () => {
      try {
        await reload();
      } catch (error) {
        options.onReloadError?.(error);
      }
    });
  }

  rules.onChange((key) => {
    if (!key.startsWith('calendar.')) return;
    reload().catch((error: unknown) => options.onReloadError?.(error));
  });

  async function inTransaction<T>(
    connection: DatabaseConnection | undefined,
    work: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return connection ? work(connection) : database.transaction(work);
  }

  async function findDay(
    connection: DatabaseConnection,
    date: LocalDate,
  ): Promise<DayRow | undefined> {
    return (await connection
      .repository('calendarDays')
      .findOne({ filter: { date } })) as unknown as DayRow | undefined;
  }

  /** Writes one day; answers what changed, for the import's counts. */
  async function writeDay(
    connection: DatabaseConnection,
    input: CalendarDayInput,
    now: Date,
  ): Promise<{
    change: 'created' | 'updated' | 'unchanged';
    before: CalendarDayRecord | null;
    after: CalendarDayRecord;
  }> {
    const repository = connection.repository('calendarDays');
    const existing = await findDay(connection, input.date);
    const note = input.note?.trim() ? input.note.trim() : null;
    if (!existing) {
      const result = await repository.createOne({
        values: { date: input.date, kind: input.kind, note, updatedAt: now },
      });
      return {
        change: 'created',
        before: null,
        after: toRecord(result.record as unknown as DayRow),
      };
    }
    const before = toRecord(existing);
    if (existing.kind === input.kind && (existing.note ?? null) === note)
      return { change: 'unchanged', before, after: before };
    const result = await repository.updateOne({
      filter: { date: input.date },
      values: { kind: input.kind, note, updatedAt: now },
    });
    return {
      change: 'updated',
      before,
      after: toRecord(result.record as unknown as DayRow),
    };
  }

  const service: CalendarService = {
    timeZone: () => calendar.timeZone,
    localDate: (instant) => calendar.localDate(instant),
    isWorkday: (date) => calendar.isWorkday(date),
    dayKind: (date) => calendar.dayKind(date),
    workHoursOn: (date) => calendar.workHoursOn(date),
    addWorkingHours: (from, hours) => calendar.addWorkingHours(from, hours),
    workingHoursBetween: (from, to) => calendar.workingHoursBetween(from, to),
    workdaysBetween: (from, to, workdayOptions) =>
      calendar.workdaysBetween(from, to, workdayOptions),
    addWorkdays: (date, count) => calendar.addWorkdays(date, count),
    addCalendarDays: ((date: LocalDate | Date, days: number) =>
      typeof date === 'string'
        ? calendar.addCalendarDays(date, days)
        : calendar.addCalendarDays(
            date,
            days,
          )) as CalendarService['addCalendarDays'],
    approvalCalendar: () => ({
      addWorkingHours: (from: Date, hours: number) =>
        calendar.addWorkingHours(from, hours),
    }),

    reload,

    async listDays(year) {
      const rows = (await database.repository('calendarDays').findMany({
        filter: (f) => f.string('date').startsWith(`${year}-`),
        sort: (sort) => sort.field('date').asc(),
      })) as unknown as DayRow[];
      return rows.map(toRecord);
    },

    async setDay(input, actorId, connection) {
      assertDay(input);
      return inTransaction(connection, async (transaction) => {
        const { change, before, after } = await writeDay(
          transaction,
          input,
          new Date(),
        );
        if (change !== 'unchanged') {
          await audit.record(
            {
              actorId,
              action: 'calendarDay.set',
              targetType: 'calendarDays',
              targetId: input.date,
              before: before ? { kind: before.kind, note: before.note } : null,
              after: { kind: after.kind, note: after.note },
            },
            transaction,
          );
          reloadAfterCommit(transaction);
        }
        return after;
      });
    },

    async removeDay(date, actorId, connection) {
      if (!isLocalDate(date))
        throw new PlatformError(
          'CALENDAR_INVALID_DATE',
          `"${date}" is not a YYYY-MM-DD date.`,
          {
            field: 'date',
          },
        );
      return inTransaction(connection, async (transaction) => {
        const existing = await findDay(transaction, date);
        if (!existing)
          throw new PlatformError(
            'CALENDAR_DAY_NOT_FOUND',
            `${date} has no explicit calendar entry.`,
          );
        await transaction
          .repository('calendarDays')
          .deleteOne({ filter: { date } });
        const before = toRecord(existing);
        await audit.record(
          {
            actorId,
            action: 'calendarDay.remove',
            targetType: 'calendarDays',
            targetId: date,
            before: { kind: before.kind, note: before.note },
            after: null,
          },
          transaction,
        );
        reloadAfterCommit(transaction);
        return before;
      });
    },

    async importYear(year, entries, importOptions, actorId, connection) {
      const seen = new Set<string>();
      for (const [index, entry] of entries.entries()) {
        assertDay(entry);
        if (!entry.date.startsWith(`${year}-`))
          throw new PlatformError(
            'CALENDAR_DATE_OUTSIDE_YEAR',
            `${entry.date} is not in ${year}.`,
            { field: `entries[${index}].date` },
          );
        if (seen.has(entry.date))
          throw new PlatformError(
            'CALENDAR_DUPLICATE_DATE',
            `${entry.date} appears more than once.`,
            { field: `entries[${index}].date` },
          );
        seen.add(entry.date);
      }
      return inTransaction(connection, async (transaction) => {
        const now = new Date();
        const counts = { created: 0, updated: 0, unchanged: 0, removed: 0 };
        const changes: { date: string; before: unknown; after: unknown }[] = [];
        for (const entry of entries) {
          const { change, before, after } = await writeDay(
            transaction,
            entry,
            now,
          );
          counts[change] += 1;
          if (change !== 'unchanged')
            changes.push({
              date: entry.date,
              before: before ? { kind: before.kind, note: before.note } : null,
              after: { kind: after.kind, note: after.note },
            });
        }
        if (importOptions.replace) {
          const existing = (await transaction
            .repository('calendarDays')
            .findMany({
              filter: (f) => f.string('date').startsWith(`${year}-`),
            })) as unknown as DayRow[];
          for (const row of existing) {
            if (seen.has(row.date)) continue;
            await transaction
              .repository('calendarDays')
              .deleteOne({ filter: { date: row.date } });
            counts.removed += 1;
            changes.push({
              date: row.date,
              before: { kind: row.kind, note: row.note ?? null },
              after: null,
            });
          }
        }
        if (changes.length > 0) {
          await audit.record(
            {
              actorId,
              action: 'calendarDay.import',
              targetType: 'calendarDays',
              targetId: String(year),
              before: changes.map(({ date, before }) => ({
                date,
                value: before,
              })),
              after: changes.map(({ date, after }) => ({ date, value: after })),
              reason: importOptions.replace ? 'replace' : null,
            },
            transaction,
          );
          reloadAfterCommit(transaction);
        }
        return counts;
      });
    },
  };

  return service;
}
