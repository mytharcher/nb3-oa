import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { SalaryGradeSnapshot, SalaryRangeInput } from './ranges.js';
export interface SalaryGradeRevision {
  id: string;
  version: number;
  bands: SalaryGradeSnapshot[];
  createdById: string;
  reason: string;
  createdAt: Date;
}
export interface SalaryGradeSelection extends SalaryGradeSnapshot {
  revisionId: string;
  tableVersion: number;
}
export interface SalaryGradeService {
  current(
    connection: DatabaseConnection,
  ): Promise<{ version: number; revision: SalaryGradeRevision | null }>;
  publish(
    input: {
      requestKey?: string;
      expectedVersion: number;
      bands: readonly SalaryRangeInput[];
      actorId: string;
      reason: string;
    },
    connection: DatabaseConnection,
    policies?: { pointer: RepositoryPolicy; revision: RepositoryPolicy },
  ): Promise<SalaryGradeRevision>;
  snapshotForGrade(
    gradeId: string,
    connection: DatabaseConnection,
    revisionId?: string,
  ): Promise<SalaryGradeSelection>;
}
export const salaryGradeServiceToken = createServiceToken<SalaryGradeService>(
  'oa/salary-grade-service',
);
