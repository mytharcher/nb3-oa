import { ApiClientError } from '@nocobase/app-client';

/** The HTTP status of a failed request, or 0 for a network failure. */
export function statusOf(error: unknown): number {
  return error instanceof ApiClientError ? error.status : 0;
}

/** The server's `reason`, for branching on a specific failure. */
export function reasonOf(error: unknown): string | undefined {
  return error instanceof ApiClientError ? error.reason : undefined;
}

/** The fields the server named in `fieldViolations` of a 400. */
export function fieldViolationsOf(error: unknown): string[] {
  if (!(error instanceof ApiClientError)) return [];
  const payload = error.payload as
    { error?: { fieldViolations?: { field?: string }[] } } | undefined;
  return (payload?.error?.fieldViolations ?? [])
    .map((violation) => violation.field)
    .filter((field): field is string => typeof field === 'string');
}
