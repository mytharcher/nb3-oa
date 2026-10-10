import { ApiClientError } from '@nocobase/app-client';

/** The HTTP status of a failed request, or 0 for a network failure. */
export function statusOf(error: unknown): number {
  return error instanceof ApiClientError ? error.status : 0;
}
