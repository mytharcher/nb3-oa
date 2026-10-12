import { expect, test } from 'vitest';
import {
  raiseExceeds,
  salaryCents,
} from '../../../server/providers/transfer/salary.js';
test('salary thresholds are strict exact integer comparisons and reject absent positive basis', () => {
  expect(raiseExceeds(100_000, 120_000, 0.2)).toBe(false);
  expect(raiseExceeds(100_000, 120_001, 0.2)).toBe(true);
  expect(raiseExceeds(100_000, 130_000, 0.3)).toBe(false);
  expect(raiseExceeds(100_000, 130_001, 0.3)).toBe(true);
  expect(raiseExceeds(100_000, 90_000, 0.2)).toBe(false);
  expect(() => raiseExceeds(0, 100, 0.2)).toThrow(
    'TRANSFER_CURRENT_SALARY_INVALID',
  );
  expect(() => raiseExceeds(-1, 100, 0.2)).toThrow(
    'TRANSFER_CURRENT_SALARY_INVALID',
  );
  expect(() => raiseExceeds(100, 200, 0.1234567)).toThrow(
    'TRANSFER_RATIO_INVALID',
  );
  expect(salaryCents('12.01')).toBe(1201);
  expect(salaryCents('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
  expect(() => salaryCents('90071992547409.92')).toThrow(
    'TRANSFER_SALARY_INVALID',
  );
  expect(
    raiseExceeds(Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER, 0.2),
  ).toBe(false);
  expect(() => salaryCents('12.001')).toThrow('TRANSFER_SALARY_INVALID');
});
