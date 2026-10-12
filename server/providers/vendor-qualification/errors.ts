export class VendorQualificationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind:
      'invalid' | 'permission' | 'notFound' | 'conflict' = 'invalid',
  ) {
    super(message);
    this.name = 'VendorQualificationError';
  }
}
export function refuse(
  code: string,
  message: string,
  kind: VendorQualificationError['kind'] = 'invalid',
): never {
  throw new VendorQualificationError(
    `VENDOR_QUALIFICATION_${code}`,
    message,
    kind,
  );
}
