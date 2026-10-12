import type { AttendanceChangeRecord } from './types.js';
export function businessFields(
  record: AttendanceChangeRecord,
  t: (key: string) => string,
  locale: string,
  timeZone: string,
): [string, string][] {
  return [
    [
      t('attendanceChange.date'),
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(`${record.date}T00:00:00Z`)),
    ],
    [
      t('attendanceChange.correctionAt'),
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone,
      }).format(new Date(record.correctionAt)),
    ],
    [t('attendanceChange.proof'), record.proof],
  ];
}
