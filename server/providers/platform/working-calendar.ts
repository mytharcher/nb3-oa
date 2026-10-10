/**
 * The company's working time as plain data and arithmetic: which local dates are worked, during which hours, in
 * which time zone. Every method is synchronous and reaches nothing outside the instance, because the approval plugin
 * calls `addWorkingHours` inside the transaction that opens or claims a task. `CalendarService` builds a new instance
 * from the database at start and after every change, and swaps it in whole.
 */
import {
  dayNumberOf,
  instantOfLocal,
  isLocalDate,
  localDateOf,
  toLocalDateFromDayNumber,
  weekdayOfDayNumber,
  type LocalDate,
} from './time-zone.js';

const MINUTE = 60_000;
const HOUR = 3_600_000;

/**
 * - `workday`: worked, recorded explicitly (a weekday the table names, or a weekend made working without being a
 *   make-up day).
 * - `weekend`: not worked, recorded explicitly.
 * - `holiday`: a public holiday, not worked.
 * - `adjustedWorkday`: a make-up working day (调休上班), usually a weekend.
 */
export const CALENDAR_DAY_KINDS = [
  'workday',
  'weekend',
  'holiday',
  'adjustedWorkday',
] as const;
export type CalendarDayKind = (typeof CALENDAR_DAY_KINDS)[number];

export function isWorkingKind(kind: CalendarDayKind): boolean {
  return kind === 'workday' || kind === 'adjustedWorkday';
}

/** One daily working window, local wall-clock `HH:mm`. */
export interface WorkHours {
  readonly start: string;
  readonly end: string;
}

export const DEFAULT_WORK_HOURS: WorkHours = { start: '09:00', end: '18:00' };
export const DEFAULT_TIME_ZONE = 'Asia/Shanghai';

/** A working window that applies to local dates starting at or after `effectiveFrom`. */
export interface WorkHoursVersion {
  readonly effectiveFrom: Date;
  readonly value: WorkHours;
}

export interface WorkingCalendarData {
  readonly timeZone: string;
  /** Explicit days; a date missing here follows the weekday rule (Monday–Friday worked). */
  readonly days: Iterable<readonly [LocalDate, CalendarDayKind]>;
  /** Versions of the working window; empty means `DEFAULT_WORK_HOURS` throughout. */
  readonly workHours?: readonly WorkHoursVersion[];
}

/** Which half of a day a leave starts or ends on. */
export type DayHalf = 'am' | 'pm';

export interface WorkdaysBetweenOptions {
  /** `pm`: the first day counts from noon, so only half of it. Defaults to `am` (the whole first day). */
  readonly startHalf?: DayHalf;
  /** `am`: the last day counts until noon, so only half of it. Defaults to `pm` (the whole last day). */
  readonly endHalf?: DayHalf;
}

/** How long a run of non-working days may be before the table is considered broken. */
const MAX_NON_WORKING_RUN = 366;

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$|^24:00$/;

