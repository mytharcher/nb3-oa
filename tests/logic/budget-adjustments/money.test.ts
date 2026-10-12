// @vitest-environment node
import { expect, it } from 'vitest';
import { exceedsBudgetThreshold } from '../../../server/providers/budget-adjustments/money.ts';
it('compares currency thresholds exactly at boundaries and across scientific notation', () => {
  expect(exceedsBudgetThreshold(29, 0.29)).toBe(false);
  expect(exceedsBudgetThreshold(30, 0.29)).toBe(true);
  expect(exceedsBudgetThreshold(29, 0.291)).toBe(false);
  expect(exceedsBudgetThreshold(30, 0.291)).toBe(true);
  expect(exceedsBudgetThreshold(5_000_000, 50_000)).toBe(false);
  expect(exceedsBudgetThreshold(5_000_001, 50_000)).toBe(true);
  expect(exceedsBudgetThreshold(1, 1e-7)).toBe(true);
  expect(exceedsBudgetThreshold(Number.MAX_SAFE_INTEGER, 1e21)).toBe(false);
});
it('rejects invalid amounts or missing/negative thresholds', () => {
  for (const value of [undefined, null, '50000', NaN, Infinity, -1])
    expect(() => exceedsBudgetThreshold(100, value)).toThrow();
  expect(() => exceedsBudgetThreshold(0.5, 1)).toThrow();
});
