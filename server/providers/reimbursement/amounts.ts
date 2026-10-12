export class ReimbursementAmountError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ReimbursementAmountError';
  }
}
export function totalClaimCents(
  lines: readonly { amountCents: number }[],
): number {
  let total = 0n;
  for (const line of lines) {
    if (!Number.isSafeInteger(line.amountCents) || line.amountCents <= 0)
      throw new ReimbursementAmountError(
        'REIMBURSEMENT_INVALID_LINE_AMOUNT',
        'Each expense line requires positive safe integer cents.',
      );
    total += BigInt(line.amountCents);
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER))
    throw new ReimbursementAmountError(
      'REIMBURSEMENT_TOTAL_TOO_LARGE',
      'The sum of expenses exceeds the exact monetary limit.',
    );
  return Number(total);
}
export function paymentAmounts(grossCents: number, offsetCents: number) {
  if (
    !Number.isSafeInteger(grossCents) ||
    grossCents <= 0 ||
    !Number.isSafeInteger(offsetCents) ||
    offsetCents < 0 ||
    offsetCents > grossCents
  )
    throw new ReimbursementAmountError(
      'REIMBURSEMENT_INVALID_OFFSET',
      'The loan offset must lie between zero and the positive claimed total.',
    );
  return { grossCents, offsetCents, netCents: grossCents - offsetCents };
}
