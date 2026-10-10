export const DELEGATION_SETTINGS = 'oa.approvalDelegations';
export const SELECT_POPUP =
  'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal';
export interface DelegationPerson {
  id: string;
  name: string;
}
export interface Delegation {
  id: string;
  principalId: string;
  delegateId: string;
  principal: DelegationPerson;
  delegate: DelegationPerson;
  scope: 'all' | string[];
  from: string;
  to: string;
  source: 'manual' | 'leave';
  sourceApplication: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface DelegationContext {
  reload: () => void;
  onSaved?: (row: Delegation) => void;
}
export function isEffective(row: Delegation, now = Date.now()): boolean {
  return row.active && Date.parse(row.from) <= now && now < Date.parse(row.to);
}
/** DatePicker uses a local calendar date; wall-clock fields are interpreted in the company's explicit zone. */
export function wallTimeToInstant(
  date: string,
  time: string,
  zone: string,
): string | undefined {
  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/u.test(time)
  )
    return undefined;
  const wall = `${date}T${time}:00`;
  const naive = Date.parse(`${wall}Z`);
  if (!Number.isFinite(naive)) return undefined;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  let candidate = naive;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(candidate).map((part) => [part.type, part.value]),
    );
    const resolved = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
    if (resolved === wall) return new Date(candidate).toISOString();
    candidate += naive - Date.parse(`${resolved}Z`);
  }
  return undefined; // A nonexistent clock time during a daylight-saving transition is refused.
}
export function instantToWall(
  value: string,
  zone: string,
): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}
