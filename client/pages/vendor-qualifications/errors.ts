import { ApiClientError } from '@nocobase/app-client';
export function finalRefusal(error: unknown) {
  return (
    error instanceof ApiClientError && [401, 403, 404].includes(error.status)
  );
}
