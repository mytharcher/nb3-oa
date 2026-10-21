/** Format integer cents exactly, including the last cent at the safe-integer boundary. */
export function formatCents(cents: number, locale: string): string {
  if (!Number.isSafeInteger(cents)) throw new Error('Unsafe cents');
  const integer = BigInt(cents);
  const fraction = (integer < 0n ? -integer : integer) % 100n;
  const whole = integer / 100n;
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const localizedFraction = new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(fraction);
  return formatter
    .formatToParts(cents < 0 && whole === 0n ? -0 : whole)
    .map((part) => (part.type === 'fraction' ? localizedFraction : part.value))
    .join('');
}
