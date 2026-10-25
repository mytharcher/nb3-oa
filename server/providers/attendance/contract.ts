import { createServiceToken } from '@nocobase/service-provider';
import type {
  DatabaseConnection,
  RepositoryRecord,
  RepositoryPolicy,
} from '@nocobase/db';
export interface AttendanceRecord extends RepositoryRecord {
  id: string;
  userId: string;
  date: string;
  punchKind: 'in' | 'out';
  punchedAt: string | null;
  status: 'recorded' | 'missing' | 'corrected';
  version: number;
  source: string;
  sourceKey: string;
  sourceData: Record<string, unknown>;
  correctedByRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}
export type AttendanceIngestInput = Pick<
  AttendanceRecord,
  | 'userId'
  | 'date'
  | 'punchKind'
  | 'punchedAt'
  | 'source'
  | 'sourceKey'
  | 'sourceData'
>;
export interface AttendanceService {
  isMissingEffective(
    record: AttendanceRecord,
    connection?: DatabaseConnection,
  ): Promise<boolean>;
  /** Trusted integration: callers must authorize originating business records before exposing these intervals. */
  effectiveActivities(
    userId: string,
    connection: DatabaseConnection,
  ): Promise<
    { kind: string; applicationId: string; startAt: string; endAt: string }[]
  >;
  get(
    id: string,
    connection?: DatabaseConnection,
  ): Promise<AttendanceRecord | undefined>;
  /** P5 import/integrations enter through this contract; never discard the supplied original evidence. */
  ingest(
    input: AttendanceIngestInput,
    context: {
      actorId: string;
      /** Internal evaluator only; HTTP integrations cannot supply this flag. */
      calculated?: boolean;
      connection?: DatabaseConnection;
      policy?: RepositoryPolicy;
    },
  ): Promise<AttendanceRecord>;
  /** Trusted integration facade, not HTTP authorization. Entire batch uses a transaction/savepoint on the caller connection.
   * Validates real person/employee identities and all evidence before any row write.
   * Repeated identical source evidence is a no-op, including after an approved correction.
   */
  ingestBatch(
    inputs: readonly AttendanceIngestInput[],
    context: {
      actorId: string;
      connection?: DatabaseConnection;
      policy?: RepositoryPolicy;
    },
  ): Promise<AttendanceRecord[]>;
  recordActivity(
    input: {
      kind: string;
      applicationId: string;
      userId: string;
      startAt: string;
      endAt: string;
      actorId: string;
      now: Date;
    },
    connection: DatabaseConnection,
  ): Promise<void>;
  endActivity(
    input: {
      kind: string;
      applicationId: string;
      userId: string;
      actorId: string;
      now: Date;
      status: 'withdrawn' | 'terminated';
    },
    connection: DatabaseConnection,
  ): Promise<void>;
  correct(
    input: {
      originalId: string;
      originalVersion: number;
      applicationId: string;
      userId: string;
      punchedAt: string;
      actorId: string;
    },
    connection: DatabaseConnection,
  ): Promise<void>;
}
export const attendanceServiceToken = createServiceToken<AttendanceService>(
  'oa/attendance-service',
);
