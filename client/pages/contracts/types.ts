import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
export interface Person {
  id: string;
  name: string;
}
export interface Proposal {
  contractType: string;
  counterparty:
    | { kind: 'vendor'; id: string; name: string; category: string }
    | { kind: 'customer'; name: string };
  amountCents: number;
  startsOn: string;
  endsOn: string;
  paymentTerms: string;
  standardTemplate: boolean;
  textVersionId: string | null;
  attachments: string[];
  reason: string;
}
export type Operation = 'new' | 'change' | 'renew' | 'terminate';
export interface ContractRecord extends Proposal {
  id: string;
  applicantId: string;
  creatorId: string;
  applicant: Person;
  creator: Person;
  departmentId: string;
  number: string | null;
  operation: Operation;
  contractId: string;
  baseVersion: number;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
  nonStandard: boolean | null;
}
export interface ContractDetail {
  record: ContractRecord;
  knownUsers: Person[];
  view: RecordView;
  runs: RunView[];
  actions: TaskActions[];
  runActions: RunActions[];
  timeline: ApprovalTimeline;
  upcoming: UpcomingStage[];
  timeZone: string;
}
export interface LedgerContract {
  id: string;
  number: string | null;
  requestId: string;
  applicantId: string;
  departmentId: string;
  version: number;
  status: string;
  amountCents: number;
  paidCents: number;
  heldCents: number;
  availableCents: number;
  facts: Omit<Proposal, 'amountCents' | 'reason'>;
  updatedAt?: string;
}
export interface LedgerVersion {
  id: string;
  contractId?: string;
  requestId?: string;
  version?: number;
  amountCents?: number;
  facts?: LedgerContract['facts'];
  actor?: Person;
  at?: string;
  status?: string;
}
export interface LedgerDetail {
  contract: LedgerContract;
  versions: LedgerVersion[];
  timeZone?: string;
  applicant: Person;
}
export interface Options {
  eligible?: boolean;
  applicant: Person;
  department: { id: string; name: string } | null;
  timeZone: string;
  contractTypes: {
    code: string;
    label: Record<string, string>;
    active: boolean;
  }[];
  vendors: { id: string; name: string; category: string }[];
  contracts: Pick<
    LedgerContract,
    'id' | 'number' | 'version' | 'amountCents' | 'status'
  >[];
}
export interface Page<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; timeZone?: string };
}
export interface SourceContext {
  reload: () => void;
  focusList?: () => void;
}
export interface DetailContext extends SourceContext {
  detail: ContractDetail;
  apply: (detail: ContractDetail) => void;
}
export const STATUSES = [
  'draft',
  'revision',
  'head',
  'legalFinance',
  'standardFinance',
  'executive',
  'gm',
  'approved',
  'rejected',
  'withdrawn',
  'terminated',
] as const;
export const PROPOSAL_FIELDS = [
  'contractType',
  'counterparty',
  'amountCents',
  'startsOn',
  'endsOn',
  'paymentTerms',
  'standardTemplate',
  'textVersionId',
  'attachments',
  'reason',
] as const;
export function completeRecord(
  record: Partial<ContractRecord>,
): record is ContractRecord {
  return [
    ...PROPOSAL_FIELDS,
    'operation',
    'contractId',
    'baseVersion',
    'lifecycleVersion',
  ].every((key) => Object.hasOwn(record, key));
}
export function proposalOf(record: Proposal): Proposal {
  return Object.fromEntries(
    PROPOSAL_FIELDS.map((k) => [k, structuredClone(record[k])]),
  ) as unknown as Proposal;
}
export const EMPTY: Proposal = {
  contractType: '',
  counterparty: { kind: 'customer', name: '' },
  amountCents: 0,
  startsOn: '',
  endsOn: '',
  paymentTerms: '',
  standardTemplate: true,
  textVersionId: null,
  attachments: [],
  reason: '',
};
