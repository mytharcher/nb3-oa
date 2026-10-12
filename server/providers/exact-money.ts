/** Compare safe integer cents with the rule's decimal representation, including sub-cent thresholds. */
export function exceedsMoneyThreshold(
  cents: number,
  threshold: unknown,
): boolean {
  if (
    !Number.isSafeInteger(cents) ||
    cents < 0 ||
    typeof threshold !== 'number' ||
    !Number.isFinite(threshold) ||
    threshold < 0
  )
    throw new Error('Invalid money threshold or amount.');
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(String(threshold));
  if (!match) throw new Error('Invalid money threshold representation.');
  const scale = (match[2]?.length ?? 0) - Number(match[3] ?? 0);
  const coefficient = BigInt(match[1] + (match[2] ?? ''));
  return (
    BigInt(cents) * 10n ** BigInt(Math.max(0, scale)) >
    coefficient * 100n * 10n ** BigInt(Math.max(0, -scale))
  );
}
