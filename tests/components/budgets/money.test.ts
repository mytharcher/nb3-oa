import { describe, expect, it } from 'vitest';
import { parseBudgetAmount } from '../../../server/providers/budgets/money.js';
import { amountCents, money } from '../../../client/pages/budgets/types.js';
describe('exact currency boundaries', () => {
  it('accepts exact cents and preserves the final cent at the JS safe integer boundary', () => {
    for (const parse of [parseBudgetAmount, amountCents]) {
      expect(parse('0.29')).toBe(29);
      expect(parse('-100.01')).toBe(-10001);
      expect(parse('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
      expect(parse('90071992547409.92')).toBeUndefined();
      expect(parse('0.001')).toBeUndefined();
      expect(parse('1e3')).toBeUndefined();
    }
    expect(money(Number.MAX_SAFE_INTEGER, 'en-US')).toBe(
      '90,071,992,547,409.91',
    );
  });
});
