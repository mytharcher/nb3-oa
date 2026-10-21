import { ListTodo, Megaphone, type LucideIcon } from 'lucide-react';
import {
  requestActionDefinitions,
  requestActionGroups,
  type RequestActionKey,
} from '#components/request-action-definitions';
import type { CenterRecord } from '../approvals/use-center-resource.js';

type Area = (typeof requestActionGroups)[RequestActionKey];

/** Each center kind's request entry, so a row shows the same icon and area colour as the request catalog. */
const kindActions: Record<
  Exclude<CenterRecord['kind'], 'oa.workItem' | 'oa.announcementReceipt'>,
  RequestActionKey
> = {
  'oa.recruitment': 'recruitment',
  'oa.sealRequest': 'seal',
  'oa.vehicleRequest': 'vehicle',
  'oa.transfer': 'transfer',
  'oa.certificateRequest': 'certificate',
  'oa.leave': 'leave',
  'oa.overtime': 'overtime',
  'oa.leaveCancellation': 'cancellation',
  'oa.general': 'general',
  'oa.supplies': 'supplies',
  'oa.budgetAdjustment': 'budget',
  'oa.expensePlan': 'expensePlan',
  'oa.training': 'training',
  'oa.reimbursement': 'reimbursement',
  'oa.purchase': 'purchase',
  'oa.loan': 'loan',
  'oa.payment': 'payment',
  'oa.probation': 'probation',
  'oa.departure': 'departure',
  'oa.vendorQualification': 'vendor',
  'oa.contract': 'contract',
  'oa.assetRequest': 'asset',
  'oa.travel': 'travel',
  'oa.travelCancellation': 'travelCancellation',
  'oa.attendanceChange': 'attendance',
  'oa.outing': 'outing',
};

// Literal class names so Tailwind generates them; the colours are the theme's area tokens.
const areaClasses: Record<Area, string> = {
  office: 'text-area-office',
  people: 'text-area-people',
  finance: 'text-area-finance',
  procurement: 'text-area-procurement',
  administration: 'text-area-administration',
};

export function kindPresentation(kind: CenterRecord['kind']): {
  icon: LucideIcon;
  className: string;
} {
  if (kind === 'oa.workItem')
    return { icon: ListTodo, className: areaClasses.office };
  if (kind === 'oa.announcementReceipt')
    return { icon: Megaphone, className: areaClasses.office };
  const key = kindActions[kind];
  const action = requestActionDefinitions.find((item) => item.key === key);
  return {
    icon: action?.icon ?? ListTodo,
    className: areaClasses[requestActionGroups[key]],
  };
}

export type DueState = 'overdue' | 'today' | null;

/** Whether a due date has passed or falls on the viewer's current day. */
export function dueState(dueAt: string | undefined, now: Date): DueState {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;
  if (due.getTime() < now.getTime()) return 'overdue';
  return due.toDateString() === now.toDateString() ? 'today' : null;
}

/** Most urgent first: earliest due date, then items without one, oldest first. */
export function byUrgency(a: CenterRecord, b: CenterRecord): number {
  if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
  if (a.dueAt) return -1;
  if (b.dueAt) return 1;
  return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['minute', 60_000],
  ['hour', 3_600_000],
  ['day', 86_400_000],
];

/** "in 2 days", "3 hours ago"; null beyond a month, where the absolute date reads better. */
export function relativeTime(
  value: string,
  now: Date,
  language: string,
): string | null {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  const diff = time - now.getTime();
  const abs = Math.abs(diff);
  if (abs >= 30 * 86_400_000) return null;
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  // Under a minute rounds to "now" in the minute unit.
  const [unit, size] = units.findLast(([, ms]) => abs >= ms) ?? units[0];
  return format.format(Math.round(diff / size), unit);
}
