import { startOfDay } from 'date-fns';

export type EffectiveMode = 'now' | 'date';

/**
 * The instant a version takes effect: now (omitted, the server uses its own clock) or 00:00 of the chosen date in the
 * browser's time zone. Only dates from tomorrow on can be chosen, since a version never takes effect in the past.
 */
export function effectiveFromOf(
  mode: EffectiveMode,
  date: Date | undefined,
): string | undefined {
  return mode === 'date' && date ? startOfDay(date).toISOString() : undefined;
}
