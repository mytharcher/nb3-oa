/** An uncertain write retains its exact actor, route, and wire payload across remounts. */
export interface ActionCommand {
  actorId: string;
  path: string;
  json: Record<string, unknown>;
}
export function actionJournalKey(
  actorId: string,
  record: string,
  action: string,
  target: string,
) {
  return `oa:vendor-qualification:action:${actorId}:${record}:${action}:${target}`;
}
export function loadAction(key: string, actorId: string): ActionCommand | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(key) ?? 'null',
    ) as ActionCommand | null;
    return value?.actorId === actorId &&
      typeof value.path === 'string' &&
      typeof value.json?.requestId === 'string'
      ? value
      : null;
  } catch {
    return null;
  }
}
export function saveAction(key: string, command: ActionCommand) {
  localStorage.setItem(key, JSON.stringify(command));
}
export function clearAction(key: string) {
  localStorage.removeItem(key);
}
