import type { LifecycleRecord, JsonObject } from '@nocobase/lifecycle';

export const TRAINING_LIFECYCLE = 'oa.training';
export interface TrainingRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  name: string;
  institution: string;
  startAt: string;
  endAt: string;
  usesWorkingTime: boolean;
  attendanceRecorded: boolean;
  managerApproverId: string | null;
  headMerged: JsonObject | null;
  hrRecipients: string[];
  reason: string;
  amountCents: number;
  departmentId: string | null;
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
export type TrainingInput = Pick<
  TrainingRecord,
  | 'name'
  | 'institution'
  | 'startAt'
  | 'endAt'
  | 'usesWorkingTime'
  | 'reason'
  | 'amountCents'
>;
