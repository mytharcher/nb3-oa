/** Date-only leave fields belong to the application calendar; UTC preserves the calendar date while formatting. */
export function formatLeaveDate(date: string | null, locale: string): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
