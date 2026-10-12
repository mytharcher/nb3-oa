import type { LifecycleRecord } from '@nocobase/lifecycle';
import type { DatabaseConnection } from '@nocobase/db';
import type { OaApprovalDirectory } from '../approval-directory/contract.js';
import type { ContractFacts } from './contract.js';
export const CONTRACT_KIND = 'oa.contract';
export type ContractState =
  | 'draft'
  | 'revision'
  | 'head'
  | 'legalFinance'
  | 'standardFinance'
  | 'executive'
  | 'gm'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'terminated';
export interface ContractRequest extends LifecycleRecord {
  id: string;
  creatorId: string;
  applicantId: string;
  departmentId: string;
  number: string | null;
  operation: 'new' | 'change' | 'renew' | 'terminate';
  contractId: string;
  baseVersion: number;
  contractType: string;
  counterparty: ContractFacts['counterparty'];
  amountCents: number;
  startsOn: string;
  endsOn: string;
  paymentTerms: string;
  standardTemplate: boolean;
  textVersionId: string | null;
  attachments: string[];
  reason: string;
  ruleSnapshot: Record<string, number>;
  nonStandard: boolean | null;
  status: ContractState;
  lifecycleVersion: number;
  statusChangedAt: Date;
  createdAt: Date;
  submittedAt: Date | null;
}
export interface ContractServices {
  directory: OaApprovalDirectory;
  connection?: DatabaseConnection;
}
export interface ContractTypes {
  record: ContractRequest;
  state: ContractState;
  services: ContractServices;
}
export const freezeFields = [
  'operation',
  'contractId',
  'baseVersion',
  'contractType',
  'counterparty',
  'amountCents',
  'startsOn',
  'endsOn',
  'paymentTerms',
  'standardTemplate',
  'textVersionId',
  'attachments',
  'ruleSnapshot',
] as const;
