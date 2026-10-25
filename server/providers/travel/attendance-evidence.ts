import { createHash } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { AttendanceBusinessEvidence } from '../attendance/activity-sources.js';
import type { TravelRecord } from './contract.js';
/** Travel owns membership and approval-generation identity; attendance owns actual end clipping. */
export async function travelAttendanceEvidence(
  userId: string,
  _date: string,
  connection: DatabaseConnection,
): Promise<AttendanceBusinessEvidence> {
  const rows = await connection
    .repository<TravelRecord>('travelRequests')
    .findMany({ filter: (f) => f.date('approvalGrantedAt').notEmpty() });
  return {
    exemptions: rows
      .filter(
        (row) =>
          row.applicantId === userId || row.companionIds.includes(userId),
      )
      .map((row) => ({
        kind: 'oa.travel',
        applicationId: row.id,
        activityId: createHash('sha256')
          .update(JSON.stringify([row.id, userId, row.approvalGrantedAt]))
          .digest('hex'),
        startAt: row.startAt,
        endAt: row.endAt,
      })),
    approvedOvertimeMinutes: 0,
  };
}
