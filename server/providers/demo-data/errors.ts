import { ApiError } from '@nocobase/app-server/router';

/** Keep machine-readable causes without persisting messages, SQL or payloads. */
export function sampleFailureReason(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    for (const field of ['reason', 'code'] as const) {
      const value =
        field in error ? (error as Record<string, unknown>)[field] : undefined;
      if (typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,95}$/.test(value))
        return value;
    }
  }
  return fallback;
}
export function demoError(
  reason: string,
  status:
    'ABORTED' | 'FAILED_PRECONDITION' | 'NOT_FOUND' | 'UNAVAILABLE' = 'ABORTED',
): never {
  throw new ApiError({
    status,
    domain: 'demoData',
    reason,
    message: 'The demo data operation could not be completed.',
  });
}
