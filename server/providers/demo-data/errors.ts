import { ApiError } from '@nocobase/app-server/router';
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
