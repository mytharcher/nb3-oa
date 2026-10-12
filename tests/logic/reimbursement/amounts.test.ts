// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  paymentAmounts,
  totalClaimCents,
} from '../../../server/providers/reimbursement/amounts.ts';
describe('expense amounts and loan offset conservation', () => {
  it('keeps cents exact up to the maximum and detects aggregate overflow', () => {
    expect(totalClaimCents([{ amountCents: 29 }, { amountCents: 1 }])).toBe(30);
    expect(
      totalClaimCents([
        { amountCents: Number.MAX_SAFE_INTEGER - 29 },
        { amountCents: 29 },
      ]),
    ).toBe(Number.MAX_SAFE_INTEGER);
    expect(() =>
      totalClaimCents([
        { amountCents: Number.MAX_SAFE_INTEGER },
        { amountCents: 1 },
      ]),
    ).toThrow();
    for (const amountCents of [0, -1, 0.29, Number.MAX_SAFE_INTEGER + 1, NaN])
      expect(() => totalClaimCents([{ amountCents }])).toThrow();
  });
  it('distinguishes gross reimbursement from actual cash and permits full loan offset', () => {
    expect(paymentAmounts(10001, 2501)).toEqual({
      grossCents: 10001,
      offsetCents: 2501,
      netCents: 7500,
    });
    expect(paymentAmounts(29, 29)).toEqual({
      grossCents: 29,
      offsetCents: 29,
      netCents: 0,
    });
    for (const offset of [-1, 30, 0.1, NaN])
      expect(() => paymentAmounts(29, offset)).toThrow();
  });
});
