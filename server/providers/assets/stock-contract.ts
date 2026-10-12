import type { DatabaseConnection } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import type { Asset } from './contract.js';
export interface AssetStockIntent {
  sourceId: string;
  employeeId: string;
  operation: 'use' | 'borrow' | 'scrap';
  quantity: number;
  category: string | null;
  assetIds: string[];
  borrowDueDate: string | null;
  administrativeScrap: boolean;
}
export type StockPhase = 'reserve' | 'release' | 'issue' | 'return' | 'scrap';
export interface AssetStockSource {
  intent(
    sourceId: string,
    actorId: string,
    phase: StockPhase,
    tx: DatabaseConnection,
  ): Promise<AssetStockIntent>;
}
export const assetStockSourceToken = createServiceToken<AssetStockSource>(
  'oa/asset-stock-source',
);
export type AssetSnapshot = Pick<
  Asset,
  | 'id'
  | 'code'
  | 'category'
  | 'serialNumber'
  | 'status'
  | 'holderEmployeeId'
  | 'version'
  | 'originalValueCents'
>;
export interface StockCommand {
  sourceId: string;
  actorId: string;
  reason: string;
  requestKey: string;
}
export interface AssetUnit {
  assetId: string;
  serialNumber: string;
}
export interface AssetStockService {
  /** Advisory public source-picker read: no reservation identities or values are returned. */
  unreservedIds(
    ids: readonly string[],
    tx: DatabaseConnection,
  ): Promise<string[]>;
  /** Caller locks its source first. Holds the actual asset row locks without changing their baseline versions. */
  reservationCurrent(
    sourceId: string,
    tx: DatabaseConnection,
  ): Promise<boolean>;
  reserve(
    command: StockCommand,
    tx: DatabaseConnection,
  ): Promise<AssetSnapshot[]>;
  release(command: StockCommand, tx: DatabaseConnection): Promise<void>;
  issue(
    command: StockCommand & { units: AssetUnit[] },
    tx: DatabaseConnection,
  ): Promise<void>;
  returnIssued(
    command: StockCommand & { units: AssetUnit[] },
    tx: DatabaseConnection,
  ): Promise<void>;
  scrap(command: StockCommand, tx: DatabaseConnection): Promise<void>;
  stockFacts(
    sourceId: string,
    tx: DatabaseConnection,
  ): Promise<{
    held: AssetSnapshot[];
    issued: AssetSnapshot[];
    returned: AssetSnapshot[];
    disposed: AssetSnapshot[];
  }>;
}
