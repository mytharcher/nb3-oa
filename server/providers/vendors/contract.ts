import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
export const VENDOR_BANK_FIELDS = [
  'bankName',
  'bankAccount',
  'bankAccountName',
] as const;
export const VENDOR_BASIC_FIELDS = [
  'id',
  'code',
  'name',
  'category',
  'contactName',
  'contactPhone',
  'contactEmail',
  'status',
  'active',
  'version',
  'createdById',
  'createdAt',
  'updatedAt',
] as const;
export interface Vendor {
  id: string;
  code: string;
  name: string;
  category: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  status: 'manual' | 'qualified' | 'disabled';
  qualificationExpiry: string | null;
  qualificationId: string | null;
  active: boolean;
  version: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
export type VendorInput = Pick<
  Vendor,
  | 'code'
  | 'name'
  | 'category'
  | 'contactName'
  | 'contactPhone'
  | 'contactEmail'
  | 'bankName'
  | 'bankAccount'
  | 'bankAccountName'
>;
export interface VendorQuery {
  search?: string;
  active?: boolean;
  page: number;
  pageSize: number;
  sort: 'name' | 'code' | 'updatedAt';
  direction: 'asc' | 'desc';
}
export interface VendorService {
  get(
    id: string,
    connection?: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Partial<Vendor> | null>;
  /** Trusted business options omit contacts and bank data. The owning business checks its own grants. */
  options(
    connection?: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Pick<Vendor, 'id' | 'name' | 'category' | 'active' | 'status'>[]>;
  list(
    query: VendorQuery,
    policy: RepositoryPolicy,
    connection?: DatabaseConnection,
  ): Promise<{
    data: Partial<Vendor>[];
    meta: { page: number; pageSize: number; total: number };
  }>;
  create(
    input: VendorInput & { actorId: string; reason: string },
    connection: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Vendor>;
  update(
    id: string,
    input: Partial<VendorInput> & {
      actorId: string;
      reason: string;
      version: number;
      active?: boolean;
    },
    connection: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Vendor>;
  /** Qualification lifecycle owns authorization and joins the caller transaction. No bank fields escape this source. */
  qualificationSource(
    id: string,
    connection: DatabaseConnection,
  ): Promise<Pick<
    Vendor,
    | 'id'
    | 'version'
    | 'name'
    | 'category'
    | 'status'
    | 'active'
    | 'contactName'
    | 'contactPhone'
    | 'contactEmail'
    | 'qualificationExpiry'
    | 'qualificationId'
  > | null>;
  applyQualification(
    input: {
      vendorId: string;
      expectedVersion: number;
      qualificationId: string;
      actorId: string;
      reason: string;
      outcome: 'qualified' | 'removed';
      qualificationExpiry: string | null;
      account?: Pick<
        VendorInput,
        'bankName' | 'bankAccount' | 'bankAccountName'
      >;
      proposal?: Pick<
        VendorInput,
        'name' | 'category' | 'contactName' | 'contactPhone' | 'contactEmail'
      >;
    },
    connection: DatabaseConnection,
  ): Promise<void>;
  /** Trusted source hooks only: caller already authorized its purchase/payment document in this transaction. */
  snapshotForPurchase(
    id: string,
    connection: DatabaseConnection,
  ): Promise<Pick<Vendor, 'id' | 'code' | 'name' | 'category'>>;
  /** Contracts require a qualified source, locked and checked in their caller transaction. */
  snapshotForContract(
    id: string,
    connection: DatabaseConnection,
  ): Promise<Pick<Vendor, 'id' | 'code' | 'name' | 'category'>>;
  paymentAccountOf(
    id: string,
    connection: DatabaseConnection,
  ): Promise<
    Pick<Vendor, 'id' | 'name' | 'bankName' | 'bankAccount' | 'bankAccountName'>
  >;
}
export const vendorServiceToken =
  createServiceToken<VendorService>('oa/vendors');

/** Public domain failures shared by trusted callers and the vendor HTTP facade. */
export class VendorError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind: 'invalid' | 'notFound' | 'conflict' = 'invalid',
  ) {
    super(message);
    this.name = 'VendorError';
  }
}
