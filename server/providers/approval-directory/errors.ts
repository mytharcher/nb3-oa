export class DelegationError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_DELEGATION'
      | 'DELEGATION_NOT_FOUND'
      | 'DELEGATION_SOURCE_PROTECTED'
      | 'DELEGATION_OVERLAP',
    message: string,
  ) {
    super(message);
    this.name = 'DelegationError';
  }
}
