import type { DatabaseConnection } from '@nocobase/db';
import type { LifecycleRecord, JsonObject } from '@nocobase/lifecycle';
import { createServiceToken } from '@nocobase/service-provider';

export const PROBATION_LIFECYCLE = 'oa.probation';
export const PROBATION_CONCLUSIONS = [
  'regular',
  'deferred',
  'declined',
] as const;
export type ProbationConclusion = (typeof PROBATION_CONCLUSIONS)[number];

/** Amounts never belong to this record, lifecycle inputs, frozen snapshots or approval rows. */
export interface ProbationRecord extends LifecycleRecord {
  id: string;
  employeeId: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  probationEndDate: string;
  selfEvaluation: string;
  evaluation: string | null;
  conclusion: ProbationConclusion | null;
  deferredTo: string | null;
  gradeId: string | null;
  compensationProposalId: string | null;
  hrActorId: string | null;
  departmentId: string | null;
  managerApproverId: string | null;
  headApproverId: string | null;
  headMerged: JsonObject | null;
  gmApproverId: string | null;
  ruleSnapshot: JsonObject | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}

export interface ProbationManagerOutputs {
  evaluation: string;
  conclusion: ProbationConclusion;
  deferredTo: string | null;
}

/** Private HTTP input, transformed before crossing the approval/lifecycle boundary. */
export interface ProbationCompensationInput {
  gradeId: string;
  baseSalary: string;
}

/**
 * P4 owns the implementation. Resolve this token lazily inside the final probation transaction.
 * Absence refuses the declined conclusion, rolling back the vote and every application write.
 * Never substitute an audit entry or an unlinked plain draft for this contractual linkage.
 */
export interface ProbationDepartureAdapter {
  createDeclinedProbationDraft(
    input: {
      employeeId: string;
      applicantId: string;
      delegatedById: string;
      sourceProbationId: string;
      requestKey: string;
    },
    connection: DatabaseConnection,
  ): Promise<{ id: string }>;
}
export const probationDepartureAdapterToken =
  createServiceToken<ProbationDepartureAdapter>(
    'oa/probation-departure-adapter',
  );

// Type-only link keeps public token ownership here; consumers never import the implementation at runtime.
export type ProbationService = ReturnType<
  typeof import('./service.js').createProbationService
>;
export const probationServiceToken = createServiceToken<ProbationService>(
  'oa/probation-service',
);
