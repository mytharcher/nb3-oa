/** What a workbook holds; the server's `ImportKind` (`server/providers/import/constants.ts`). */
export const IMPORT_KINDS = [
  'departments',
  'positions',
  'grades',
  'employees',
  'dutyRoleMembers',
] as const;
export type ImportKind = (typeof IMPORT_KINDS)[number];

/** The settings item gating the page (`read`) and its writes (`update`). */
export const IMPORT_SETTINGS = 'oa.import';

/** Largest workbook the server accepts. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** The problem codes the server reports (`server/providers/import/types.ts`), each translated under `import.errors.`. */
export const PROBLEM_CODES = [
  'FILE_UNREADABLE',
  'SHEET_EMPTY',
  'TOO_MANY_ROWS',
  'HEADER_MISSING',
  'HEADER_DUPLICATE',
  'REQUIRED',
  'INVALID_CODE',
  'TOO_LONG',
  'INVALID_INTEGER',
  'INVALID_BOOLEAN',
  'INVALID_DATE',
  'INVALID_STATUS',
  'INVALID_EMAIL',
  'DUPLICATE_IN_FILE',
  'USER_NOT_FOUND',
  'USER_DISABLED',
  'USER_TAKEN',
  'USER_MISMATCH',
  'PARENT_NOT_FOUND',
  'PARENT_CYCLE',
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
  'WRITE_FAILED',
] as const;

export interface ImportRowError {
  /** Excel row number; `null` for the whole file. */
  readonly row: number | null;
  readonly column: string | null;
  /** The template's (Chinese) header of the column. */
  readonly header: string | null;
  readonly code: string;
  readonly value?: string;
  readonly params?: Readonly<Record<string, string | number>>;
}

interface ImportCounts {
  readonly rowCount: number;
  readonly createdCount: number;
  readonly updatedCount: number;
  readonly unchangedCount: number;
  readonly errorCount: number;
}

/** `POST /imports/preview`: what the file would do. */
export interface ImportReport extends ImportCounts {
  readonly kind: ImportKind;
  readonly result: 'ok' | 'invalid';
  readonly errors: readonly ImportRowError[];
}

export interface ImportRun extends ImportCounts {
  readonly id: string;
  readonly kind: ImportKind;
  readonly status: 'succeeded' | 'failed';
  readonly filename: string;
  readonly file: {
    readonly id: string;
    readonly size: number;
    readonly contentUrl: string;
  } | null;
  readonly actor: { readonly id: string; readonly name: string } | null;
  readonly createdAt: string;
  readonly finishedAt: string;
}

/** `GET /imports/:runId` and `POST /imports`. */
export interface ImportRunDetail extends ImportRun {
  readonly errors: readonly ImportRowError[];
}

export interface PageMeta {
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** What the list page hands its child routes. */
export interface ImportOutletContext {
  /** Reloads the history after an import. */
  readonly reload: () => void;
}
