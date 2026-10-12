import { ApiClientError } from '@nocobase/app-client';
export function errorKey(error: unknown) {
  if (!(error instanceof ApiClientError)) return 'failed';
  if (error.reason === 'TIME_CONFLICT') return 'ROOM_CONFLICT';
  return error.status === 403
    ? 'forbidden'
    : error.status === 404
      ? 'missing'
      : error.reason &&
          [
            'ROOM_CONFLICT',
            'VERSION_CONFLICT',
            'INVALID_INTERVAL',
            'CAPACITY_EXCEEDED',
            'ROOM_INACTIVE',
            'INVALID_PARTICIPANT',
            'INVALID_STATE',
            'REASON_REQUIRED',
            'INVALID_SERIES',
            'SORT_LIMIT_EXCEEDED',
            'AMBIGUOUS_LOCAL_TIME',
            'NONEXISTENT_LOCAL_TIME',
          ].includes(error.reason)
        ? error.reason
        : 'failed';
}
