import { createRequestKey } from '#lib/request-key';
export interface Metadata {
  id: string;
  version: number;
  createdBy: { id: string; name: string };
  createdAt: string;
}
export interface Band {
  gradeId: string;
  gradeCode: string;
  gradeTitle: string;
  rank: number;
  minimumCents: number;
  maximumCents: number;
}
export interface Revision extends Metadata {
  reason: string;
  bands: Band[];
  timeZone: string;
}
export interface Current {
  version: number;
  revision: Revision | null;
}
export interface Grade {
  id: string;
  code: string;
  title: string;
  rank: number;
  active: boolean;
}
export interface History {
  data: Metadata[];
  meta: { total: number; page: number; pageSize: number; timeZone: string };
}
export interface PublishInput {
  requestKey: string;
  expectedVersion: number;
  reason: string;
  bands: { gradeId: string; minimumCents: number; maximumCents: number }[];
}
export interface Envelope {
  actorId: string;
  body: PublishInput;
}
export interface Draft {
  reason: string;
  bands: {
    rowKey: string;
    gradeId: string;
    minimum: string;
    maximum: string;
  }[];
}
export interface SourceContext {
  source: string;
  search: string;
  reload: () => void;
  onPublished: (revision: Revision) => void;
  focusList: () => void;
}
export const resource = { type: 'composite' as const, id: 'oa.salaryGrades' };
// Monetary units are deliberately currency/pay-period neutral: the API defines only integer cents.
export function cents(text: string): number | undefined {
  const value = text.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return undefined;
  const [whole, fraction = ''] = value.split('.');
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return amount <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(amount) : undefined;
}
export function decimal(amount: number): string {
  return `${Math.floor(amount / 100)}.${String(amount % 100).padStart(2, '0')}`;
}
export function money(amount: number, locale: string): string {
  // Format integer cents without dividing a large safe integer through floating point.
  const whole = BigInt(amount) / 100n,
    fraction = BigInt(amount) % 100n;
  const separator = new Intl.NumberFormat(locale, { minimumFractionDigits: 2 })
    .formatToParts(0)
    .find((part) => part.type === 'decimal')!.value;
  return (
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(whole) +
    separator +
    new Intl.NumberFormat(locale, {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }).format(fraction)
  );
}
export function date(value: string, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
export function draftOf(current: Current): Draft {
  return {
    reason: '',
    bands: current.revision?.bands.map((b) => ({
      rowKey: createRequestKey(),
      gradeId: b.gradeId,
      minimum: decimal(b.minimumCents),
      maximum: decimal(b.maximumCents),
    })) ?? [
      { rowKey: createRequestKey(), gradeId: '', minimum: '', maximum: '' },
    ],
  };
}
export function recoveredDraft(envelope: Envelope): Draft {
  return {
    reason: envelope.body.reason,
    bands: envelope.body.bands.map((b) => ({
      rowKey: createRequestKey(),
      gradeId: b.gradeId,
      minimum: decimal(b.minimumCents),
      maximum: decimal(b.maximumCents),
    })),
  };
}
export function validate(
  values: Draft,
  grades: Grade[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.bands.length) errors.bands = 'nonempty';
  const seen = new Set<string>();
  values.bands.forEach((row, index) => {
    const prefix = `bands.${index}`;
    if (!row.gradeId) errors[`${prefix}.gradeId`] = 'required';
    else if (!grades.some((g) => g.id === row.gradeId && g.active))
      errors[`${prefix}.gradeId`] = 'inactive';
    else if (seen.has(row.gradeId)) errors[`${prefix}.gradeId`] = 'duplicate';
    seen.add(row.gradeId);
    const minimum = cents(row.minimum),
      maximum = cents(row.maximum);
    if (minimum === undefined)
      errors[`${prefix}.minimum`] = row.minimum.trim() ? 'amount' : 'required';
    if (maximum === undefined)
      errors[`${prefix}.maximum`] = row.maximum.trim() ? 'amount' : 'required';
    else if (minimum !== undefined && maximum < minimum)
      errors[`${prefix}.maximum`] = 'range';
  });
  if (!values.reason.trim()) errors.reason = 'required';
  else if (values.reason.trim().length > 2000) errors.reason = 'reasonLength';
  return errors;
}
export const pendingStorageKey = 'oa:salaryGradeTables:pending';
export function readPending(actorId: string): Envelope | null {
  const raw = sessionStorage.getItem(pendingStorageKey);
  if (!raw) return null;
  const envelope = JSON.parse(raw) as Envelope;
  if (envelope.actorId !== actorId) {
    sessionStorage.removeItem(pendingStorageKey);
    return null;
  }
  const b = envelope.body;
  if (
    !b ||
    typeof b.requestKey !== 'string' ||
    !b.requestKey ||
    !Number.isSafeInteger(b.expectedVersion) ||
    b.expectedVersion < 0 ||
    typeof b.reason !== 'string' ||
    !Array.isArray(b.bands) ||
    !b.bands.length ||
    b.bands.some(
      (row) =>
        typeof row.gradeId !== 'string' ||
        !Number.isSafeInteger(row.minimumCents) ||
        !Number.isSafeInteger(row.maximumCents) ||
        row.minimumCents < 0 ||
        row.maximumCents < row.minimumCents,
    )
  )
    throw new Error('Invalid pending publication');
  return envelope;
}
export function savePending(envelope: Envelope): void {
  sessionStorage.setItem(pendingStorageKey, JSON.stringify(envelope));
}
export function clearPending(): void {
  sessionStorage.removeItem(pendingStorageKey);
}
