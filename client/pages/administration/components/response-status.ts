/** Public errors expose an HTTP status; unknown network failures remain retryable. */
export function responseStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const status: unknown = Reflect.get(error, 'status');
  return typeof status === 'number' ? status : undefined;
}
