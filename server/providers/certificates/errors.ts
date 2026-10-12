export class CertificateError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
