// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  FrozenCalendar,
  type CalendarSnapshot,
} from '../../../server/providers/platform/frozen-calendar.js';
const snapshot = (): CalendarSnapshot => ({
  schemaVersion: 1,
  version: 'fixture-v1',
  timeZone: 'Asia/Singapore',
  capturedAt: '2026-10-29T00:00:00Z',
  weekdays: [1, 2, 3, 4, 5],
  windows: [
    { start: '09:00', end: '12:00' },
    { start: '13:00', end: '18:00' },
  ],
  days: [],
});
const local = (s: string) => new Date(`${s}+08:00`);
describe('frozen split working hours', () => {
  it('T01 arithmetic uses four hours, with lunch and weekend excluded', () => {
    const cal = new FrozenCalendar(snapshot()),
      at = local('2026-10-30T17:00:00');
    expect(cal.addWorkingHours(at, 4)).toEqual(local('2026-11-02T12:00:00'));
    expect(cal.addWorkingHours(at, 16)).toEqual(local('2026-11-03T17:00:00'));
  });
  it('T02 retains old rules and advances a new holiday snapshot', () => {
    const data = snapshot(),
      old = new FrozenCalendar(data);
    data.days.push(['2026-11-02', 'holiday']);
    data.windows[0].end = '11:00';
    const updated = snapshot();
    updated.days.push(['2026-11-02', 'holiday']);
    const at = local('2026-10-30T17:00:00');
    expect(old.addWorkingHours(at, 4)).toEqual(local('2026-11-02T12:00:00'));
    expect(new FrozenCalendar(updated).addWorkingHours(at, 4)).toEqual(
      local('2026-11-03T12:00:00'),
    );
  });
  it('T03 stops during lunch and reaches eighty percent at 13:12', () => {
    const cal = new FrozenCalendar(snapshot()),
      at = local('2026-11-02T09:00:00');
    expect(cal.workingHoursBetween(at, local('2026-11-02T12:00:00'))).toBe(3);
    expect(cal.workingHoursBetween(at, local('2026-11-02T13:00:00'))).toBe(3);
    expect(cal.addWorkingHours(at, 4 * 0.8)).toEqual(
      local('2026-11-02T13:12:00'),
    );
    expect(cal.addWorkingHours(at, 4)).toEqual(local('2026-11-02T14:00:00'));
  });
  it('rejects overlapping windows', () => {
    const data = snapshot();
    data.windows[1].start = '11:00';
    expect(() => new FrozenCalendar(data)).toThrow();
  });
});
