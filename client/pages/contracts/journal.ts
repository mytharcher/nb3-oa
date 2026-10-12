export interface Command {
  actorId: string;
  path: string;
  body: Record<string, unknown>;
}
const PREFIX = 'oa:contracts:command:';
const actorPrefixes = [
  'oa:contracts:command:',
  'oa:contracts:upload:',
  'oa:contracts:binding:',
];
export function keyOf(actor: string, route: string, command: string) {
  return `${PREFIX}${actor}:${route}:${command}`;
}
export function loadCommand(key: string, actorId: string): Command | null {
  try {
    const v = JSON.parse(
      sessionStorage.getItem(key) ?? 'null',
    ) as Command | null;
    return v?.actorId === actorId &&
      typeof v.path === 'string' &&
      typeof v.body.requestId === 'string'
      ? v
      : null;
  } catch {
    return null;
  }
}
export function saveCommand(key: string, value: Command) {
  sessionStorage.setItem(key, JSON.stringify(value));
}
export function clearCommand(key: string) {
  sessionStorage.removeItem(key);
}
/** A change of signed-in identity clears sensitive envelopes from all previous identities. */
export function clearOtherActors(actor: string) {
  for (const key of Object.keys(sessionStorage)) {
    if (
      actorPrefixes.some(
        (prefix) =>
          key.startsWith(prefix) && !key.startsWith(`${prefix}${actor}:`),
      )
    )
      sessionStorage.removeItem(key);
  }
}
export function clearActor(actor: string) {
  for (const key of Object.keys(sessionStorage))
    if (actorPrefixes.some((prefix) => key.startsWith(`${prefix}${actor}:`)))
      sessionStorage.removeItem(key);
}
