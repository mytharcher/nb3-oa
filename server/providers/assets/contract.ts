import type { LegacyAssetReturn } from './legacy-return.js';
import type { AssetStockService } from './stock-contract.js';
export * from './stock-contract.js';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
export interface Asset {
  id: string;
  code: string;
  category: string;
  name: string;
  serialNumber: string | null;
  originalValueCents: number;
  status: 'available' | 'assigned' | 'borrowed' | 'scrapped';
  holderEmployeeId: string | null;
  borrowDueDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface AssetClearanceService {
  assertAllReturned(
    employeeId: string,
    connection: DatabaseConnection,
  ): Promise<void>;
}
export const assetClearanceServiceToken =
  createServiceToken<AssetClearanceService>('oa/asset-clearance-service');

export type AssetInput = Pick<
  Asset,
  'code' | 'category' | 'name' | 'serialNumber' | 'originalValueCents'
>;
export interface AssetService extends AssetClearanceService, AssetStockService {
  returnHeld(
    command: LegacyAssetReturn,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<{ receiptId: string }>;
  read(
    id: string,
    connection: DatabaseConnection,
    policy: RepositoryPolicy,
    holderEmployeeId?: string,
  ): Promise<Partial<Asset> | null>;
  list(
    query: { page: number; pageSize: number; holderEmployeeId?: string },
    connection: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<{ rows: Partial<Asset>[]; total: number }>;
  /** Trusted full facts for auditing/business transactions; HTTP responses must use read/list with the actual policy. */
  get(id: string, connection: DatabaseConnection): Promise<Asset | null>;
  /** Enforces any supplied mutation policy; the full returned fact is trusted and must be separately projected for HTTP. */
  create(
    input: AssetInput & { actorId: string; reason: string },
    connection: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Asset>;
  update(
    id: string,
    input: Partial<AssetInput> & {
      actorId: string;
      reason: string;
      version: number;
    },
    connection: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Asset>;
}
export const assetServiceToken =
  createServiceToken<AssetService>('oa/asset-service');

export interface OnboardingAssetCommand {
  taskId: string;
  actorId: string;
  requestKey: string;
  reason: string;
  units: { code: string; serialNumber: string }[];
}
export interface OnboardingAssetService {
  assertAccess(
    command: OnboardingAssetCommand,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<void>;
  issue(
    command: OnboardingAssetCommand,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<{ receiptId: string }>;
  recover(
    command: OnboardingAssetCommand,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<{ receiptId: string }>;
  hasOutstanding(taskId: string, tx: DatabaseConnection): Promise<boolean>;
}
export const onboardingAssetServiceToken =
  createServiceToken<OnboardingAssetService>('oa/onboarding-assets');
