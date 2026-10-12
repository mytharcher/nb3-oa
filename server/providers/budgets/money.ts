/** Convert a decimal currency string using integer arithmetic, never floating point rounding. */
export function parseBudgetAmount(value: string): number | undefined {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return undefined;
  const cents =
    BigInt(match[2]) * 100n + BigInt((match[3] ?? '').padEnd(2, '0'));
  const signed = match[1] ? -cents : cents;
  if (
    signed > BigInt(Number.MAX_SAFE_INTEGER) ||
    signed < -BigInt(Number.MAX_SAFE_INTEGER)
  )
    return undefined;
  return Number(signed);
}
