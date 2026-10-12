export class PaymentRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind:
      'permission' | 'precondition' | 'notFound' | 'conflict' = 'precondition',
  ) {
    super(message);
    this.name = 'PaymentRequestError';
  }
}
