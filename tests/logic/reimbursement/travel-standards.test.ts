import {
  dictionaryTypeOf,
  dictionaryExtraSchema,
} from '../../../server/providers/platform/dictionary-types.ts';
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  expenseCategoryStandardKinds,
  validateReimbursementTravelStandards,
} from '../../../server/providers/reimbursement/travel-standards.ts';
const standard = {
  code: 'staff',
  gradeRank: 1,
  lodgingPerNight: 100,
  allowancePerDay: 20,
};
const categories = [
  { code: 'hotel', standardKind: 'lodging' as const },
  { code: 'food', standardKind: 'allowance' as const },
  { code: 'travel', standardKind: 'none' as const },
];
const line = (
  id: string,
  amountCents: number,
  category = 'hotel',
  date = '2026-10-11',
  standardExceptionReason = '',
) => ({ id, amountCents, category, date, standardExceptionReason });
const check = (lines: ReturnType<typeof line>[], overrides = {}) =>
  validateReimbursementTravelStandards({
    linkedKind: 'oa.travel',
    standard,
    categories,
    lines,
    ...overrides,
  });
describe('reimbursement classified daily travel standards', () => {
  it('accepts only server-declared finite dictionary classification values', () => {
    const schema = dictionaryExtraSchema(dictionaryTypeOf('expenseCategory')!);
    expect(schema.safeParse({ travelStandardKind: 'lodging' }).success).toBe(
      true,
    );
    expect(schema.safeParse({ travelStandardKind: 'hotel' }).success).toBe(
      false,
    );
    expect(
      schema.safeParse({ travelStandardKind: 'none', arbitraryLimit: 999999 })
        .success,
    ).toBe(false);
  });
  it('resolves only active explicit dictionary kinds and leaves legacy aggregate travel as none', () => {
    expect(
      expenseCategoryStandardKinds([
        { code: 'travel', active: true },
        {
          code: 'hotel',
          active: true,
          extra: { travelStandardKind: 'lodging' },
        },
        {
          code: 'old',
          active: false,
          extra: { travelStandardKind: 'invalid' },
        },
      ]),
    ).toEqual([
      { code: 'travel', standardKind: 'none' },
      { code: 'hotel', standardKind: 'lodging' },
    ]);
    expect(() =>
      expenseCategoryStandardKinds([
        { code: 'hotel', active: true, extra: { travelStandardKind: 'HOTEL' } },
      ]),
    ).toThrow();
    expect(() =>
      expenseCategoryStandardKinds([
        { code: 'hotel', active: true },
        { code: 'hotel', active: true },
      ]),
    ).toThrow();
  });
  it('aggregates same-date same-standard lines and requires each over-standard line explanation', () => {
    expect(check([line('a', 6000), line('b', 4000)])[0].exceeded).toBe(false);
    expect(() => check([line('a', 6000), line('b', 4001)])).toThrow(
      expect.objectContaining({
        code: 'REIMBURSEMENT_STANDARD_REASON_REQUIRED',
        lineIds: ['a', 'b'],
      }),
    );
    expect(() =>
      check([
        line('a', 6000, 'hotel', '2026-10-11', 'No available hotels'),
        line('b', 4001),
      ]),
    ).toThrow(expect.objectContaining({ lineIds: ['b'] }));
    expect(
      check([
        line('a', 6000, 'hotel', '2026-10-11', 'Reason'),
        line('b', 4001, 'hotel', '2026-10-11', 'Reason'),
      ])[0].exceeded,
    ).toBe(true);
  });
  it('separates calendar dates and kinds, and does not treat aggregate travel or ordinary costs as lodging', () => {
    expect(
      check([
        line('a', 10000),
        line('b', 10000, 'hotel', '2026-10-12'),
        line('c', 2000, 'food'),
      ]),
    ).toHaveLength(3);
    expect(check([line('a', 999999, 'travel')], { standard: null })).toEqual(
      [],
    );
    expect(
      check([line('a', 999999)], { linkedKind: null, standard: null }),
    ).toEqual([]);
    expect(
      check([line('a', 999999)], {
        linkedKind: 'oa.expensePlan',
        standard: null,
      }),
    ).toEqual([]);
  });
  it('compares exact cents, rejects malformed snapshots and unsafe group totals', () => {
    expect(
      check([line('a', 10)], {
        standard: { ...standard, lodgingPerNight: 0.1 },
      })[0].exceeded,
    ).toBe(false);
    expect(() =>
      check([line('a', 11)], {
        standard: { ...standard, lodgingPerNight: 0.1 },
      }),
    ).toThrow();
    expect(() => check([line('a', 1)], { standard: null })).toThrow(
      expect.objectContaining({ code: 'REIMBURSEMENT_STANDARD_CONFIGURATION' }),
    );
    expect(() =>
      check([line('a', Number.MAX_SAFE_INTEGER), line('b', 1)]),
    ).toThrow(
      expect.objectContaining({ code: 'REIMBURSEMENT_TOTAL_TOO_LARGE' }),
    );
    expect(() => check([line('a', 1, 'hotel', '2026-02-30')])).toThrow(
      expect.objectContaining({ code: 'REIMBURSEMENT_INVALID_LINE_DATE' }),
    );
    expect(() =>
      check([line('a', 1)], { categories: [...categories, categories[0]] }),
    ).toThrow();
  });
});
