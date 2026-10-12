import type { OutingRecord } from './types.js';
export function businessFields(
  record: OutingRecord,
  t: (key: string) => string,
  locale: string,
  timeZone: string,
): [string, string][] {
  const date = (v: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(new Date(v));
  return [
    [t('outings.startAt'), date(record.startAt)],
    [t('outings.endAt'), date(record.endAt)],
    [t('outings.location'), record.location],
  ];
}
