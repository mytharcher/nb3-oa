/** Validate persisted scalar references rather than stringifying arbitrary JSON or objects. */
export function taskReference(value: unknown): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  )
    return String(value);
  throw new Error('Invalid task reference');
}
export function taskDate(value: unknown): Date {
  const date = value instanceof Date ? value : new Date(taskReference(value));
  if (!Number.isFinite(date.getTime()))
    throw new Error('Invalid task timestamp');
  return date;
}
