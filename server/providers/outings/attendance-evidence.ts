import type { DatabaseConnection } from '@nocobase/db';
import type { AttendanceBusinessEvidence } from '../attendance/activity-sources.js';
import type { OutingRecord } from './service.js';
/** The attendance owner additionally validates and clips its immutable activity fact. */
export async function outingAttendanceEvidence(
  userId: string,
  _date: string,
  connection: DatabaseConnection,
): Promise<AttendanceBusinessEvidence> {
  const rows = await connection
    .repository<OutingRecord>('outingRequests')
    .findMany({ filter: { applicantId: userId } });
  return {
    exemptions: rows
      .filter((row) =>
        ['approved', 'terminated', 'withdrawn'].includes(row.status),
      )
      .map((row) => ({
        kind: 'oa.outing',
        applicationId: row.id,
        activityId: row.id,
        startAt: row.startAt,
        endAt: row.endAt,
      })),
    approvedOvertimeMinutes: 0,
  };
}
