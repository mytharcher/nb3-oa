// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  instantOfLocal,
  localDateOf,
  periodOf,
} from '../../../server/providers/platform/time-zone.ts';
import { WorkingCalendar } from '../../../server/providers/platform/working-calendar.ts';

// 2026-10-01..07 is the National Day holiday; 2026-10-10 (Saturday) is a make-up working day in this fixture.
const calendar = new WorkingCalendar({
  timeZone: 'Asia/Shanghai',
  days: [
    ['2026-10-01', 'holiday'],
    ['2026-10-02', 'holiday'],
    ['2026-10-05', 'holiday'],
    ['2026-10-06', 'holiday'],
    ['2026-10-07', 'holiday'],
    ['2026-10-10', 'adjustedWorkday'],
  ],
});

/** A Shanghai wall-clock time as an instant. */
const sh = (local: string): Date => new Date(`${local}+08:00`);

describe('time zone helpers', () => {
  it('reads instants in the calendar zone, not the server zone', () => {
    expect(localDateOf('Asia/Shanghai', new Date('2026-10-08T17:00:00Z'))).toBe(
      '2026-10-09',
    );
    expect(localDateOf('UTC', new Date('2026-10-08T17:00:00Z'))).toBe(
      '2026-10-08',
    );
    expect(periodOf('Asia/Shanghai', new Date('2026-10-31T17:00:00Z'))).toBe(
      '202611',
    );
  });

  it('converts wall times across a daylight-saving change', () => {
    // New York moved from EDT (−4) to EST (−5) on 2026-11-01.
    const day = Math.floor(Date.UTC(2026, 10, 2) / 86_400_000);
    expect(
      new Date(instantOfLocal('America/New_York', day, 9 * 60)).toISOString(),
    ).toBe('2026-11-02T14:00:00.000Z');
  });
});

