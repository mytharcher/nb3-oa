export class ContractError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ContractError';
  }
}
export function fail(code: string, message: string): never {
  throw new ContractError(`CONTRACT_${code}`, message);
}
export function cents(value: number, zero = true) {
  if (!Number.isSafeInteger(value) || value < (zero ? 0 : 1))
    fail('INVALID_AMOUNT', 'Amounts must be safe integer cents.');
}
