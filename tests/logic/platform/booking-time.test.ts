// @vitest-environment node
import { expect, it } from 'vitest';
import { resolveLocalDateTime } from '../../../server/providers/platform/time-zone.ts';
it.each([
  ['Asia/Shanghai', '2026-10-11', '09:00', '2026-10-11T01:00:00.000Z'],
  ['Asia/Kathmandu', '2026-10-11', '09:00', '2026-10-11T03:15:00.000Z'],
  ['America/New_York', '2026-03-08', '01:30', '2026-03-08T06:30:00.000Z'],
  ['America/New_York', '2026-03-08', '03:30', '2026-03-08T07:30:00.000Z'],
])(
  'resolves an exact unique company clock time in %s',
  (zone, date, time, expected) => {
    expect(resolveLocalDateTime(zone, date, time).toISOString()).toBe(expected);
  },
);
it.each([
  ['America/New_York', '2026-03-08', '02:30'],
  ['America/New_York', '2026-11-01', '01:30'],
  ['Australia/Lord_Howe', '2026-10-04', '02:15'],
  ['Australia/Lord_Howe', '2026-04-05', '01:45'],
  ['Pacific/Apia', '2011-12-30', '12:00'],
])(
  'rejects skipped or repeated clock time instead of shifting it: %s %s %s',
  (zone, date, time) => {
    expect(() => resolveLocalDateTime(zone, date, time)).toThrow(RangeError);
  },
);
it.each([
  ['2026-02-30', '09:00'],
  ['2026-10-11', '24:00'],
  ['2026-10-11', '9:00'],
])('rejects invalid wall-clock input %s %s', (date, time) => {
  expect(() => resolveLocalDateTime('Asia/Shanghai', date, time)).toThrow(
    RangeError,
  );
});

it.each([
  ['2026-03-08', '02:30', 'NONEXISTENT_LOCAL_TIME'],
  ['2026-11-01', '01:30', 'AMBIGUOUS_LOCAL_TIME'],
])('returns a translatable clock error code for %s', (date, time, code) => {
  let error: unknown;
  try {
    resolveLocalDateTime('America/New_York', date, time);
  } catch (caught) {
    error = caught;
  }
  expect(error).toMatchObject({ code });
});
