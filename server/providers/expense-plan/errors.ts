export class ExpensePlanError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind:
      'precondition' | 'permission' | 'notFound' = 'precondition',
  ) {
    super(message);
    this.name = 'ExpensePlanError';
  }
}
