export function parseCents(value: string): number | null {
  const m = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!m) return null;
  const n = BigInt(m[1]) * 100n + BigInt((m[2] ?? '').padEnd(2, '0'));
  return n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : null;
}
export function amountText(cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new Error('Invalid amount');
  const n = BigInt(cents);
  return `${n / 100n}.${String(n % 100n).padStart(2, '0')}`;
}
