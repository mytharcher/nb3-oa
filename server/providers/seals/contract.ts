import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type {
  LifecycleRecord,
  JsonObject,
  LifecycleRuntime,
} from '@nocobase/lifecycle';
import type {
  ApprovalService,
  PerformInput,
} from '@nocobase/app-plugin-approval/server';
export const SEAL_KIND = 'oa.sealRequest';
export type SealState =
  | 'draft'
  | 'revision'
  | 'head'
  | 'legal'
  | 'financeManager'
  | 'gm'
  | 'stamping'
  | 'returning'
  | 'exception'
  | 'returnException'
  | 'completed'
  | 'administrativelyClosed'
  | 'rejected'
  | 'withdrawn'
  | 'terminated';
export interface SealRequest extends LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  departmentId: string;
  number: string | null;
  contractId: string | null;
  contractVersion: number | null;
  contractTextVersionId: string | null;
  fileIds: string[];
  sealType: string;
  copies: number;
  external: boolean;
  returnDueAt: string | null;
  purpose: string;
  contact: string;
  approvedFingerprint: string | null;
  approvedAt: string | null;
  sealId: string | null;
  actualCopies: number | null;
  sealedAt: string | null;
  borrowedAt: string | null;
  returnedAt: string | null;
  ledgerId: string | null;
  exceptionReason: string | null;
  administrativeReason: string | null;
  ruleSnapshot: JsonObject;
  status: SealState;
  lifecycleVersion: number;
  createdAt: string;
  statusChangedAt: string;
  submittedAt: string | null;
}
export interface SealInstance {
  id: string;
  code: string;
  name: string;
  sealType: string;
  active: boolean;
  version: number;
}
export interface SealLedger {
  id: string;
  requestId: string;
  sealId: string;
  applicantId: string;
  departmentId: string;
  contractId: string | null;
  contractVersion: number | null;
  contractTextVersionId: string | null;
  approvedCopies: number;
  actualCopies: number | null;
  external: boolean;
  borrowedAt: string | null;
  sealedAt: string | null;
  registeredById: string;
  registeredAt: string;
}
export interface SealReceipt {
  id: string;
  ledgerId: string;
  requestId: string;
  sealId: string;
  returnedAt: string;
  actualCopies: number;
  sealedAt: string;
  confirmedById: string;
  contractConfirmation: 'confirmed' | 'notApplicable' | 'unconfirmed';
  reason: string;
}
export interface SealProof {
  contractId: string;
  contractVersion: number;
  sealRecordId: string;
  sealedAt: Date;
  status: 'completed';
}
/** Explicit actual stamping evidence. Request lifecycle status alone never produces this DTO. */
export interface SealPrintRegistration {
  number: string;
  applicant: { id: string; name: string };
  department: { id: string; name: string };
  seal: { id: string; type: string };
  approvedCopies: number;
  actualCopies: number;
  external: boolean;
  borrowedAt: string | null;
  sealedAt: string;
  returnedAt: string | null;
  registeredAt: string;
  registeredBy: { id: string; name: string };
  confirmedBy: { id: string; name: string } | null;
}
export interface SealRegistrationAccess {
  seals?: RepositoryPolicy;
  ledger: RepositoryPolicy;
  receipts: RepositoryPolicy;
  requests: RepositoryPolicy;
}
export interface SealRequestInput {
  contractId: string | null;
  fileIds: string[];
  sealType: string;
  copies: number;
  external: boolean;
  returnDueAt: string | null;
  purpose: string;
  contact: string;
}
export interface SealAccess {
  requests: RepositoryPolicy;
  view?: RepositoryPolicy;
  contract?: RepositoryPolicy;
}
export interface SealLedgerDetail {
  record: SealLedger & {
    requestNumber?: string | null;
    sealName?: string | null;
    applicant: { id: string; name: string };
    registeredBy: { id: string; name: string };
  };
  request: { id: string; number: string | null; status: string };
  receipt: (SealReceipt & { confirmedBy: { id: string; name: string } }) | null;
  printable: boolean;
}
export interface SealService {
  instanceNames(
    ids: readonly string[],
    connection: DatabaseConnection,
    policy: RepositoryPolicy | undefined,
  ): Promise<Map<string, string>>;
  ledgerDetail(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    access: SealRegistrationAccess,
  ): Promise<SealLedgerDetail>;
  ledgerPage(
    actorId: string,
    tx: DatabaseConnection,
    access: SealRegistrationAccess,
    query: {
      page: number;
      pageSize: number;
      sort?: 'registeredAt' | 'borrowedAt' | 'sealedAt';
      direction?: 'asc' | 'desc';
    },
  ): Promise<{
    data: SealLedgerDetail['record'][];
    meta: { total: number; page: number; pageSize: number };
  }>;
  printRegistration(
    ledgerId: string,
    actorId: string,
    tx: DatabaseConnection,
    access: SealRegistrationAccess,
  ): Promise<SealPrintRegistration>;
  saveInstance(
    input: {
      actorId: string;
      requestKey: string;
      id?: string;
      expectedVersion?: number;
      code: string;
      name: string;
      sealType: string;
      active: boolean;
      reason: string;
    },
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<SealInstance>;
  listInstances(
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<SealInstance[]>;
  listLedger(
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<SealLedger[]>;
  proof(sealRecordId: string, tx: DatabaseConnection): Promise<SealProof>;
  outstandingFor(
    userId: string,
    tx: DatabaseConnection,
  ): Promise<
    ReadonlyArray<{ ledgerId: string; sealId: string; requestId: string }>
  >;
}
export interface SealRequestService {
  readonly approvalDefinition: import('@nocobase/app-plugin-approval/server').Approval<never>;
  runtime: LifecycleRuntime;
  /** Read-only transition previews within the trusted directory context. Writes revalidate. */
  transitions(
    id: string,
    actorId: string,
    access: SealAccess,
  ): Promise<string[]>;
  approvals: Pick<
    ApprovalService,
    'tasksOf' | 'runsFor' | 'actionsOf' | 'runViewsFor' | 'actionsFor'
  >;
  create(
    actorId: string,
    input: SealRequestInput,
    requestKey: string,
    access: SealAccess,
  ): Promise<SealRequest>;
  change(
    id: string,
    actorId: string,
    transition:
      'edit' | 'submit' | 'withdraw' | 'terminate' | 'retry' | 'forceComplete',
    input: JsonObject,
    requestKey: string,
    expectedVersion: number,
    access: SealAccess,
  ): Promise<SealRequest>;
  perform(
    id: string,
    actorId: string,
    input: Omit<PerformInput, 'actor'>,
    access: SealAccess,
  ): Promise<Awaited<ReturnType<ApprovalService['perform']>>>;
  detail(
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
  ): Promise<{
    record: SealRequest;
    tasks: Awaited<ReturnType<ApprovalService['tasksOf']>>;
    runs: Awaited<ReturnType<ApprovalService['runsFor']>>;
    actions: Awaited<ReturnType<ApprovalService['actionsOf']>>;
  }>;
  listForCenter(
    actorId: string,
    view: 'mine' | 'pending' | 'done' | 'copied',
    policy: RepositoryPolicy,
  ): Promise<
    Array<SealRequest & { applicant: { id: string; name: string } | null }>
  >;
  list(actorId: string, policy: RepositoryPolicy): Promise<SealRequest[]>;
  upload(
    actorId: string,
    requestId: string,
    file: File,
    requestKey: string,
    policy: RepositoryPolicy,
  ): Promise<{
    id: string;
    filename: string;
    ext: string;
    mimeType: string;
    size: number;
  }>;
  files(
    actorId: string,
    requestId: string,
    policy: RepositoryPolicy,
  ): Promise<
    {
      id: string;
      filename: string;
      ext: string;
      mimeType: string;
      size: number;
    }[]
  >;
  content(
    actorId: string,
    requestId: string,
    fileId: string,
    policy: RepositoryPolicy,
  ): Promise<{ bytes: Buffer; filename: string; mimeType: string }>;
  actualReturn(
    id: string,
    actorId: string,
    input: {
      requestKey: string;
      expectedVersion: number;
      actualCopies: number;
      sealedAt: string;
      returnedAt: string;
      reason: string;
    },
    access: SealAccess,
  ): Promise<SealReceipt>;
  sweep(): Promise<unknown>;
  remindOverdue(now?: Date): Promise<{ checked: number; notified: number }>;
}
export const SEAL_REQUEST_FIELDS = [
  'id',
  'applicantId',
  'createdById',
  'departmentId',
  'number',
  'contractId',
  'contractVersion',
  'contractTextVersionId',
  'fileIds',
  'sealType',
  'copies',
  'external',
  'returnDueAt',
  'purpose',
  'contact',
  'approvedFingerprint',
  'approvedAt',
  'sealId',
  'actualCopies',
  'sealedAt',
  'borrowedAt',
  'returnedAt',
  'ledgerId',
  'exceptionReason',
  'administrativeReason',
  'ruleSnapshot',
  'status',
  'lifecycleVersion',
  'createdAt',
  'statusChangedAt',
  'submittedAt',
] as const;
export const SEAL_LEDGER_FIELDS = [
  'id',
  'requestId',
  'sealId',
  'applicantId',
  'departmentId',
  'contractId',
  'contractVersion',
  'contractTextVersionId',
  'approvedCopies',
  'actualCopies',
  'external',
  'borrowedAt',
  'sealedAt',
  'registeredById',
  'registeredAt',
] as const;
export const sealServiceToken =
  createServiceToken<SealService>('oa/seal-service');
export const sealRequestServiceToken = createServiceToken<SealRequestService>(
  'oa/seal-request-service',
);

export const SEAL_PRINT_REQUEST_FIELDS = [
  'id',
  'number',
  'applicantId',
  'departmentId',
  'sealType',
  'copies',
  'ledgerId',
  'status',
] as const;
export const SEAL_PRINT_RECEIPT_FIELDS = [
  'id',
  'ledgerId',
  'requestId',
  'sealId',
  'returnedAt',
  'actualCopies',
  'sealedAt',
  'confirmedById',
  'contractConfirmation',
] as const;
