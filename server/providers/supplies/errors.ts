export class SupplyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind:
      'precondition' | 'permission' | 'notFound' = 'precondition',
  ) {
    super(message);
    this.name = 'SupplyError';
  }
}
