import { addDays, format, startOfDay } from 'date-fns';
export interface Schedule {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  version: number;
  sourceBookingId: string | null;
}
export interface TeamItem {
  id: string;
  userId: string;
  kind: 'leave' | 'travel' | 'outing';
  name: string;
  departmentId: string | null;
  department: string;
  startAt: string;
  endAt: string;
}
export interface TeamCalendarResponse {
  data: TeamItem[];
  meta: { date: string; timeZone: string };
}
export function teamTime(row: TeamItem, locale: string, timeZone?: string) {
  const fmt = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  return `${fmt.format(new Date(row.startAt))} – ${fmt.format(new Date(row.endAt))}`;
}
export const schedulePolicy = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.personalSchedules' },
  action,
});
export const localDay = () => format(new Date(), 'yyyy-MM-dd');
export function dayInterval(day: string) {
  const start = startOfDay(new Date(`${day}T12:00:00`));
  return {
    startAt: start.toISOString(),
    endAt: addDays(start, 1).toISOString(),
  };
}
export function scheduleTime(row: Schedule, locale: string) {
  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${fmt.format(new Date(row.startAt))} – ${fmt.format(new Date(row.endAt))}`;
}

export function scheduleZoneLabel(locale: string) {
  return (
    new Intl.DateTimeFormat(locale, { timeZoneName: 'long' })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value ?? ''
  );
}
