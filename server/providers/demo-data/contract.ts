import { createServiceToken } from '@nocobase/service-provider';
import type { RepositoryRecord } from '@nocobase/db';
import type { ScenarioResult } from '../../../cli/commands/lib/trial-data/engine.js';
export const DEMO_SETTINGS = 'oa.demoData';
export type DemoLocale = 'zh-CN' | 'en-US';
export type DemoState =
  | 'absent'
  | 'importing'
  | 'ready'
  | 'importFailed'
  | 'removing'
  | 'removeFailed';
export interface DemoAccount {
  role: string;
  id: string;
  name: string;
  email: string;
  username: string;
}
export interface DemoDataSet extends RepositoryRecord {
  id: string;
  locale: DemoLocale;
  baseDate: string;
  timeZone: string;
  state: DemoState;
  version: number;
  actorId: string;
  accounts: DemoAccount[];
  totalSteps: number;
  scenarios: Record<string, ScenarioResult>;
  failures: { key: string; reason: string; module?: string }[];
  credentials: string | null;
  progress: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface DemoStatus {
  datasetId?: string;
  locale?: DemoLocale;
  baseDate?: string;
  timeZone: string;
  state: DemoState;
  version: number;
  completedSteps: number;
  totalSteps: number;
  importedAt?: string;
  stage?:
    | 'preparing'
    | 'generating'
    | 'validating'
    | 'removing'
    | 'complete'
    | 'failed';
  moduleCoverage: { key: string; count: number }[];
  safeFailures: { key: string; reason: string; module?: string }[];
  accounts: DemoAccount[];
}
export interface DemoPreview {
  previewToken: string;
  records: number;
  accounts: number;
  blocked: boolean;
  version: number;
}
export interface DemoDataService {
  status(): Promise<DemoStatus>;
  useSamplePasswords(): Promise<void>;
  presence(): Promise<{ present: boolean; busy: boolean }>;
  import(
    input: { locale: DemoLocale; expectedVersion: number; requestKey: string },
    actorId: string,
  ): Promise<DemoStatus & { operationId: string }>;
  preview(input: {
    datasetId: string;
    expectedVersion: number;
  }): Promise<DemoPreview>;
  remove(
    input: {
      datasetId: string;
      expectedVersion: number;
      previewToken: string;
      requestKey: string;
    },
    actorId: string,
  ): Promise<DemoStatus & { operationId: string }>;
  credentials(
    datasetId: string,
    expectedVersion: number,
  ): Promise<{ accounts: (DemoAccount & { password: string })[] }>;
  resume(): Promise<void>;
  idle(): Promise<void>;
}
export const demoDataServiceToken =
  createServiceToken<DemoDataService>('oa/demo-data');
