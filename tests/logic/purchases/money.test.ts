import { purchaseQuoteBasis } from '../../../server/providers/purchases/quotes.ts';
import { describe, it, expect } from 'vitest';
import {
  quantityText,
  priceNeedsConfirmation,
} from '../../../server/providers/purchases/money.ts';
describe('purchase quantities and exact 120% price boundary', () => {
  it('preserves fractional physical units without converting to floating point', () => {
    expect(quantityText('0001.5000')).toBe('1.5');
    expect(quantityText('0.000000000000000001')).toBe('0.000000000000000001');
    expect(quantityText('9007199254740993')).toBe('9007199254740993');
    for (const v of [
      '0',
      '0.00',
      '-1',
      '1e3',
      'NaN',
      '1.',
      ' 1',
      '1/2',
      1.5,
      null,
    ])
      expect(quantityText(v)).toBeUndefined();
  });
  it('uses integer multiplication at the exact ratio and near the safe money limit', () => {
    expect(priceNeedsConfirmation(12000, 10000)).toBe(false);
    expect(priceNeedsConfirmation(12001, 10000)).toBe(true);
    expect(priceNeedsConfirmation(6, 5)).toBe(false);
    expect(priceNeedsConfirmation(7, 5)).toBe(true);
    expect(
      priceNeedsConfirmation(
        Number.MAX_SAFE_INTEGER,
        Math.floor(Number.MAX_SAFE_INTEGER / 2),
      ),
    ).toBe(true);
  });
  it('quotation basis survives stage/version retries and accounting changes but rejects changed supplier requirements', () => {
    const basis = {
        departmentId: 'department',
        purpose: 'Need paper',
        expectedDate: '2026-11-12',
        items: [
          {
            id: 'line',
            name: 'Paper',
            specification: 'A4',
            quantity: '1.5',
            unit: 'kg',
          },
        ],
      },
      hash = purchaseQuoteBasis(basis);
    const retry = { ...basis, lifecycleVersion: 99, estimatedCents: 20000 };
    expect(purchaseQuoteBasis(retry)).toBe(hash);
    expect(
      purchaseQuoteBasis({
        ...basis,
        items: [{ ...basis.items[0], id: 'replacement-line-id' }],
      }),
    ).toBe(hash);
    expect(
      purchaseQuoteBasis({ ...basis, purpose: 'Need different paper' }),
    ).not.toBe(hash);
    expect(
      purchaseQuoteBasis({ ...basis, expectedDate: '2026-11-13' }),
    ).not.toBe(hash);
    expect(
      purchaseQuoteBasis({
        ...basis,
        items: [{ ...basis.items[0], quantity: '2' }],
      }),
    ).not.toBe(hash);
  });
});
