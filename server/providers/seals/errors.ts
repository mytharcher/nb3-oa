export class SealError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
export function fail(code: string): never {
  throw new SealError(code);
}
