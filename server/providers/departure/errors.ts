export class DepartureError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind:
      'permission' | 'precondition' | 'notFound' = 'precondition',
  ) {
    super(message);
    this.name = 'DepartureError';
  }
}
