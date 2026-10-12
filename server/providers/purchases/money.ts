/** Quantities stay exact decimal strings; they never pass through a floating point number. */
export function quantityText(value: unknown): string | undefined {
  if (
    typeof value !== 'string' ||
    value.length > 64 ||
    !/^\d+(?:\.\d+)?$/.test(value)
  )
    return undefined;
  const [whole = '', fraction = ''] = value.split('.');
  const w = whole.replace(/^0+(?=\d)/, '');
  const f = fraction.replace(/0+$/, '');
  if (!/[1-9]/.test(w + f)) return undefined;
  return f ? `${w}.${f}` : w;
}
export function priceNeedsConfirmation(
  actualCents: number,
  estimatedCents: number,
): boolean {
  if (
    !Number.isSafeInteger(actualCents) ||
    actualCents <= 0 ||
    !Number.isSafeInteger(estimatedCents) ||
    estimatedCents <= 0
  )
    throw new Error('Prices must be positive safe integer cents.');
  return BigInt(actualCents) * 100n > BigInt(estimatedCents) * 120n;
}
