/** Canonical comparison keeps equivalent policies independent of JSON property order. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  return value;
}
export function operationPolicyKey(type: string, policy: unknown): string {
  return JSON.stringify(
    canonical(
      policy ??
        (type === 'composite' ? { type: 'composite', scopes: {} } : null),
    ),
  );
}
