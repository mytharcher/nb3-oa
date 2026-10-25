import type { ImportKind } from './constants.js';

/**
 * Why a row (or the file) cannot be imported. The client translates each code under `import.errors.`, filling in
 * `value` and `params`.
 */
export const IMPORT_ERROR_CODES = [
  // The file
  'FILE_UNREADABLE',
  'SHEET_EMPTY',
  'TOO_MANY_ROWS',
  'HEADER_MISSING',
  'HEADER_DUPLICATE',
  // A cell
  'REQUIRED',
  'INVALID_CODE',
  'TOO_LONG',
  'INVALID_INTEGER',
  'INVALID_BOOLEAN',
  'INVALID_DATE',
  'CAREER_START_FUTURE',
  'CAREER_START_AFTER_HIRE',
  'INVALID_STATUS',
  'INVALID_EMAIL',
  'DUPLICATE_IN_FILE',
  // A reference
  'USER_NOT_FOUND',
  'USER_DISABLED',
  'USER_TAKEN',
  'USER_MISMATCH',
  'PARENT_NOT_FOUND',
  'PARENT_CYCLE',
  'EXECUTIVE_TOP_LEVEL_ONLY',
  'DEPARTMENT_NOT_FOUND',
  'DEPARTMENT_INACTIVE',
  'POSITION_NOT_FOUND',
  'POSITION_INACTIVE',
  'GRADE_NOT_FOUND',
  'GRADE_INACTIVE',
  'MANAGER_NOT_FOUND',
  'MANAGER_SELF',
  'MANAGER_INACTIVE',
  'MANAGER_CYCLE',
  'DUTY_ROLE_NOT_FOUND',
  'DUTY_ROLE_INACTIVE',
  // A write the services refused after validation passed; the whole import was rolled back.
  'WRITE_FAILED',
] as const;
export type ImportErrorCode = (typeof IMPORT_ERROR_CODES)[number];

export interface ImportRowError {
  /** Excel row number; `null` for a problem with the whole file. */
  readonly row: number | null;
  /** Column key; `null` when the problem is not about one cell. */
  readonly column: string | null;
  /** The template's header of that column, as the file names it. */
  readonly header: string | null;
  readonly code: ImportErrorCode;
  /** The offending cell text, when there is one. */
  readonly value?: string;
  /** Extra values for the message, such as the first row of a duplicate or the service's reason. */
  readonly params?: Readonly<Record<string, string | number>>;
}

export interface ImportCounts {
  /** Data rows read from the sheet. */
  readonly rowCount: number;
  readonly createdCount: number;
  readonly updatedCount: number;
  readonly unchangedCount: number;
  /** Every problem found, even beyond the reported ones. */
  readonly errorCount: number;
}

/** What checking (or running) a file found. */
export interface ImportReport extends ImportCounts {
  readonly kind: ImportKind;
  /** `ok` when the file can be (or was) imported as a whole; `invalid` when nothing is (or was) written. */
  readonly result: 'ok' | 'invalid';
  /** The first errors, in row order. */
  readonly errors: readonly ImportRowError[];
}

export type ImportRunStatus = 'succeeded' | 'failed';

/** One committed import attempt as the history lists it. */
export interface ImportRun extends ImportCounts {
  readonly id: string;
  readonly kind: ImportKind;
  readonly status: ImportRunStatus;
  readonly filename: string;
  /** The retained workbook; `null` only if it could not be stored. */
  readonly file: {
    readonly id: string;
    readonly size: number;
    readonly contentUrl: string;
  } | null;
  readonly actor: { readonly id: string; readonly name: string } | null;
  readonly createdAt: string;
  readonly finishedAt: string;
}

export interface ImportRunDetail extends ImportRun {
  /** The first errors of a failed run; empty for a successful one. */
  readonly errors: readonly ImportRowError[];
}
