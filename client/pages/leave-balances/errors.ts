import { ApiClientError } from '@nocobase/app-client';
export function balanceErrorKey(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.reason === 'LEAVE_BALANCE_INSUFFICIENT') return 'insufficient';
    if (error.status === 403) return 'forbidden';
    if (error.status === 404) return 'notFound';
    if (error.status === 400 || error.status === 422) return 'invalid';
  }
  return 'failed';
}
