export const RESOURCE = 'oa.templatePrint';
export const SOURCES = [
  'leave',
  'reimbursement',
  'payment',
  'contracts',
  'certificates',
  'sealRegistration',
] as const;
export const ALL_SOURCES = [...SOURCES] as const;
export type Source = (typeof ALL_SOURCES)[number];
export interface Template {
  id: string;
  name?: string;
  source?: Source;
  active?: boolean;
  currentRevisionId?: string | null;
  version?: number;
  createdBy?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}
export interface Revision {
  id: string;
  number: number;
  contentHash: string;
  paths: string[];
  schemaVersion: number;
  createdBy?: { id: string; name: string };
  createdAt: string;
}
export interface Detail {
  record: Template;
  revisions: Revision[];
  sourceReady: boolean;
}
export interface Page {
  data: Template[];
  meta: { total: number; page: number; pageSize: number };
}
export interface Context {
  reload?: () => void;
  onSaved?: (record: Template) => void;
}
export interface PrintContext {
  printRefresh?: () => void;
  printSource: (typeof SOURCES)[number];
  printRecordId: string;
  printRecordName: string;
}
export const supported = (
  source: unknown,
): source is (typeof SOURCES)[number] => SOURCES.some((s) => s === source);
export function writable(
  record?: Template,
): record is Template & { name: string; active: boolean; version: number } {
  return (
    !!record &&
    typeof record.name === 'string' &&
    typeof record.active === 'boolean' &&
    Number.isSafeInteger(record.version) &&
    record.version! > 0
  );
}
export const selectWidth =
  'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal';
