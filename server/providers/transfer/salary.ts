/** Private business logic: amounts must never be persisted in ordinary approval snapshots. */
export class TransferSalaryError extends Error {
  constructor(
    public readonly reason:
      | 'TRANSFER_CURRENT_SALARY_INVALID'
      | 'TRANSFER_SALARY_INVALID'
      | 'TRANSFER_RATIO_INVALID',
  ) {
    super(reason);
  }
}
export function salaryCents(amount: string): number {
  if (!/^\d{1,14}(\.\d{1,2})?$/u.test(amount))
    throw new TransferSalaryError('TRANSFER_SALARY_INVALID');
  const [whole, fractional = ''] = amount.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fractional.padEnd(2, '0'));
  if (cents > BigInt(Number.MAX_SAFE_INTEGER))
    throw new TransferSalaryError('TRANSFER_SALARY_INVALID');
  return Number(cents);
}
/** Convert the decimal rule exactly; no division or binary floating-point salary comparison. */
export function raiseExceeds(
  currentCents: number,
  targetCents: number,
  threshold: number,
): boolean {
  if (!Number.isSafeInteger(currentCents) || currentCents <= 0)
    throw new TransferSalaryError('TRANSFER_CURRENT_SALARY_INVALID');
  if (!Number.isSafeInteger(targetCents) || targetCents < 0)
    throw new TransferSalaryError('TRANSFER_SALARY_INVALID');
  const decimal = String(threshold);
  if (!/^0(?:\.\d{1,6})?$|^1(?:\.0{1,6})?$/u.test(decimal))
    throw new TransferSalaryError('TRANSFER_RATIO_INVALID');
  const [whole, fractional = ''] = decimal.split('.');
  const denominator = 10n ** BigInt(fractional.length);
  const numerator = BigInt(whole) * denominator + BigInt(fractional || '0');
  return (
    BigInt(targetCents - currentCents) * denominator >
    BigInt(currentCents) * numerator
  );
}
