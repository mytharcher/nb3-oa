export interface Budget {
  id: string;
  departmentId: string;
  year: number;
  subject: string;
  allocatedCents: number;
  heldCents: number;
  usedCents: number;
  availableCents: number;
  department: { id: string; title: string };
  subjectLabel: Record<string, string>;
}
export interface Ledger {
  id: string;
  kind: string;
  reference: string;
  allocatedDelta: number;
  heldDelta: number;
  usedDelta: number;
  actor: { id: string; name: string };
  reason: string;
  at: string;
}
export interface Subject {
  code: string;
  label: Record<string, string>;
  active: boolean;
}
export interface Page<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}
export interface BudgetContext {
  onSaved: (budget: Budget) => void;
}
export const BUDGET_SETTINGS = 'oa.budgets';
export function label(value: Record<string, string>, locale: string) {
  return value[locale] ?? value['zh-CN'] ?? value['en-US'] ?? '';
}
/** Decimal formatting is integer based so the last cent survives even at the safe-integer ceiling. */
export function money(cents: number, locale: string) {
  const abs = BigInt(cents < 0 ? -cents : cents);
  const whole = abs / 100n,
    fraction = String(abs % 100n).padStart(2, '0');
  const separator =
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((p) => p.type === 'decimal')?.value ?? '.';
  return `${cents < 0 ? '-' : ''}${new Intl.NumberFormat(locale).format(whole)}${separator}${fraction}`;
}
export function amountCents(value: string): number | undefined {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return undefined;
  const cents =
    BigInt(match[2]) * 100n + BigInt((match[3] ?? '').padEnd(2, '0'));
  const n = match[1] ? -cents : cents;
  return n > BigInt(Number.MAX_SAFE_INTEGER) ||
    n < -BigInt(Number.MAX_SAFE_INTEGER)
    ? undefined
    : Number(n);
}
