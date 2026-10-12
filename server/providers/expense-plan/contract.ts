import type { LifecycleRecord, JsonObject } from '@nocobase/lifecycle';
import type { BudgetAccount } from '../budgets/contract.js';

export const EXPENSE_PLAN_LIFECYCLE = 'oa.expensePlan';
export interface ExpensePlanRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  matterType: string;
  reason: string;
  amountCents: number;
  subject: string;
  participants: number;
  eventDate: string;
  departmentId: string | null;
  year: number | null;
  heldAccount: BudgetAccount | null;
  heldCents: number;
  ruleSnapshot: JsonObject | null;
  headApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  gmMerged: JsonObject | null;
  authorizationId: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export type ExpensePlanInput = Pick<
  ExpensePlanRecord,
  | 'matterType'
  | 'reason'
  | 'amountCents'
  | 'subject'
  | 'participants'
  | 'eventDate'
>;
