import type { Committee } from './types.js';
export function validCommittee(value: Committee) {
  return (
    Number.isSafeInteger(value.version) &&
    value.version > 0 &&
    Number.isSafeInteger(value.min) &&
    value.min > 0 &&
    value.min <= value.seats.length &&
    value.seats.length >= 3 &&
    value.seats.length <= 32 &&
    new Set(value.seats.map((s) => s.key)).size === value.seats.length &&
    value.seats.every((s) => /^[a-z][a-zA-Z0-9_-]{0,47}$/.test(s.key)) &&
    ['purchasing', 'finance', 'applicantHead'].every((source) =>
      value.seats.some((s) => s.source === source),
    ) &&
    value.seats.some((s) => s.source === 'finance' && s.veto) &&
    value.settle === 'veto'
  );
}
