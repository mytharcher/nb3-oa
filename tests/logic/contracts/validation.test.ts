import { expect, it } from 'vitest';
import { Action } from '../../../server/routes/contracts/schemas.js';
import {
  ruleCents,
  validateActionInput,
} from '../../../server/providers/contracts/validation.js';
it('accepts actions without content review while requiring a displayed hash for approval', () => {
  const command = { target: { taskId: 'task' }, requestId: 'request' };
  for (const action of ['comment', 'claim', 'read', 'urge'])
    expect(Action.safeParse({ ...command, action }).success).toBe(true);
  expect(Action.safeParse({ ...command, action: 'approve' }).success).toBe(
    false,
  );
  expect(
    Action.safeParse({ ...command, action: 'approve', contentHash: '' })
      .success,
  ).toBe(false);
  expect(
    Action.parse({
      ...command,
      action: 'approve',
      contentHash: 'displayed-hash',
    }).contentHash,
  ).toBe('displayed-hash');
});
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
