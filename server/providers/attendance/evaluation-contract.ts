import { createServiceToken } from '@nocobase/service-provider';
import type {
  DatabaseConnection,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
export interface AttendanceEvaluation extends RepositoryRecord {
  id: string;
  userId: string;
  departmentId?: string | null;
  date: string;
  currentRevisionId: string;
  version: number;
}
export interface AttendanceEvaluationRevision extends RepositoryRecord {
  id: string;
  evaluationId: string;
  userId?: string | null;
  departmentId?: string | null;
  date?: string | null;
  revision: number;
  requestKey: string;
  actorId: string;
  reason: string;
  createdAt: string;
  snapshot: Record<string, unknown>;
  result: {
    status: 'normal' | 'exception' | 'blocked' | 'rest';
    reasons: string[];
    lateMinutes: number;
    earlyMinutes: number;
    missingPunches: number;
    absentMinutes: number;
  };
}
export interface AttendanceEvaluationService {
  /** Trusted orchestration only. Always creates a savepoint on caller connection.
   * Same request key replays the original immutable revision; distinct key explicitly recalculates.
   * Business owner adapters verify activities; unknown or inconsistent facts fail closed.
   */
  evaluate(
    input: {
      userId: string;
      date: string;
      requestKey: string;
      actorId: string;
      reason: string;
    },
    connection?: DatabaseConnection,
  ): Promise<AttendanceEvaluationRevision>;
  /** Both current pointer and historical revision must be completely readable under current policies. */
  read(
    id: string,
    connection: DatabaseConnection,
    policies: { current: RepositoryPolicy; revision: RepositoryPolicy },
    revision?: number,
  ): Promise<AttendanceEvaluationRevision | undefined>;
}
export const attendanceEvaluationServiceToken =
  createServiceToken<AttendanceEvaluationService>(
    'oa/attendance-evaluation-service',
  );
