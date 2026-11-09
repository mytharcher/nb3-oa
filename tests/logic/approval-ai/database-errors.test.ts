// @vitest-environment node
import { expect, it } from 'vitest';
import { isUniqueViolation } from '../../../server/providers/approval-ai/database-errors.js';

it.each(['23505', 'SQLITE_CONSTRAINT_UNIQUE', 'SQLITE_CONSTRAINT_PRIMARYKEY'])(
  'recognizes direct and wrapped duplicate-key failures: %s',
  (code) => {
    expect(isUniqueViolation({ code })).toBe(true);
    expect(
      isUniqueViolation(new Error('repository failure', { cause: { code } })),
    ).toBe(true);
  },
);
it.each([
  'SQLITE_CONSTRAINT',
  'SQLITE_CONSTRAINT_FOREIGNKEY',
  'SQLITE_CONSTRAINT_NOTNULL',
  'SQLITE_BUSY',
  '23503',
])('does not hide unrelated database failures: %s', (code) =>
  expect(isUniqueViolation({ code })).toBe(false),
);
it('handles absent errors and cyclic causes', () => {
  for (const value of [null, undefined, '23505', new Error('failure')])
    expect(isUniqueViolation(value)).toBe(false);
  const error: { cause?: unknown } = {};
  error.cause = error;
  expect(isUniqueViolation(error)).toBe(false);
});
