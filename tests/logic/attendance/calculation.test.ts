import { describe, expect, it } from 'vitest';
import {
  calculateAttendance,
  subtractAttendanceExemptions,
} from '../../../server/providers/attendance/calculation.js';
const minute = 60000;
const at = (hour: number) =>
  Date.parse('2026-10-12T00:00:00Z') + hour * 60 * minute;
const segment = (start: number, end: number) => ({
  start: at(start),
  end: at(end),
});
const punch = (kind: 'in' | 'out', hour: number, id = `${kind}-${hour}`) => ({
  id,
  kind,
  at: at(hour),
  date: new Date(at(hour)).toISOString().slice(0, 10),
});
const options = {
  shifts: [segment(9, 18)],
  exemptions: [],
  punches: [punch('in', 9), punch('out', 18)],
  localDate: (value: number) => new Date(value).toISOString().slice(0, 10),
  lateToleranceMinutes: 5,
  earlyToleranceMinutes: 5,
  absenceThresholdMinutes: 240,
};
describe('attendance segment and approved exemption calculation', () => {
  it('merges overlapping exemptions without double-counting and preserves gaps', () => {
    expect(
      subtractAttendanceExemptions(
        [segment(9, 18)],
        [segment(10, 13), segment(12, 15)],
      ),
    ).toEqual([segment(9, 10), segment(15, 18)]);
  });
  it('does not require office punches for a fully covered approved absence', () => {
    expect(
      calculateAttendance({
        ...options,
        punches: [],
        exemptions: [segment(8, 19)],
      }),
    ).toMatchObject({ status: 'normal', missingPunches: 0, absentMinutes: 0 });
  });
  it('uses the remaining endpoint after a half-day absence', () => {
    expect(
      calculateAttendance({
        ...options,
        exemptions: [segment(9, 13)],
        punches: [punch('in', 13), punch('out', 18)],
      }),
    ).toMatchObject({ status: 'normal', lateMinutes: 0 });
  });
  it('evaluates split shifts independently', () => {
    expect(
      calculateAttendance({
        ...options,
        shifts: [segment(9, 12), segment(13, 18)],
        punches: [
          punch('in', 9),
          punch('out', 12),
          punch('in', 13.5),
          punch('out', 18),
        ],
      }),
    ).toMatchObject({
      status: 'exception',
      lateMinutes: 30,
      missingPunches: 0,
      reasons: ['late'],
    });
  });
  it('supports overnight endpoints while rejecting a next-day out for an ordinary day', () => {
    const punches = [punch('in', 22), punch('out', 30)];
    expect(
      calculateAttendance({ ...options, shifts: [segment(22, 30)], punches }),
    ).toMatchObject({ status: 'normal' });
    expect(
      calculateAttendance({
        ...options,
        punches: [punch('in', 9), punch('out', 30)],
      }),
    ).toMatchObject({ missingPunches: 1 });
  });
  it('blocks duplicate punches rather than choosing a favorable record', () => {
    expect(
      calculateAttendance({
        ...options,
        punches: [...options.punches, punch('in', 10)],
      }),
    ).toMatchObject({ status: 'blocked', reasons: ['ambiguousPunchEvidence'] });
  });
  it('keeps missing, late and early results distinguishable', () => {
    expect(calculateAttendance({ ...options, punches: [] })).toMatchObject({
      status: 'exception',
      missingPunches: 2,
      absentMinutes: 540,
    });
    expect(
      calculateAttendance({
        ...options,
        punches: [punch('in', 10), punch('out', 17)],
      }),
    ).toMatchObject({
      status: 'exception',
      lateMinutes: 60,
      earlyMinutes: 60,
      missingPunches: 0,
    });
  });
  it('allows a late-arriving real device punch to supersede only a calculated missing fact', () => {
    const missing = {
      id: 'system-missing',
      kind: 'in' as const,
      at: null,
      date: '2026-10-12',
      expectedAt: at(9),
      syntheticMissing: true,
    };
    expect(
      calculateAttendance({
        ...options,
        punches: [...options.punches, missing],
      }),
    ).toMatchObject({ status: 'normal', missingPunches: 0 });
    expect(
      calculateAttendance({
        ...options,
        punches: [...options.punches, { ...missing, syntheticMissing: false }],
      }),
    ).toMatchObject({ status: 'blocked' });
  });
  it('allocates system missing facts to their explicit segment endpoints', () => {
    expect(
      calculateAttendance({
        ...options,
        shifts: [segment(9, 12), segment(13, 18)],
        punches: [
          {
            id: 'system-missing',
            kind: 'in',
            at: null,
            date: '2026-10-12',
            expectedAt: at(9),
            syntheticMissing: true,
          },
        ],
      }),
    ).toMatchObject({ status: 'exception', missingPunches: 4 });
  });
  it('blocks malformed exemptions', () => {
    expect(
      calculateAttendance({ ...options, exemptions: [segment(18, 9)] }),
    ).toMatchObject({ status: 'blocked' });
  });
});
