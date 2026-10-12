export class ValidationFailure extends Error {
  constructor(
    public readonly fields: string[],
    public readonly messages: Record<string, string> = {},
  ) {
    super('Invalid form');
  }
}
