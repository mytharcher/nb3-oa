/**
 * Wall-clock arithmetic in one IANA time zone, without depending on the server's own zone.
 *
 * The OA calendar runs on the company's time zone (rule `calendar.timeZone`, default `Asia/Shanghai`), never on the
 * process's `TZ`: a server deployed in UTC must still say that 09:00 in Shanghai is 01:00Z. Offsets come from
 * `Intl.DateTimeFormat`, so zones with daylight saving resolve correctly for every instant.
 */

const MINUTE = 60_000;
const DAY = 86_400_000;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterOf(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Whether the runtime knows `timeZone` as an IANA zone name. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterOf(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Minutes the zone is ahead of UTC at `instant`. */
export function offsetMinutesAt(timeZone: string, instant: number): number {
  const parts = formatterOf(timeZone).formatToParts(new Date(instant));
  const value = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );
  // Sub-second precision is not part of the formatted parts; drop it from the instant as well.
  return Math.round((asUtc - Math.floor(instant / 1000) * 1000) / MINUTE);
}

/** A local calendar date, `YYYY-MM-DD`. */
export type LocalDate = string;

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Whether `value` is a real calendar date written `YYYY-MM-DD`. */
export function isLocalDate(value: string): boolean {
  const match = LOCAL_DATE.exec(value);
  if (!match) return false;
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toLocalDateFromDayNumber(Math.floor(ms / DAY)) === value;
}

/** Days since 1970-01-01 of a local date; local dates compare and step as integers this way. */
export function dayNumberOf(date: LocalDate): number {
  const match = LOCAL_DATE.exec(date);
  if (!match) throw new RangeError(`"${date}" is not a YYYY-MM-DD date.`);
  return Math.floor(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY,
  );
}

export function toLocalDateFromDayNumber(dayNumber: number): LocalDate {
  return new Date(dayNumber * DAY).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a day number. */
export function weekdayOfDayNumber(dayNumber: number): number {
  // 1970-01-01 was a Thursday.
  return (((dayNumber + 4) % 7) + 7) % 7;
}

/** The local date `instant` falls on in `timeZone`. */
export function localDateOf(
  timeZone: string,
  instant: Date | number,
): LocalDate {
  const ms = typeof instant === 'number' ? instant : instant.getTime();
  return toLocalDateFromDayNumber(
    Math.floor((ms + offsetMinutesAt(timeZone, ms) * MINUTE) / DAY),
  );
}

/**
 * The instant at which the wall clock in `timeZone` reads `minutes` past midnight of the local date `dayNumber`.
 * A wall time skipped by a daylight-saving jump resolves to the instant just after the jump.
 */
export function instantOfLocal(
  timeZone: string,
  dayNumber: number,
  minutes: number,
): number {
  const wall = dayNumber * DAY + minutes * MINUTE;
  // Two passes: guess with the offset at the wall time read as UTC, then correct with the offset at the guess.
  const first = wall - offsetMinutesAt(timeZone, wall) * MINUTE;
  const second = wall - offsetMinutesAt(timeZone, first) * MINUTE;
  return second;
}

/** `yyyyMM` of the local date `instant` falls on, the period sequences number within. */
export function periodOf(timeZone: string, instant: Date): string {
  return localDateOf(timeZone, instant).slice(0, 7).replace('-', '');
}
