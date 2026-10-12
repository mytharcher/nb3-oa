// @vitest-environment node
import { expect, it } from 'vitest';
import {
  assertSalaryRange,
  freezeSalaryRanges,
} from '../../../server/providers/job-grades/ranges.js';
const grade = {
  id: 'g1',
  code: 'manager',
  title: 'Manager',
  rank: 5,
  active: true,
};
it('freezes real rank and identity independently of later organisation changes', () => {
  const input = { gradeId: grade.id, minimumCents: 10001, maximumCents: 20002 };
  const source = { ...grade };
  const [snapshot] = freezeSalaryRanges([input], [source]);
  source.rank = 9;
  source.active = false;
  input.minimumCents = 1;
  expect(snapshot).toMatchObject({
    rank: 5,
    gradeCode: 'manager',
    minimumCents: 10001,
  });
  expect(() => freezeSalaryRanges([input], [source])).toThrow(
    'GRADE_UNAVAILABLE',
  );
});
it('rejects missing, duplicate and inactive grades rather than inventing a salary band', () => {
  const input = { gradeId: grade.id, minimumCents: 0, maximumCents: 1 };
  expect(() => freezeSalaryRanges([input], [])).toThrow('GRADE_UNAVAILABLE');
  expect(() => freezeSalaryRanges([input, input], [grade])).toThrow(
    'DUPLICATE_GRADE',
  );
  expect(() => freezeSalaryRanges([], [grade])).toThrow('INVALID_RANGE');
});
it('rejects fractions, overflow and reversed amounts before persistence', () => {
  for (const [minimumCents, maximumCents] of [
    [1.5, 2],
    [-1, 2],
    [2, 1],
    [0, Number.MAX_SAFE_INTEGER + 1],
  ])
    expect(() =>
      freezeSalaryRanges(
        [{ gradeId: grade.id, minimumCents, maximumCents }],
        [grade],
      ),
    ).toThrow('INVALID_RANGE');
});
it('checks both endpoints against frozen inclusive bounds for recruitment and a single transfer salary', () => {
  const band = { gradeId: grade.id, minimumCents: 10001, maximumCents: 20002 };
  expect(() => assertSalaryRange(band, 10001, 20002)).not.toThrow();
  expect(() => assertSalaryRange(band, 20002)).not.toThrow();
  for (const [a, b] of [
    [10000, 15000],
    [15000, 20003],
    [15000, 14999],
    [NaN, 15000],
  ])
    expect(() => assertSalaryRange(band, a, b)).toThrow('OUTSIDE_RANGE');
});
