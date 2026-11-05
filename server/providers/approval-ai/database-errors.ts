/** Only duplicate keys are recoverable; other database failures must propagate. */
export function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<object>();
  while (error && typeof error === 'object' && !seen.has(error)) {
    seen.add(error);
    if (
      'code' in error &&
      [
        '23505',
        'SQLITE_CONSTRAINT_UNIQUE',
        'SQLITE_CONSTRAINT_PRIMARYKEY',
      ].includes(String(error.code))
    )
      return true;
    error = 'cause' in error ? error.cause : undefined;
  }
  return false;
}
