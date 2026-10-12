import { createRequestId } from '../approvals/request-id.js';
import type { QualificationInput } from './types.js';
export interface CreateJournal {
  actorId: string;
  requestId: string;
  input: QualificationInput;
  recordId?: string;
}
const prefix = 'oa:vendor-qualification:create:';
export function loadCreate(actorId: string): CreateJournal | null {
  try {
    const raw = localStorage.getItem(prefix + actorId);
    if (!raw) return null;
    const value = JSON.parse(raw) as CreateJournal;
    return value.actorId === actorId &&
      typeof value.requestId === 'string' &&
      value.input &&
      ['qualify', 'remove'].includes(value.input.operation) &&
      typeof value.input.vendorId === 'string'
      ? value
      : null;
  } catch {
    return null;
  }
}
export function saveCreate(value: CreateJournal) {
  localStorage.setItem(prefix + value.actorId, JSON.stringify(value));
}
export function startCreate(
  actorId: string,
  input: QualificationInput,
): CreateJournal {
  const journal = {
    actorId,
    requestId: createRequestId(),
    input: structuredClone(input),
  };
  saveCreate(journal);
  return journal;
}
export function clearCreate(actorId: string) {
  localStorage.removeItem(prefix + actorId);
}
export function centsOf(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, part = ''] = value.split('.');
  const cents = BigInt(whole) * 100n + BigInt(part.padEnd(2, '0'));
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
}
/** Avoid losing a cent when a large safe integer is displayed for editing. */
export function decimalOf(cents: number) {
  const amount = BigInt(cents);
  return `${amount / 100n}.${String(amount % 100n).padStart(2, '0')}`;
}
