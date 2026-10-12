export class ReimbursementError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind:
      'precondition' | 'permission' | 'notFound' | 'conflict' = 'precondition',
  ) {
    super(message);
    this.name = 'ReimbursementError';
  }
}
