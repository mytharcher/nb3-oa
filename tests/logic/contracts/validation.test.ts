import { expect, it } from 'vitest';
import {
  ruleCents,
  validateActionInput,
} from '../../../server/providers/contracts/validation.js';
it('money thresholds use decimal digits and reject fractional cents and unsafe totals', () => {
  expect(ruleCents(0.29)).toBe(29);
  expect(ruleCents(50000)).toBe(5000000);
  expect(ruleCents(90071992547409.9)).toBe(9007199254740990);
  for (const value of [0.001, -1, Infinity, Number.MAX_SAFE_INTEGER])
    expect(() => ruleCents(value)).toThrow();
});
it('native action inputs cannot journal arbitrary private outputs', () => {
  expect(() =>
    validateActionInput('approve', { data: { nonStandard: true } }),
  ).not.toThrow();
  for (const action of ['approve', 'reject', 'claim', 'reuseOpinions']) {
    expect(() =>
      validateActionInput(action, { data: { bankAccount: 'private' } }),
    ).toThrow();
    expect(() => validateActionInput(action, { salary: 42 })).toThrow();
  }
});
