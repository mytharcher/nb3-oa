export interface AttendanceResult {
  id: string;
  userId: string;
  userName: string;
  date: string;
  revision: number;
  calculatedAt: string;
  result: {
    status: 'normal' | 'exception' | 'blocked' | 'rest';
    reasons: string[];
    lateMinutes: number;
    earlyMinutes: number;
    missingPunches: number;
    absentMinutes: number;
  };
  approvedOvertimeMinutes: number;
  missingPunches: {
    id: string;
    date: string;
    punchKind: string;
    version: number;
  }[];
}
export interface AttendanceSummary {
  normalDays: number;
  exceptionDays: number;
  blockedDays: number;
  restDays: number;
  lateMinutes: number;
  earlyMinutes: number;
  missingPunches: number;
  absentMinutes: number;
  approvedOvertimeMinutes: number;
}
export interface AttendancePage {
  items: AttendanceResult[];
  summary: AttendanceSummary;
  total: number;
  page: number;
  pageSize: number;
  timeZone: string;
}
export const attendanceResultResource = {
  type: 'composite' as const,
  id: 'oa.attendanceResults',
};
/** Spreadsheet formula prefixes are neutralized before RFC 4180 quoting. */
export function attendanceCsvCell(value: string | number): string {
  const text = String(value);
  return `"${(/^[=+\-@\t\r]/u.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
}