export function minutesOf(time: string): number {
  if (!TIME.test(time)) throw new RangeError(`"${time}" is not an HH:mm time.`);
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Whether `value` is a usable working window: two `HH:mm` times, start before end. */
export function isValidWorkHours(value: WorkHours): boolean {
  return (
    TIME.test(value.start) &&
    TIME.test(value.end) &&
    minutesOf(value.start) < minutesOf(value.end)
  );
}

interface Window {
  readonly start: number;
  readonly end: number;
}

export class WorkingCalendar {
  public readonly timeZone: string;
  private readonly days: ReadonlyMap<number, CalendarDayKind>;
  private readonly versions: readonly {
    readonly from: number;
    readonly start: number;
    readonly end: number;
  }[];

  public constructor(data: WorkingCalendarData) {
    this.timeZone = data.timeZone;
    const days = new Map<number, CalendarDayKind>();
    for (const [date, kind] of data.days) days.set(dayNumberOf(date), kind);
    this.days = days;
    const versions = [...(data.workHours ?? [])]
      .filter((version) => isValidWorkHours(version.value))
      .sort((a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime())
      .map((version) => ({
        from: version.effectiveFrom.getTime(),
        start: minutesOf(version.value.start),
        end: minutesOf(version.value.end),
      }));
    this.versions = versions.length
      ? versions
      : [
          {
            from: Number.NEGATIVE_INFINITY,
            start: minutesOf(DEFAULT_WORK_HOURS.start),
            end: minutesOf(DEFAULT_WORK_HOURS.end),
          },
        ];
  }

  /** The local date `instant` falls on in the calendar's time zone. */
  public localDate(instant: Date): LocalDate {
    return localDateOf(this.timeZone, instant);
  }

  /** The recorded kind of a date, or the weekday rule's answer with `explicit: false`. */
  public dayKind(date: Date | LocalDate): {
    kind: CalendarDayKind;
    explicit: boolean;
  } {
    const dayNumber = this.dayNumber(date);
    const recorded = this.days.get(dayNumber);
    if (recorded) return { kind: recorded, explicit: true };
    const weekday = weekdayOfDayNumber(dayNumber);
    return {
      kind: weekday === 0 || weekday === 6 ? 'weekend' : 'workday',
      explicit: false,
    };
  }

  /** Whether people work on the date (a `Date` is read as the local date it falls on). */
  public isWorkday(date: Date | LocalDate): boolean {
    return isWorkingKind(this.dayKind(date).kind);
  }

  /** The working window of a date, whether or not the date is worked. */
  public workHoursOn(date: Date | LocalDate): WorkHours {
    const window = this.versionFor(this.dayNumber(date));
    const format = (minutes: number): string =>
      `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    return { start: format(window.start), end: format(window.end) };
  }

  /**
   * The instant `hours` of working time after `from`. A clock started outside working time starts at the next
   * working moment, so zero hours answers that moment. This is the `ApprovalCalendar` contract.
   */
  public addWorkingHours(from: Date, hours: number): Date {
    if (!Number.isFinite(hours) || hours < 0)
      throw new RangeError(`Cannot count ${hours} working hours.`);
    let left = Math.round(hours * HOUR);
    const at = from.getTime();
    let dayNumber = dayNumberOf(this.localDate(from));
    for (let idle = 0; idle <= MAX_NON_WORKING_RUN; dayNumber += 1) {
      const window = this.windowOn(dayNumber);
      if (!window || at >= window.end) {
        idle += 1;
        continue;
      }
      idle = 0;
      const begin = Math.max(at, window.start);
      if (left <= window.end - begin) return new Date(begin + left);
      left -= window.end - begin;
    }
    throw new Error(
      'The working calendar has no working day within a year; check the calendar table.',
    );
  }

  /** Working hours between two instants; negative when `to` is before `from`. */
  public workingHoursBetween(from: Date, to: Date): number {
    if (to.getTime() < from.getTime())
      return -this.workingHoursBetween(to, from);
    const start = from.getTime();
    const end = to.getTime();
    let total = 0;
    const last = dayNumberOf(this.localDate(to));
    for (
      let dayNumber = dayNumberOf(this.localDate(from));
      dayNumber <= last;
      dayNumber += 1
    ) {
      const window = this.windowOn(dayNumber);
      if (!window) continue;
      const overlap = Math.min(end, window.end) - Math.max(start, window.start);
      if (overlap > 0) total += overlap;
    }
    return total / HOUR;
  }

  /**
   * Working days from `from` to `to`, both included, the way a leave is counted: non-working days are skipped, and
   * `startHalf: 'pm'` / `endHalf: 'am'` count the first or last day as half a day when that day is worked. Zero when
   * `to` is before `from`.
   */
  public workdaysBetween(
    from: LocalDate | Date,
    to: LocalDate | Date,
    options: WorkdaysBetweenOptions = {},
  ): number {
    const first = this.dayNumber(from);
    const last = this.dayNumber(to);
    if (last < first) return 0;
    const { startHalf = 'am', endHalf = 'pm' } = options;
    if (first === last && startHalf === 'pm' && endHalf === 'am')
      throw new RangeError(
        'A leave cannot end in the morning of the afternoon it starts.',
      );
    let total = 0;
    for (let dayNumber = first; dayNumber <= last; dayNumber += 1) {
      if (!this.isWorkday(toLocalDateFromDayNumber(dayNumber))) continue;
      let share = 1;
      if (dayNumber === first && startHalf === 'pm') share -= 0.5;
      if (dayNumber === last && endHalf === 'am') share -= 0.5;
      total += share;
    }
    return total;
  }

  /** The `count`-th working day after `date` (before it when negative); `date` itself when zero. */
  public addWorkdays(date: LocalDate, count: number): LocalDate {
    if (!Number.isInteger(count))
      throw new RangeError(`Cannot step ${count} working days.`);
    let dayNumber = dayNumberOf(date);
    const step = count < 0 ? -1 : 1;
    for (let left = Math.abs(count), idle = 0; left > 0;) {
      dayNumber += step;
      if (this.isWorkday(toLocalDateFromDayNumber(dayNumber))) {
        left -= 1;
        idle = 0;
      } else if (++idle > MAX_NON_WORKING_RUN) {
        throw new Error(
          'The working calendar has no working day within a year; check the calendar table.',
        );
      }
    }
    return toLocalDateFromDayNumber(dayNumber);
  }

  /**
   * Natural days, for deadlines counted on the calendar rather than working time (loan due dates, seal returns). A
   * local date steps to a local date; an instant steps to the same wall-clock time `days` later in the calendar's
   * time zone, which differs from `days * 24h` across a daylight-saving change.
   */
  public addCalendarDays(date: LocalDate, days: number): LocalDate;
  public addCalendarDays(date: Date, days: number): Date;
  public addCalendarDays(
    date: LocalDate | Date,
    days: number,
  ): LocalDate | Date {
    if (!Number.isInteger(days))
      throw new RangeError(`Cannot step ${days} calendar days.`);
    if (typeof date === 'string')
      return toLocalDateFromDayNumber(dayNumberOf(date) + days);
    const dayNumber = dayNumberOf(this.localDate(date));
    const midnight = instantOfLocal(this.timeZone, dayNumber, 0);
    const minutes = (date.getTime() - midnight) / MINUTE;
    return new Date(instantOfLocal(this.timeZone, dayNumber + days, minutes));
  }

  private dayNumber(date: Date | LocalDate): number {
    if (typeof date !== 'string') return dayNumberOf(this.localDate(date));
    if (!isLocalDate(date))
      throw new RangeError(`"${date}" is not a YYYY-MM-DD date.`);
    return dayNumberOf(date);
  }

  private versionFor(dayNumber: number): { start: number; end: number } {
    const midnight = instantOfLocal(this.timeZone, dayNumber, 0);
    let chosen = this.versions[0];
    for (const version of this.versions) {
      if (version.from <= midnight) chosen = version;
      else break;
    }
    return chosen;
  }

  /** The working window of a local date as instants, or `undefined` when the date is not worked. */
  private windowOn(dayNumber: number): Window | undefined {
    if (!this.isWorkday(toLocalDateFromDayNumber(dayNumber))) return undefined;
    const { start, end } = this.versionFor(dayNumber);
    return {
      start: instantOfLocal(this.timeZone, dayNumber, start),
      end: instantOfLocal(this.timeZone, dayNumber, end),
    };
  }
}
