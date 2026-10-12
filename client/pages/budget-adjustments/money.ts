/** Decimal text -> exact, safely representable integer cents. No floating-point scaling. */
export function parseAmountCents(value: string): number | null {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const cents =
    BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  return cents > 0n && cents <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(cents)
    : null;
}
export function amountText(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error('Unsafe cents');
  const n = BigInt(cents),
    sign = n < 0n ? '-' : '',
    absolute = n < 0n ? -n : n;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`;
}
