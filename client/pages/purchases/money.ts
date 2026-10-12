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
export function quantityText(value: string): string | undefined {
  if (value.length > 64 || !/^(?:0|[0-9]+)(?:\.[0-9]+)?$/.test(value))
    return undefined;
  const [whole, fraction = ''] = value.split('.'),
    integer = whole.replace(/^0+(?=\d)/, ''),
    decimal = fraction.replace(/0+$/, '');
  if (integer === '0' && !decimal) return undefined;
  return decimal ? `${integer}.${decimal}` : integer;
}

/** Compare cents to the frozen decimal rule without rounding sub-cent thresholds. */
export function exceedsAmountThreshold(
  cents: number,
  threshold: unknown,
): boolean {
  if (
    typeof threshold !== 'number' ||
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    !Number.isSafeInteger(cents)
  )
    throw new Error('Invalid amount threshold');
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(String(threshold));
  if (!match) throw new Error('Invalid amount threshold');
  const scale = (match[2]?.length ?? 0) - Number(match[3] ?? 0),
    coefficient = BigInt(match[1] + (match[2] ?? ''));
  return (
    BigInt(cents) * 10n ** BigInt(Math.max(0, scale)) >
    coefficient * 100n * 10n ** BigInt(Math.max(0, -scale))
  );
}
