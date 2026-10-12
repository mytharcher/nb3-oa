export const RESOURCE = 'oa.certificateRequests';
export const STATES = [
  'draft',
  'revision',
  'head',
  'issuing',
  'issued',
  'rejected',
  'withdrawn',
  'terminated',
  'issueException',
  'administrativelyClosed',
] as const;
export const TYPES = ['employment', 'income', 'other'] as const;
export const DELIVERY = ['pickup', 'mail', 'digital'] as const;
export interface Certificate {
  id: string;
  number?: string | null;
  applicant: { id: string; name: string };
  certificateType: string;
  purpose: string;
  copies: number;
  deliveryMethod: string;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
  preparationId: string | null;
  issueId: string | null;
  exceptionReason: string | null;
}
export interface Offer {
  taskId: string;
  runId: string;
  contentHash: string;
  actions: {
    name: string;
    options?: Record<string, unknown>;
    primary: boolean;
    tone: string;
  }[];
}
export interface Preparation {
  id: string;
  number: string;
  issueDate: string;
  status: string;
  templateId: string;
  revisionId: string;
}
export interface Detail {
  record: Certificate;
  tasks: {
    id: string;
    status: string;
    assignee: { id: string; name: string } | null;
  }[];
  actions: {
    id: string;
    action: string;
    actor: { id: string; name: string };
    createdAt: string;
  }[];
  capabilities: {
    taskActions: Offer[];
    transitions: string[];
    canIssue: boolean;
    canDownload: boolean;
    preparation: Preparation | null;
    issue: { id: string; number: string; issueDate: string } | null;
  };
}
export interface Context {
  reload: () => void;
}
export const selectWidth =
  'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal';
