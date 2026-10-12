import type { Grade } from '../org/contract.js';
export class SalaryRangeError extends Error {
  constructor(
    public readonly reason:
      | 'INVALID_RANGE'
      | 'GRADE_UNAVAILABLE'
      | 'DUPLICATE_GRADE'
      | 'OUTSIDE_RANGE',
  ) {
    super(reason);
  }
}
export interface SalaryRangeInput {
  gradeId: string;
  minimumCents: number;
  maximumCents: number;
}
export interface SalaryGradeSnapshot extends SalaryRangeInput {
  gradeCode: string;
  gradeTitle: string;
  rank: number;
}
/** Publication freezes real organisation facts; callers cannot supply their own seniority rank. */
export function freezeSalaryRanges(
  inputs: readonly SalaryRangeInput[],
  grades: readonly Grade[],
): SalaryGradeSnapshot[] {
  if (!inputs.length) throw new SalaryRangeError('INVALID_RANGE');
  const known = new Map(grades.map((grade) => [grade.id, grade]));
  const seen = new Set<string>();
  return inputs
    .map((input) => {
      if (seen.has(input.gradeId))
        throw new SalaryRangeError('DUPLICATE_GRADE');
      seen.add(input.gradeId);
      const grade = known.get(input.gradeId);
      if (!grade?.active || !Number.isSafeInteger(grade.rank))
        throw new SalaryRangeError('GRADE_UNAVAILABLE');
      if (
        !Number.isSafeInteger(input.minimumCents) ||
        !Number.isSafeInteger(input.maximumCents) ||
        input.minimumCents < 0 ||
        input.maximumCents < input.minimumCents
      )
        throw new SalaryRangeError('INVALID_RANGE');
      return {
        gradeId: grade.id,
        gradeCode: grade.code,
        gradeTitle: grade.title,
        rank: grade.rank,
        minimumCents: input.minimumCents,
        maximumCents: input.maximumCents,
      };
    })
    .sort((a, b) => a.gradeId.localeCompare(b.gradeId));
}
/** Both offered endpoints must fit the frozen published interval, inclusively. */
export function assertSalaryRange(
  snapshot: SalaryRangeInput,
  minimumCents: number,
  maximumCents = minimumCents,
): void {
  if (
    !Number.isSafeInteger(minimumCents) ||
    !Number.isSafeInteger(maximumCents) ||
    minimumCents < snapshot.minimumCents ||
    maximumCents > snapshot.maximumCents ||
    maximumCents < minimumCents
  )
    throw new SalaryRangeError('OUTSIDE_RANGE');
}
