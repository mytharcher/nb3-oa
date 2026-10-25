import type { DatabaseConnection } from '@nocobase/db';
import type { AttendanceBusinessEvidence } from '../attendance/activity-sources.js';
import type { OvertimeRecord } from './service.js';
/** Approved overtime is a duration, never invented office attendance timestamps. */
export async function overtimeAttendanceEvidence(
  userId: string,
  date: string,
  connection: DatabaseConnection,
): Promise<AttendanceBusinessEvidence> {
  const rows = await connection
    .repository<OvertimeRecord>('overtimeRequests')
    .findMany({
      filter: (f) =>
        f.and([
          f.string('applicantId').eq(userId),
          f.string('status').eq('approved'),
          f.date('date').on(date),
        ]),
    });
  return {
    exemptions: [],
    approvedOvertimeMinutes: rows.reduce(
      (sum, row) => sum + Number(row.minutes),
      0,
    ),
  };
}
