/** Preserve the input order while awaiting every asynchronous predicate. */
export async function asyncFilter<T>(
  values: readonly T[],
  predicate: (value: T) => Promise<boolean>,
): Promise<T[]> {
  const accepted = await Promise.all(values.map(predicate));
  return values.filter((_, index) => accepted[index]);
}
