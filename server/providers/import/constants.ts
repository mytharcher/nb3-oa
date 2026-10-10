/** The application's client namespace, where the titles below are translated (`client/locales/modules/import.*`). */
export const APP_NAMESPACE = 'nb3-oa';

/** The error domain of the import routes; the client translates each `reason`. */
export const IMPORT_DOMAIN = 'import';

/**
 * The settings item gating the import page and its endpoints: `read` lists the history, downloads templates and
 * retained files; `update` previews and runs imports. Granting `update` is granting write access to every department,
 * position, grade, employee archive and duty-role membership, because the import writes them as a trusted caller.
 */
export const IMPORT_SETTINGS = 'oa.import';

/** The workspace subsection the item is listed in: the organisation's (组织与人员), registered by the org module. */
export const IMPORT_AUTHZ_SECTION = 'oa.org';

export const IMPORT_KINDS = [
  'departments',
  'positions',
  'grades',
  'employees',
  'dutyRoleMembers',
] as const;
export type ImportKind = (typeof IMPORT_KINDS)[number];

/** Largest accepted workbook. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
/** Most data rows one import takes; a larger organisation imports in several files. */
export const MAX_ROWS = 5000;
/** Row errors a report returns and a failed run keeps; the count is always exact. */
export const MAX_REPORTED_ERRORS = 200;

/** A translation descriptor in the application's namespace; keys live under `import.` in the client locales. */
export function label(key: string): { key: string; ns: string } {
  return { key: `import.${key}`, ns: APP_NAMESPACE };
}
