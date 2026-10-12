import { ApiClientError } from '@nocobase/app-client';
export function errorKey(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 403) return 'forbidden';
    if (error.status === 404) return 'missing';
    const code = error.reason;
    if (code === 'VEHICLE_INTERVAL_CONFLICT') return 'VEHICLE_CONFLICT';
    if (
      [
        'VEHICLE_CONFLICT',
        'VEHICLE_NO_CAPACITY',
        'VEHICLE_VERSION_CONFLICT',
        'VERSION_CONFLICT',
        'VEHICLE_DRIVER_INACTIVE',
        'VEHICLE_DRIVER_REQUIRED',
        'VEHICLE_EMPLOYEE_INACTIVE',
        'VEHICLE_FIELDS_RESTRICTED',
        'VEHICLE_INVALID_INPUT',
        'VEHICLE_INVALID_COST',
        'VEHICLE_REQUEST_REUSED',
        'VEHICLE_SORT_LIMIT',
        'STALE_CONTENT',
      ].includes(code ?? '')
    )
      return code;
  }
  return 'failed';
}
