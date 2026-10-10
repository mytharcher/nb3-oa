import {
  ApiError,
  apiErrorHandler,
  type ApiErrorStatus,
} from '@nocobase/app-server/router';
import type { Context } from 'hono';

import {
  PlatformError,
  type PlatformErrorCode,
} from '../../providers/platform/errors.js';

/** The error domain of the application's own routes. */
export const APP_ERROR_DOMAIN = 'nb3-oa';

const STATUS: Readonly<Record<PlatformErrorCode, ApiErrorStatus>> = {
  RULE_UNKNOWN: 'NOT_FOUND',
  RULE_INVALID_VALUE: 'INVALID_ARGUMENT',
  RULE_EFFECTIVE_IN_PAST: 'INVALID_ARGUMENT',
  RULE_FUTURE_NOT_ALLOWED: 'INVALID_ARGUMENT',
  RULE_VERSION_EXISTS: 'ALREADY_EXISTS',
  RULE_ORDER_VIOLATED: 'FAILED_PRECONDITION',
  RULE_VERSION_NOT_FOUND: 'NOT_FOUND',
  RULE_VERSION_IN_EFFECT: 'FAILED_PRECONDITION',
  DICTIONARY_TYPE_UNKNOWN: 'NOT_FOUND',
  DICTIONARY_ENTRY_NOT_FOUND: 'NOT_FOUND',
  DICTIONARY_CODE_EXISTS: 'ALREADY_EXISTS',
  DICTIONARY_INVALID_EXTRA: 'INVALID_ARGUMENT',
  DICTIONARY_INVALID_LABEL: 'INVALID_ARGUMENT',
  CALENDAR_INVALID_DATE: 'INVALID_ARGUMENT',
  CALENDAR_DAY_NOT_FOUND: 'NOT_FOUND',
  CALENDAR_DATE_OUTSIDE_YEAR: 'INVALID_ARGUMENT',
  CALENDAR_DUPLICATE_DATE: 'INVALID_ARGUMENT',
  SEQUENCE_INVALID_PREFIX: 'INVALID_ARGUMENT',
};

export function toApiError(error: PlatformError): ApiError {
  return new ApiError({
    status: STATUS[error.code],
    reason: error.code,
    domain: APP_ERROR_DOMAIN,
    message: error.message,
    ...(error.field
      ? {
          fieldViolations: [{ field: error.field, description: error.message }],
        }
      : {}),
    ...(error.metadata ? { metadata: error.metadata } : {}),
    cause: error,
  });
}

/** `router.onError` of every platform router: domain errors become `ApiError`s, the rest goes to the framework. */
export function platformErrorHandler(
  error: Error,
  context: Context,
): Response | Promise<Response> {
  return apiErrorHandler(
    error instanceof PlatformError ? toApiError(error) : error,
    context,
  );
}
