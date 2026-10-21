import { expect, it } from 'vitest';
import { formatCents } from '../../client/lib/money.js';

it('formats display amounts without losing cents or the sign of fractional debts', () => {
  expect(formatCents(123456789, 'en-US')).toBe('1,234,567.89');
  expect(formatCents(Number.MAX_SAFE_INTEGER, 'en-US')).toBe(
    '90,071,992,547,409.91',
  );
  expect(formatCents(-1, 'zh-CN')).toBe('-0.01');
  expect(formatCents(-100, 'en-US')).toBe('-1.00');
  expect(() => formatCents(Number.MAX_SAFE_INTEGER + 1, 'en-US')).toThrow(
    'Unsafe cents',
  );
});
