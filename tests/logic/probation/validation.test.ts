import { describe, expect, it } from 'vitest';
import {
  isProbationReminderDue,
  probationCompensationInputSchema,
  probationPrivateReference,
  probationReminderDate,
  validateProbationManagerOutputs,
} from '../../../server/providers/probation/validation.js';

describe('probation business boundaries', () => {
  it('uses natural calendar days across leap years and half-open due windows', () => {
    expect(probationReminderDate('2028-03-10')).toBe('2028-02-25');
    expect(isProbationReminderDue('2028-02-24', '2028-03-10')).toBe(false);
    expect(isProbationReminderDue('2028-02-25', '2028-03-10')).toBe(true);
    expect(isProbationReminderDue('2028-03-09', '2028-03-10')).toBe(true);
    expect(isProbationReminderDue('2028-03-10', '2028-03-10')).toBe(false);
    expect(() => probationReminderDate('2026-02-30')).toThrow();
  });
  it('requires a new strictly later deferral date and rejects stale residue', () => {
    const input = {
      evaluation: 'Qualified',
      conclusion: 'deferred',
      deferredTo: '2026-12-01',
    };
    expect(
      validateProbationManagerOutputs(input, '2026-11-01').deferredTo,
    ).toBe('2026-12-01');
    expect(() =>
      validateProbationManagerOutputs(input, '2026-12-01'),
    ).toThrow();
    expect(() =>
      validateProbationManagerOutputs(
        { ...input, conclusion: 'regular' },
        '2026-11-01',
      ),
    ).toThrow();
    expect(() =>
      validateProbationManagerOutputs(
        { ...input, deferredTo: null },
        '2026-11-01',
      ),
    ).toThrow();
  });
  it('accepts canonical decimal strings without floating point amounts or extra fields', () => {
    expect(
      probationCompensationInputSchema.safeParse({
        gradeId: 'g',
        baseSalary: '12000.50',
      }).success,
    ).toBe(true);
    for (const baseSalary of ['1e6', '-1', '01', '0.001', 12000])
      expect(
        probationCompensationInputSchema.safeParse({ gradeId: 'g', baseSalary })
          .success,
      ).toBe(false);
    expect(
      probationCompensationInputSchema.safeParse({
        gradeId: 'g',
        baseSalary: '0',
        salary: '1',
      }).success,
    ).toBe(false);
  });
  it('refuses a salary string in place of an opaque proposal reference', () => {
    expect(() => probationPrivateReference('12000.50')).toThrow();
    expect(
      probationPrivateReference('7b6765fa-1c13-4c00-95b7-55e64f63e581'),
    ).toBe('probation-compensation:7b6765fa-1c13-4c00-95b7-55e64f63e581');
  });
});
