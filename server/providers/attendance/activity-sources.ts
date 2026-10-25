import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection } from '@nocobase/db';
export interface AttendanceBusinessEvidence {
  exemptions: {
    kind: string;
    applicationId: string;
    startAt: string;
    endAt: string;
    /** Only attendance-owned activity rows with these identities are verified. */
    activityId?: string;
  }[];
  approvedOvertimeMinutes: number;
}
export interface AttendanceActivitySources {
  register(
    name: string,
    source: (
      userId: string,
      date: string,
      connection: DatabaseConnection,
    ) => Promise<AttendanceBusinessEvidence>,
  ): void;
  read(
    userId: string,
    date: string,
    connection: DatabaseConnection,
  ): Promise<AttendanceBusinessEvidence>;
}
export const attendanceActivitySourcesToken =
  createServiceToken<AttendanceActivitySources>(
    'oa/attendance-activity-sources',
  );
export function createAttendanceActivitySources(): AttendanceActivitySources {
  const sources = new Map<
    string,
    Parameters<AttendanceActivitySources['register']>[1]
  >();
  return {
    register(name, source) {
      if (sources.has(name))
        throw new Error(`Duplicate attendance source: ${name}`);
      sources.set(name, source);
    },
    async read(userId, date, connection) {
      const result: AttendanceBusinessEvidence = {
        exemptions: [],
        approvedOvertimeMinutes: 0,
      };
      for (const source of sources.values()) {
        const value = await source(userId, date, connection);
        result.exemptions.push(...value.exemptions);
        result.approvedOvertimeMinutes += value.approvedOvertimeMinutes;
      }
      return result;
    },
  };
}