describe('WorkingCalendar', () => {
  it('follows the weekday rule for dates not in the table', () => {
    expect(calendar.isWorkday('2026-10-12')).toBe(true); // Monday
    expect(calendar.isWorkday('2026-10-11')).toBe(false); // Sunday
    expect(calendar.dayKind('2026-10-11')).toEqual({
      kind: 'weekend',
      explicit: false,
    });
  });

  it('applies holidays and make-up working days', () => {
    expect(calendar.isWorkday('2026-10-01')).toBe(false);
    expect(calendar.isWorkday('2026-10-10')).toBe(true);
    expect(calendar.dayKind('2026-10-10')).toEqual({
      kind: 'adjustedWorkday',
      explicit: true,
    });
    // An instant is read as the Shanghai date it falls on: 2026-09-30T16:30Z is 1 October 00:30 there.
    expect(calendar.isWorkday(new Date('2026-09-30T16:30:00Z'))).toBe(false);
  });

  it('adds working hours within a day', () => {
    expect(calendar.addWorkingHours(sh('2026-10-12T10:00:00'), 3)).toEqual(
      sh('2026-10-12T13:00:00'),
    );
  });

  it('carries working hours across the evening and a weekend', () => {
    // Friday 17:00 + 2h → Monday 10:00 (Saturday 17th and Sunday 18th are not worked).
    expect(calendar.addWorkingHours(sh('2026-10-16T17:00:00'), 2)).toEqual(
      sh('2026-10-19T10:00:00'),
    );
  });

  it('skips holidays and counts a make-up Saturday', () => {
    // 30 September 17:00 + 2h: holidays 1–7 October except the weekend 3–4 (not worked either), resumes 8 October.
    expect(calendar.addWorkingHours(sh('2026-09-30T17:00:00'), 2)).toEqual(
      sh('2026-10-08T10:00:00'),
    );
    // Friday 9 October 17:30 + 1h → Saturday 10 October (make-up day) 09:30.
    expect(calendar.addWorkingHours(sh('2026-10-09T17:30:00'), 1)).toEqual(
      sh('2026-10-10T09:30:00'),
    );
  });

  it('starts a clock begun outside working hours at the next working moment', () => {
    expect(calendar.addWorkingHours(sh('2026-10-12T07:00:00'), 1)).toEqual(
      sh('2026-10-12T10:00:00'),
    );
    expect(calendar.addWorkingHours(sh('2026-10-12T20:00:00'), 1)).toEqual(
      sh('2026-10-13T10:00:00'),
    );
    expect(calendar.addWorkingHours(sh('2026-10-11T12:00:00'), 0)).toEqual(
      sh('2026-10-12T09:00:00'),
    );
    // 24 working hours from Monday 09:00 are 2⅔ nine-hour days: Wednesday 15:00.
    expect(calendar.addWorkingHours(sh('2026-10-12T09:00:00'), 24)).toEqual(
      sh('2026-10-14T15:00:00'),
    );
  });

  it('rejects negative hours', () => {
    expect(() =>
      calendar.addWorkingHours(sh('2026-10-12T09:00:00'), -1),
    ).toThrow(RangeError);
  });

  it('measures working hours between instants', () => {
    expect(
      calendar.workingHoursBetween(
        sh('2026-10-16T17:00:00'),
        sh('2026-10-19T10:00:00'),
      ),
    ).toBe(2);
    expect(
      calendar.workingHoursBetween(
        sh('2026-10-12T20:00:00'),
        sh('2026-10-13T08:00:00'),
      ),
    ).toBe(0);
    expect(
      calendar.workingHoursBetween(
        sh('2026-10-19T10:00:00'),
        sh('2026-10-16T17:00:00'),
      ),
    ).toBe(-2);
  });

  it('counts leave days, with half days', () => {
    // 28 September – 9 October: 28, 29, 30, 8, 9 are worked.
    expect(calendar.workdaysBetween('2026-09-28', '2026-10-09')).toBe(5);
    expect(
      calendar.workdaysBetween('2026-10-12', '2026-10-13', {
        startHalf: 'pm',
        endHalf: 'am',
      }),
    ).toBe(1);
    expect(
      calendar.workdaysBetween('2026-10-12', '2026-10-12', { endHalf: 'am' }),
    ).toBe(0.5);
    // A half day on a non-working first day counts nothing.
    expect(
      calendar.workdaysBetween('2026-10-11', '2026-10-12', { startHalf: 'pm' }),
    ).toBe(1);
    expect(calendar.workdaysBetween('2026-10-13', '2026-10-12')).toBe(0);
  });

  it('steps working days and calendar days', () => {
    expect(calendar.addWorkdays('2026-09-30', 1)).toBe('2026-10-08');
    expect(calendar.addWorkdays('2026-10-12', -1)).toBe('2026-10-10');
    expect(calendar.addCalendarDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(calendar.addCalendarDays(sh('2026-10-30T15:00:00'), 3)).toEqual(
      sh('2026-11-02T15:00:00'),
    );
  });

  it('applies a version of the working hours from the dates it covers', () => {
    const versioned = new WorkingCalendar({
      timeZone: 'Asia/Shanghai',
      days: [],
      workHours: [
        { effectiveFrom: new Date(0), value: { start: '09:00', end: '18:00' } },
        {
          effectiveFrom: sh('2026-10-14T00:00:00'),
          value: { start: '08:30', end: '17:30' },
        },
      ],
    });
    expect(versioned.workHoursOn('2026-10-13')).toEqual({
      start: '09:00',
      end: '18:00',
    });
    expect(versioned.workHoursOn('2026-10-14')).toEqual({
      start: '08:30',
      end: '17:30',
    });
    // Tuesday 17:00 + 2h: 1h on Tuesday (to 18:00), then from Wednesday 08:30.
    expect(versioned.addWorkingHours(sh('2026-10-13T17:00:00'), 2)).toEqual(
      sh('2026-10-14T09:30:00'),
    );
  });

  it('refuses a table with no working day within a year', () => {
    const closed = new WorkingCalendar({
      timeZone: 'UTC',
      days: Array.from(
        { length: 400 },
        (_, index) =>
          [
            new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10),
            'holiday',
          ] as const,
      ),
    });
    expect(() =>
      closed.addWorkingHours(new Date('2026-01-01T00:00:00Z'), 1),
    ).toThrow(/no working day/);
  });
});
