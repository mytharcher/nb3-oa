import { describe, expect, it } from 'vitest';
import {
  parseCents,
  centsText,
  moneyLabel,
} from '../../../client/pages/payment-requests/money.js';
describe('payment amounts retain exact integer cents', () => {
  it('round trips cents near the safe integer limit without a floating-point decimal', () => {
    expect(parseCents('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
    expect(centsText(Number.MAX_SAFE_INTEGER)).toBe('90071992547409.91');
    expect(moneyLabel(Number.MAX_SAFE_INTEGER, 'en-US')).toBe(
      '90,071,992,547,409.91',
    );
    expect(moneyLabel(100001, 'zh-CN')).toBe('1,000.01');
  });
  it('rejects rounded or ambiguous inputs and allows an empty draft zero', () => {
    for (const text of [
      '1e3',
      '-1',
      '1.234',
      '90071992547409.92',
      '01',
      '',
      'NaN',
      '1,000',
    ])
      expect(parseCents(text)).toBeNull();
    expect(parseCents('0')).toBe(0);
    expect(parseCents('12.1')).toBe(1210);
  });
});
