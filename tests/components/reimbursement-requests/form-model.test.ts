import { describe, expect, it } from 'vitest';
import {
  parseCents,
  centsText,
  sumCents,
  moneyLabel,
} from '../../../client/pages/reimbursement-requests/money.js';
import { lineAccess } from '../../../client/pages/reimbursement-requests/line-access.js';
describe('reimbursement exact money and returned-line editing', () => {
  it('preserves cents at decimal and safe-integer boundaries without floating rounding', () => {
    expect(parseCents('0.29')).toBe(29);
    expect(parseCents('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
    expect(parseCents('90071992547409.92')).toBeNull();
    expect(sumCents([Number.MAX_SAFE_INTEGER - 29, 29])).toBe(
      Number.MAX_SAFE_INTEGER,
    );
    expect(sumCents([Number.MAX_SAFE_INTEGER, 1])).toBeNull();
    expect(centsText(Number.MAX_SAFE_INTEGER)).toBe('90071992547409.91');
    expect(moneyLabel(Number.MAX_SAFE_INTEGER, 'en-US')).toBe(
      '90,071,992,547,409.91',
    );
    for (const invalid of ['1e3', '-1', '0.001', '01', 'NaN'])
      expect(parseCents(invalid)).toBeNull();
  });
  it('keeps checked, pending and unknown facts immutable during finance correction', () => {
    const record = {
      status: 'revision',
      financeCorrectionLines: [
        'approved',
        'pending',
        'returned',
        'missing',
      ].map((id) => ({ id })),
      financeLineFacts: {
        approved: { outcome: 'approved' as const },
        pending: { outcome: 'pending' as const },
        returned: { outcome: 'returned' as const },
      },
    };
    for (const id of ['approved', 'pending', 'missing', 'new'])
      expect(lineAccess(record, id)).toEqual({
        editable: false,
        removable: false,
        addable: false,
      });
    expect(lineAccess(record, 'returned')).toEqual({
      editable: true,
      removable: true,
      addable: false,
    });
    expect(
      lineAccess({ ...record, financeCorrectionLines: [] }, 'new').addable,
    ).toBe(true);
    expect(lineAccess(undefined, 'new').editable).toBe(true);
  });
});
