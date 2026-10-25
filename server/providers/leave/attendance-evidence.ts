import type { DatabaseConnection, RepositoryRecord } from '@nocobase/db';
import type { CalendarService } from '../platform/calendar.js';
import type { AttendanceBusinessEvidence } from '../attendance/activity-sources.js';
/** Leave owns its effective attendance facts, including approved cancellations. */
export async function leaveAttendanceEvidence(
  userId: string,
  date: string,
  connection: DatabaseConnection,
  calendar: CalendarService,
): Promise<AttendanceBusinessEvidence> {
  const facts = await connection
    .repository<
      RepositoryRecord & {
        applicationId: string;
        startDate: string;
        endDate: string;
        startHalf: string;
        endHalf: string;
        active?: boolean;
      }
    >('leaveAttendance')
    .findMany({ filter: { userId } });
  const exemptions: AttendanceBusinessEvidence['exemptions'] = [];
  for (const fact of facts) {
    if (fact.active === false || fact.startDate > date || fact.endDate < date)
      continue;
    const request = await connection
      .repository('leaveRequests')
      .findOne({
        filter: {
          id: fact.applicationId,
          applicantId: userId,
          status: 'approved',
        },
      });
    if (!request)
      throw new Error('Leave attendance fact has no approved source');
    const hours = calendar.workHoursOn(date);
    const minutes = (clock: string) =>
      Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
    // Matches leave's existing delegation/half-day policy: midpoint of configured work hours.
    const middle = Math.round((minutes(hours.start) + minutes(hours.end)) / 2);
    const middleClock = `${String(Math.floor(middle / 60)).padStart(2, '0')}:${String(middle % 60).padStart(2, '0')}`;
    exemptions.push({
      kind: 'oa.leave',
      applicationId: fact.applicationId,
      startAt: calendar
        .resolveLocalDateTime(
          date,
          fact.startDate === date && fact.startHalf === 'pm'
            ? middleClock
            : hours.start,
        )
        .toISOString(),
      endAt: calendar
        .resolveLocalDateTime(
          date,
          fact.endDate === date && fact.endHalf === 'am'
            ? middleClock
            : hours.end,
        )
        .toISOString(),
    });
  }
  return { exemptions, approvedOvertimeMinutes: 0 };
}
