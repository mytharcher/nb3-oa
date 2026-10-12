import { createServiceToken } from '@nocobase/service-provider';
import type { RepositoryPolicy } from '@nocobase/db';
export const PRINT_SOURCES = [
  'leave',
  'reimbursement',
  'payment',
  'contracts',
  'sealRegistration',
  'certificates',
] as const;
export type PrintSourceName = (typeof PRINT_SOURCES)[number];
export interface PrintTemplate {
  id: string;
  name: string;
  source: PrintSourceName;
  active: boolean;
  currentRevisionId: string | null;
  version: number;
  createdById: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
export interface PrintRevision {
  id: string;
  templateId: string;
  number: number;
  fileId: string;
  contentHash: string;
  paths: string[];
  schemaVersion: number;
  createdById: string;
  createdAt: Date | string;
}
export interface PrintDataSource {
  name: PrintSourceName;
  schemaVersion: number;
  collection: string;
  viewResource: string;
  /** Public DTO field paths mapped to their policy-governed business fields; arrays use []. */
  fields: Readonly<Record<string, readonly string[]>>;
  /** Public source loader. It must enforce record policy before loading any private field. */
  load(input: {
    recordId: string;
    actorId: string;
    policy: RepositoryPolicy;
    paths: readonly string[];
    locale: 'zh-CN' | 'en-US';
    timeZone: string;
  }): Promise<Record<string, unknown>>;
}
export interface PrintSourceRegistry {
  add(source: PrintDataSource): void;
  get(name: PrintSourceName): PrintDataSource | undefined;
}
export const printSourceRegistryToken = createServiceToken<PrintSourceRegistry>(
  'oa/template-print-sources',
);
export function createPrintSourceRegistry(): PrintSourceRegistry {
  const sources = new Map<PrintSourceName, PrintDataSource>();
  return {
    add(source) {
      if (sources.has(source.name)) throw new Error('Duplicate print source');
      sources.set(source.name, Object.freeze(source));
    },
    get(name) {
      return sources.get(name);
    },
  };
}
export const templatePrintServiceToken = createServiceToken<
  import('./service.js').TemplatePrintService
>('oa/template-print-service');
