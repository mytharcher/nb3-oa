export interface Person {
  id: string;
  name: string;
}
export interface SealRequest {
  id: string;
  applicantId: string;
  applicant: Person;
  createdBy: Person;
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
  status: string;
  lifecycleVersion: number;
  sealId: string | null;
  actualCopies: number | null;
  sealedAt: string | null;
  borrowedAt: string | null;
  returnedAt: string | null;
  ledgerId: string | null;
  exceptionReason: string | null;
  administrativeReason: string | null;
  createdAt: string;
}
export interface Detail {
  relatedNames?: {
    contractName: string | null;
    sealName: string | null;
    registrationSourceNumber: string | null;
  };
  record: SealRequest;
  tasks: {
    id: string;
    runId: string;
    status: string;
    assignee?: Person | null;
  }[];
  runs: { id: string; status: string; contentHash: string }[];
  actions: { id: string; name: string; actor: Person; createdAt: string }[];
}
export interface Capabilities {
  timeZone: string;
  transitions: string[];
  taskActions: {
    taskId: string;
    runId: string;
    contentHash: string;
    actions: {
      name: string;
      options?: Record<string, unknown>;
      primary?: boolean;
      tone?: string;
    }[];
  }[];
  canActualReturn: boolean;
}
export interface Options {
  timeZone: string;
  actorId: string;
  sealTypes: { code: string; label: Record<string, string> }[];
  contracts: { id: string; number: string | null }[];
}
export interface Ledger {
  id: string;
  requestNumber?: string | null;
  sealName?: string | null;
  requestId: string;
  sealId: string;
  applicant: Person;
  registeredBy: Person;
  approvedCopies: number;
  actualCopies: number | null;
  external: boolean;
  borrowedAt: string | null;
  sealedAt: string | null;
  registeredAt: string;
  contractId: string | null;
  contractVersion: number | null;
}
export interface Source {
  reload: () => void;
}
export const STATES = [
  'draft',
  'revision',
  'head',
  'legal',
  'financeManager',
  'gm',
  'stamping',
  'returning',
  'exception',
  'returnException',
  'completed',
  'administrativelyClosed',
  'rejected',
  'withdrawn',
  'terminated',
];
export const SUPPORTED_ACTIONS = [
  'approve',
  'reject',
  'return',
  'comment',
  'read',
  'claim',
  'release',
  'complete',
  'unable',
  'transfer',
  'assign',
  'cc',
  'addSigner',
  'urge',
  'appoint',
  'reassign',
];

/** Unknown SDK input contracts stay unavailable in this narrow owner form. */
export function supportedAction(action: {
  name: string;
  options?: Record<string, unknown>;
}) {
  if (
    !SUPPORTED_ACTIONS.includes(action.name) ||
    ['appoint', 'reassign'].includes(action.name)
  )
    return false;
  if (action.name === 'return')
    return (
      Array.isArray(action.options?.targets) &&
      action.options.targets.includes('revision')
    );
  if (action.name === 'addSigner')
    return (
      Array.isArray(action.options?.modes) &&
      action.options.modes.includes('before')
    );
  return true;
}

export interface LedgerDetail {
  timeZone: string;
  record: Ledger;
  request: { id: string; number: string | null; status: string };
  receipt: {
    id: string;
    actualCopies: number;
    sealedAt: string;
    returnedAt: string;
    confirmedBy: Person;
    contractConfirmation: string;
    reason: string;
  } | null;
  printable: boolean;
}

export interface SealFile {
  id: string;
  filename: string;
  ext: string;
  mimeType: string;
  size: number;
}
