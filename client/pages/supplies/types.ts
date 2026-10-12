import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
import type { Person } from '../approvals/types.js';
export interface SupplyRecord {
  id: string;
  applicantId: string;
  applicant?: Person | null;
  createdById: string;
  number: string | null;
  items: Array<{
    code: string;
    quantity: number;
    printInfo?: Record<string, string>;
  }>;
  purpose: string;
  itemSnapshot: Record<
    string,
    { label: Record<string, string>; extra: { requiresPrintInfo: boolean } }
  > | null;
  approvedAt: string | null;
  approvedFingerprint: string | null;
  issuedById: string | null;
  forcedClosed: boolean;
  status: string;
  lifecycleVersion: number;
  ruleSnapshot: Record<string, unknown> | null;
  managerApproverId: string | null;
  createdAt: string;
}
export interface SupplyDetail {
  record: SupplyRecord;
  users: Person[];
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  upcoming: UpcomingStage[];
  timeline: ApprovalTimeline;
}
export interface SourceContext {
  reload: () => void;
}
export interface DetailContext extends SourceContext {
  detail: SupplyDetail;
  update: (record: SupplyRecord) => void;
}
export { TAB_VIEW } from '../approvals/types.js';
import { ACTIONS as SHARED_ACTIONS } from '../approvals/types.js';
export const ACTIONS = [
  ...SHARED_ACTIONS,
  'claim',
  'release',
  'assign',
  'complete',
  'unable',
  'forceComplete',
] as const;
export interface SupplyLedgerEntry {
  id: string;
  applicationId: string;
  number: string | null;
  itemCode: string;
  itemLabel: Record<string, string>;
  requestedQuantity: number;
  actualQuantity: number | null;
  printInfo: Record<string, string> | null;
  recipient: { id: string; name: string };
  issuer: { id: string; name: string };
  outcome: 'issued' | 'forcedClosed';
  reason: string | null;
  createdAt: string;
}
