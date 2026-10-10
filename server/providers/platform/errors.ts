/**
 * Domain errors of the platform module. Services throw them; the module's routes turn each code into an `ApiError`
 * (`server/routes/platform/errors.ts`), so no service decides an HTTP status.
 */
export type PlatformErrorCode =
  | 'RULE_UNKNOWN'
  | 'RULE_INVALID_VALUE'
  | 'RULE_EFFECTIVE_IN_PAST'
  | 'RULE_FUTURE_NOT_ALLOWED'
  | 'RULE_VERSION_EXISTS'
  | 'RULE_ORDER_VIOLATED'
  | 'RULE_VERSION_NOT_FOUND'
  | 'RULE_VERSION_IN_EFFECT'
  | 'DICTIONARY_TYPE_UNKNOWN'
  | 'DICTIONARY_ENTRY_NOT_FOUND'
  | 'DICTIONARY_CODE_EXISTS'
  | 'DICTIONARY_INVALID_EXTRA'
  | 'DICTIONARY_INVALID_LABEL'
  | 'CALENDAR_INVALID_DATE'
  | 'CALENDAR_DAY_NOT_FOUND'
  | 'CALENDAR_DATE_OUTSIDE_YEAR'
  | 'CALENDAR_DUPLICATE_DATE'
  | 'SEQUENCE_INVALID_PREFIX';

export class PlatformError extends Error {
  public readonly code: PlatformErrorCode;
  /** The input field the error is about, when there is one. */
  public readonly field?: string;
  public readonly metadata?: Record<string, string>;

  public constructor(
    code: PlatformErrorCode,
    message: string,
    options: { field?: string; metadata?: Record<string, string> } = {},
  ) {
    super(message);
    this.name = 'PlatformError';
    this.code = code;
    if (options.field) this.field = options.field;
    if (options.metadata) this.metadata = options.metadata;
  }
}
