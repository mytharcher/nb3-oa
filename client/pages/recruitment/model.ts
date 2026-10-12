import { offeredActions } from '@nocobase/app-plugin-approval/client';
import type { Detail, Proposal } from './types.js';
export function offersOf(detail: Detail) {
  return offeredActions(
    detail.taskActions,
    detail.runActions,
    detail.runs.map((v) => v.run),
  );
}
export function patchOf(
  values: Proposal,
  original: Proposal,
  fields: readonly string[],
): Partial<Proposal> {
  return Object.fromEntries(
    fields
      .filter(
        (k) =>
          k in values &&
          JSON.stringify(values[k as keyof Proposal]) !==
            JSON.stringify(original[k as keyof Proposal]),
      )
      .map((k) => [k, values[k as keyof Proposal]]),
  );
}
export function cents(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(result) ? result : null;
}
