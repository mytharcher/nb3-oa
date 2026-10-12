import type { Proposal, ContractDetail } from './types.js';
import { offeredActions } from '@nocobase/app-plugin-approval/client';
export function centsOf(value: string): number | null {
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return cents > BigInt(Number.MAX_SAFE_INTEGER) ? null : Number(cents);
}
export function decimalOf(value: number) {
  return `${Math.trunc(value / 100)}.${String(value % 100).padStart(2, '0')}`;
}
export function money(value: number | undefined, locale: string) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    return '—';
  const cents = BigInt(value),
    fraction = new Intl.NumberFormat(locale, {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }).format(Number(cents % 100n));
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .formatToParts(cents / 100n)
    .map((part) => (part.type === 'fraction' ? fraction : part.value))
    .join('');
}
export function dateLabel(
  value: string | undefined,
  locale: string,
  zone = 'UTC',
) {
  if (!value) return '—';
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.valueOf())
    ? '—'
    : new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeZone: value.length === 10 ? 'UTC' : zone,
      }).format(d);
}
export function validateProposal(
  value: Proposal,
  amount: string,
  submit = false,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!value.contractType) errors.contractType = 'required';
  if (
    !value.counterparty.name.trim() ||
    (value.counterparty.kind === 'vendor' && !value.counterparty.id)
  )
    errors.counterparty = 'required';
  if (centsOf(amount) === null) errors.amountCents = 'amountInvalid';
  for (const key of ['startsOn', 'endsOn'] as const) {
    const v = value[key];
    const d = new Date(`${v}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
      !Number.isFinite(d.valueOf()) ||
      d.toISOString().slice(0, 10) !== v
    )
      errors[key] = 'required';
  }
  if (!errors.endsOn && !errors.startsOn && value.endsOn < value.startsOn)
    errors.endsOn = 'dateInvalid';
  if (value.paymentTerms.length > 10000) errors.paymentTerms = 'tooLong';
  if (value.reason.length > 5000) errors.reason = 'tooLong';
  if (submit) {
    if (!value.paymentTerms.trim()) errors.paymentTerms = 'required';
    if (!value.reason.trim()) errors.reason = 'required';
    if (!value.textVersionId) errors.textVersionId = 'textRequired';
  }
  return errors;
}
export function offersOf(detail: ContractDetail) {
  return offeredActions(
    detail.actions,
    detail.runActions,
    detail.runs.map((r) => r.run),
  );
}
/** Only the original legal pool slot may supply this business output. Added signers cannot supply it. */
export function needsLegalOpinion(detail: ContractDetail, targetId: string) {
  const task = detail.runs
    .flatMap((r) => r.tasks)
    .find((t) => t.id === targetId);
  return (
    task?.stage === 'legalFinance' &&
    task.order === 0 &&
    task.depth === 0 &&
    task.via === 'plan' &&
    task.kind === 'decide'
  );
}
