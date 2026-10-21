import type {
  ApprovalService,
  PerformInput,
} from '@nocobase/app-plugin-approval/server';
import type { RepositoryPolicy } from '@nocobase/db';
import type { ContractRequest } from './types.js';
import type { DatabaseConnection } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';

export interface ContractFacts {
  contractType: string;
  counterparty:
    | { kind: 'vendor'; id: string; name: string; category: string }
    | { kind: 'customer'; name: string };
  startsOn: string;
  endsOn: string;
  paymentTerms: string;
  standardTemplate: boolean;
  textVersionId: string;
  attachments: string[];
}
export interface ContractSource {
  id: string;
  number: string | null;
  requestId: string;
  applicantId: string;
  departmentId: string;
  version: number;
  status: 'underApproval' | 'activePendingSeal' | 'active' | 'terminated';
  amountCents: number;
  paidCents: number;
  heldCents: number;
  availableCents: number;
  facts: ContractFacts;
}
export interface ContractCommand {
  actorId: string;
  requestKey: string;
  reason: string;
  now?: Date;
}
export interface ContractReservation {
  id: string;
  contractId: string;
  reference: string;
  cents: number;
  state: 'held' | 'paid' | 'released';
  updatedAt: Date;
}
export interface ContractSealEvidence {
  contractId: string;
  contractVersion: number;
  sealRecordId: string;
  sealedAt: Date;
  status: 'completed';
}
/** The seal owner reads its actual immutable completion record in this same transaction. */
export type ContractSealVerifier = (
  connection: DatabaseConnection,
) => Promise<ContractSealEvidence | null>;
export interface ContractPaymentProof {
  contractId: string;
  reference: string;
  cents: number;
  contractVersion: number;
  approved: true;
  requiresFullApproval: boolean;
  completedFullApproval: boolean;
  sourceVersion: number;
  forced: boolean;
}
export interface ContractLedgerService {
  /** Optional display identities, scoped and restricted to id/number fields. */
  names(
    ids: readonly string[],
    policy: RepositoryPolicy | undefined,
    connection: DatabaseConnection,
  ): Promise<Map<string, string>>;
  /** Ordinary ledger scope plus required fields; returns an explicit DTO without text or banking. */
  listForPayment(
    actorId: string,
    policy: RepositoryPolicy,
    connection: DatabaseConnection,
  ): Promise<
    Array<
      Omit<ContractSource, 'facts'> & {
        counterparty: ContractFacts['counterparty'];
      }
    >
  >;
  /** Inflight excess stays held and requires this payment's full staircase at settlement. */
  reservePayment(
    input: ContractCommand & {
      contractId: string;
      reference: string;
      cents: number;
      expectedVersion: number;
    },
    connection: DatabaseConnection,
  ): Promise<ContractReservation & { requiresFullApproval: boolean }>;
  settlePayment(
    input: ContractCommand & {
      contractId: string;
      reference: string;
      expectedVersion: number;
    },
    verifier: (connection: DatabaseConnection) => Promise<ContractPaymentProof>,
    connection: DatabaseConnection,
  ): Promise<ContractReservation>;

  /** Current scoped identities for sealing; `facts` permission is required for its textVersionId only. No amount reads. */
  listForSeal(
    actorId: string,
    policy: RepositoryPolicy,
    connection: DatabaseConnection,
  ): Promise<
    Array<{
      id: string;
      number: string | null;
      version: number;
      textVersionId: string;
      status: 'active' | 'activePendingSeal';
    }>
  >;
  /** Call before locking a payment/request; canonical sorted IDs, caller transaction. */
  lockSources(
    ids: readonly string[],
    connection: DatabaseConnection,
  ): Promise<void>;
  source(
    id: string,
    connection: DatabaseConnection,
  ): Promise<ContractSource | null>;
  /** Caller locks the contract before seal/request writes and enforces the owning business HTTP policy. */
  confirmSealed(
    input: ContractCommand & {
      contractId: string;
      expectedVersion: number;
      sealRecordId: string;
    },
    verifier: ContractSealVerifier,
    connection: DatabaseConnection,
  ): Promise<ContractSource>;
  createCandidate(
    input: ContractCommand & {
      id: string;
      requestId: string;
      applicantId: string;
      departmentId: string;
      amountCents: number;
      facts: ContractFacts;
    },
    connection: DatabaseConnection,
  ): Promise<ContractSource>;
  discardCandidate(
    input: ContractCommand & { contractId: string; requestId: string },
    connection: DatabaseConnection,
  ): Promise<void>;
  publish(
    input: ContractCommand & {
      contractId: string;
      requestId: string;
      baseVersion: number;
      number: string;
      amountCents: number;
      facts: ContractFacts;
      terminate?: boolean;
      historical?: boolean;
    },
    connection: DatabaseConnection,
  ): Promise<ContractSource>;
  hold(
    input: ContractCommand & {
      contractId: string;
      reference: string;
      cents: number;
    },
    connection: DatabaseConnection,
  ): Promise<ContractReservation>;
  release(
    input: ContractCommand & { contractId: string; reference: string },
    connection: DatabaseConnection,
  ): Promise<ContractReservation>;
  settle(
    input: ContractCommand & { contractId: string; reference: string },
    connection: DatabaseConnection,
  ): Promise<ContractReservation>;
}
export const contractLedgerServiceToken =
  createServiceToken<ContractLedgerService>('oa/contract-ledger');

export interface ContractApprovalService {
  /** Authorized complete detail for explicit print DTOs; consumers precheck all required field policies. */
  printDetail(
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
  ): Promise<{
    record: ContractRequest;
    users: readonly { id: string; name: string }[];
    runs: Awaited<ReturnType<ApprovalService['runViewsFor']>>;
    timeline: Awaited<ReturnType<ApprovalService['timelineFor']>>;
  }>;
  approvals: Pick<ApprovalService, 'tasksOf' | 'runsFor' | 'actionsOf'>;
  action(
    id: string,
    actorId: string,
    input: Omit<PerformInput, 'actor'>,
    policy?: RepositoryPolicy,
  ): Promise<Awaited<ReturnType<ApprovalService['perform']>>>;
  listForCenter(
    actorId: string,
    view: 'all' | 'pending' | 'done' | 'copied',
    policy: RepositoryPolicy,
  ): Promise<ContractRequest[]>;
}
export const contractServiceToken = createServiceToken<ContractApprovalService>(
  'oa/contract-service',
);
