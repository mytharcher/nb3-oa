export interface UnknownCreate {
  actorId: string;
  employeeId: string | null;
  departureType: string;
  startedAt: number;
}
const key = (actorId: string) => `oa.departure.unconfirmed-create:${actorId}`;
/** There is no server creation journal: never release this lock because a lookup returned no rows. */
export function readUnknownCreate(actorId: string): UnknownCreate | null {
  const raw = localStorage.getItem(key(actorId));
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === 'object' &&
      'actorId' in value &&
      value.actorId === actorId &&
      'departureType' in value &&
      typeof value.departureType === 'string' &&
      'employeeId' in value &&
      (typeof value.employeeId === 'string' || value.employeeId === null) &&
      'startedAt' in value &&
      typeof value.startedAt === 'number'
    )
      return value as UnknownCreate;
  } catch {
    /* Preserve an unparseable marker instead of permitting a blind second POST. */
  }
  return { actorId, employeeId: null, departureType: '', startedAt: 0 };
}
export function saveUnknownCreate(value: UnknownCreate) {
  localStorage.setItem(key(value.actorId), JSON.stringify(value));
}
export function clearUnknownCreate(actorId: string) {
  localStorage.removeItem(key(actorId));
}
