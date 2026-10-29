import { createHash } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import {
  isValidTimeZone,
  dayNumberOf,
  instantOfLocal,
  localDateOf,
  toLocalDateFromDayNumber,
} from './time-zone.js';
import {
  isValidWorkHours,
  minutesOf,
  type CalendarDayKind,
  type WorkHours,
} from './working-calendar.js';

export interface CalendarSnapshot {
  schemaVersion: 1;
  version: string;
  timeZone: string;
  capturedAt: string;
  weekdays: number[];
  windows: WorkHours[];
  days: [string, CalendarDayKind][];
}

/** Reads through the caller's consistent transaction, never the latest in-memory calendar. */
export async function captureCalendarSnapshot(
  connection: DatabaseConnection,
  at: Date,
  timeZone: string,
  windows: WorkHours[],
): Promise<CalendarSnapshot> {
  const days = await connection
    .repository<{ date: string; kind: CalendarDayKind }>('calendarDays')
    .findMany({ sort: (s) => s.field('date').asc() });
  const snapshot: CalendarSnapshot = {
    schemaVersion: 1,
    version: '',
    timeZone,
    capturedAt: at.toISOString(),
    weekdays: [1, 2, 3, 4, 5],
    windows: structuredClone(windows),
    days: days.map((d) => [d.date, d.kind]),
  };
  snapshot.version = createHash('sha256')
    .update(
      JSON.stringify({
        timeZone: snapshot.timeZone,
        weekdays: snapshot.weekdays,
        windows: snapshot.windows.map((w) => [w.start, w.end]),
        days: snapshot.days,
      }),
    )
    .digest('hex');
  new FrozenCalendar(snapshot);
  return snapshot;
}

/** A private copy prevents configuration edits or a caller mutating JSON from moving a deadline. */
export class FrozenCalendar {
  private readonly days: ReadonlyMap<string, CalendarDayKind>;
  private readonly snapshot: CalendarSnapshot;
  constructor(snapshot: CalendarSnapshot) {
    if (
      !isValidTimeZone(snapshot.timeZone) ||
      !snapshot.weekdays.length ||
      snapshot.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
      snapshot.schemaVersion !== 1 ||
      !snapshot.windows.length ||
      snapshot.windows.some(
        (w, i) =>
          !isValidWorkHours(w) ||
          (i > 0 &&
            minutesOf(w.start) < minutesOf(snapshot.windows[i - 1].end)),
      )
    )
      throw new RangeError('Invalid calendar windows');
    this.snapshot = structuredClone(snapshot);
    this.days = new Map(this.snapshot.days);
  }
  private windows(day: number) {
    const date = toLocalDateFromDayNumber(day);
    const explicit = this.days.get(date);
    const worked = explicit
      ? ['workday', 'adjustedWorkday'].includes(explicit)
      : this.snapshot.weekdays.includes(new Date(day * 86400000).getUTCDay());
    return worked
      ? this.snapshot.windows.map((w) => ({
          start: instantOfLocal(
            this.snapshot.timeZone,
            day,
            minutesOf(w.start),
          ),
          end: instantOfLocal(this.snapshot.timeZone, day, minutesOf(w.end)),
        }))
      : [];
  }
  addWorkingHours(from: Date, hours: number): Date {
    if (!Number.isFinite(hours) || hours < 0 || !Number.isFinite(+from))
      throw new RangeError('Invalid working duration');
    let left = Math.round(hours * 3600000);
    const first = dayNumberOf(localDateOf(this.snapshot.timeZone, from));
    for (let day = first, idle = 0; idle <= 366; day++) {
      const windows = this.windows(day).filter((w) => w.end > +from);
      if (!windows.length) {
        idle++;
        continue;
      }
      idle = 0;
      for (const w of windows) {
        const start = Math.max(+from, w.start);
        if (left <= w.end - start) return new Date(start + left);
        left -= w.end - start;
      }
    }
    throw new RangeError('Calendar has no working day within a year');
  }
  workingHoursBetween(from: Date, to: Date): number {
    if (to < from) return -this.workingHoursBetween(to, from);
    let total = 0;
    const last = dayNumberOf(localDateOf(this.snapshot.timeZone, to));
    for (
      let day = dayNumberOf(localDateOf(this.snapshot.timeZone, from));
      day <= last;
      day++
    )
      for (const w of this.windows(day))
        total += Math.max(0, Math.min(+to, w.end) - Math.max(+from, w.start));
    return total / 3600000;
  }
}
