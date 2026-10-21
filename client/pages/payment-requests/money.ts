import { formatCents } from '#lib/money';
/** Amount inputs remain decimal text until they can be represented exactly as safe cents. */
export function parseCents(value: string): number | null {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const cents =
    BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
}
export function centsText(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new Error('Invalid cents');
  const value = BigInt(cents);
  return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
}
export function sumCents(values: readonly number[]): number | null {
  let total = 0n;
  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    total += BigInt(value);
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  }
  return Number(total);
}
export function moneyLabel(cents: number, locale: string): string {
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new Error('Invalid cents');
  return formatCents(cents, locale);
}
