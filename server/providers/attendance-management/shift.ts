import { isValidTimeZone } from '../platform/time-zone.js';

export interface ShiftInterval {
  start: string;
  startDayOffset: 0 | 1;
  end: string;
  endDayOffset: 0 | 1;
}
export interface ShiftDefinition {
  name: string;
  timeZone: string;
  intervals: ShiftInterval[];
  lateToleranceMinutes: number;
  earlyToleranceMinutes: number;
  absenceThresholdMinutes: number;
}
export class AttendanceConfigurationError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'AttendanceConfigurationError';
  }
}
function fail(): never {
  throw new AttendanceConfigurationError('ATTENDANCE_SHIFT_INVALID');
}
function minutes(time: string, offset: number) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) || ![0, 1].includes(offset))
    return fail();
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + offset * 1440;
}
/** Validate the administrator's explicit configuration; no business hours are inferred. */
export function validateShift(input: ShiftDefinition): ShiftDefinition {
  if (
    typeof input.name !== 'string' ||
    !input.name.trim() ||
    input.name.trim().length > 200 ||
    !isValidTimeZone(input.timeZone) ||
    !Array.isArray(input.intervals) ||
    input.intervals.length < 1 ||
    input.intervals.length > 16
  )
    return fail();
  const intervals = input.intervals.map((interval) => ({ ...interval }));
  const ranges = intervals.map((interval) => {
    const start = minutes(interval.start, interval.startDayOffset);
    const end = minutes(interval.end, interval.endDayOffset);
    if (end <= start || end - start > 1440) return fail();
    return { start, end };
  });
  // Declaration order is meaningful for punch matching; reject rather than silently sort it.
  if (ranges[0].start >= 1440) return fail();
  for (let i = 1; i < ranges.length; i++)
    if (ranges[i].start < ranges[i - 1].end) return fail();
  const duration = ranges.reduce(
    (sum, range) => sum + range.end - range.start,
    0,
  );
  if (ranges.at(-1)!.end - ranges[0].start > 1440) return fail();
  for (const value of [input.lateToleranceMinutes, input.earlyToleranceMinutes])
    if (!Number.isSafeInteger(value) || value < 0 || value >= duration)
      return fail();
  if (
    !Number.isSafeInteger(input.absenceThresholdMinutes) ||
    input.absenceThresholdMinutes < 1 ||
    input.absenceThresholdMinutes > duration
  )
    return fail();
  return {
    name: input.name.trim(),
    timeZone: input.timeZone,
    intervals,
    lateToleranceMinutes: input.lateToleranceMinutes,
    earlyToleranceMinutes: input.earlyToleranceMinutes,
    absenceThresholdMinutes: input.absenceThresholdMinutes,
  };
}
