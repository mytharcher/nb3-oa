export class AssetError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind:
      'invalid' | 'notFound' | 'conflict' | 'permission' = 'invalid',
  ) {
    super(message);
    this.name = 'AssetError';
  }
}
