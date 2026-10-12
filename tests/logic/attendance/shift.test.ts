// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  validateShift,
  type ShiftDefinition,
} from '../../../server/providers/attendance-management/shift.js';
const shift = (): ShiftDefinition => ({
  name: 'Configured',
  timeZone: 'Asia/Singapore',
  intervals: [
    { start: '22:00', startDayOffset: 0, end: '06:00', endDayOffset: 1 },
  ],
  lateToleranceMinutes: 5,
  earlyToleranceMinutes: 5,
  absenceThresholdMinutes: 240,
});
describe('explicit attendance shift', () => {
  it('keeps cross-midnight ownership and copies caller intervals', () => {
    const input = shift();
    const result = validateShift(input);
    input.intervals[0].end = '07:00';
    expect(result.intervals[0].end).toBe('06:00');
    expect(result.intervals[0].endDayOffset).toBe(1);
  });
  it('accepts adjacent intervals and excludes the configured break', () => {
    const input = shift();
    input.intervals = [
      { start: '09:00', startDayOffset: 0, end: '12:00', endDayOffset: 0 },
      { start: '13:00', startDayOffset: 0, end: '18:00', endDayOffset: 0 },
    ];
    expect(validateShift(input).intervals).toHaveLength(2);
    input.absenceThresholdMinutes = 481;
    expect(() => validateShift(input)).toThrow('ATTENDANCE_SHIFT_INVALID');
  });
  it.each(['24:00', '9:00', '12:60', '', '09:00Z'])(
    'rejects invalid local time %s',
    (time) => {
      const input = shift();
      input.intervals[0].start = time;
      expect(() => validateShift(input)).toThrow('ATTENDANCE_SHIFT_INVALID');
    },
  );
  it('rejects overlapping intervals and implicit overnight shifts', () => {
    const input = shift();
    input.intervals[0].endDayOffset = 0;
    expect(() => validateShift(input)).toThrow('ATTENDANCE_SHIFT_INVALID');
    input.intervals[0].endDayOffset = 1;
    input.intervals.push({
      start: '05:00',
      startDayOffset: 1,
      end: '07:00',
      endDayOffset: 1,
    });
    expect(() => validateShift(input)).toThrow('ATTENDANCE_SHIFT_INVALID');
  });
  it.each([-1, 0.5, 480, Number.NaN])(
    'rejects invalid tolerance %s',
    (value) => {
      const input = shift();
      input.lateToleranceMinutes = value;
      expect(() => validateShift(input)).toThrow('ATTENDANCE_SHIFT_INVALID');
    },
  );
  it('rejects an unknown zone and a schedule wholly owned by tomorrow', () => {
    const input = shift();
    input.timeZone = 'Unknown/Zone';
    expect(() => validateShift(input)).toThrow('ATTENDANCE_SHIFT_INVALID');
    input.timeZone = 'Asia/Singapore';
    input.intervals[0].startDayOffset = 1;
    expect(() => validateShift(input)).toThrow('ATTENDANCE_SHIFT_INVALID');
  });
});
