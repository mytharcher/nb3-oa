/** Response shapes of the platform module's endpoints (`server/routes/platform/schemas.ts`). */

export interface WorkHours {
  readonly start: string;
  readonly end: string;
}

export interface WorkCalendar {
  readonly timeZone: string;
  readonly today: string;
  readonly workHours: WorkHours;
}

export const CALENDAR_DAY_KINDS = [
  'holiday',
  'adjustedWorkday',
  'workday',
  'weekend',
] as const;
export type CalendarDayKind = (typeof CALENDAR_DAY_KINDS)[number];

export interface CalendarDay {
  readonly date: string;
  readonly kind: CalendarDayKind;
  readonly note: string | null;
  readonly updatedAt: string;
}

export interface RuleVersion {
  readonly id: string;
  readonly key: string;
  readonly value: unknown;
  readonly effectiveFrom: string;
  readonly updatedBy: string | null;
  readonly updatedByName: string | null;
  readonly note: string | null;
  readonly createdAt: string;
}

export const RULE_DOMAINS = [
  'spend',
  'leave',
  'attendance',
  'hr',
  'sla',
  'committee',
  'calendar',
] as const;
export type RuleDomain = (typeof RULE_DOMAINS)[number];

export type RuleValueType =
  | 'money'
  | 'count'
  | 'days'
  | 'hours'
  | 'workingHours'
  | 'ratio'
  | 'rank'
  | 'workHours'
  | 'timeZone';

export interface RuleSummary {
  readonly key: string;
  readonly domain: RuleDomain;
  readonly type: RuleValueType;
  readonly area: 'rules' | 'calendar';
  readonly min?: number;
  readonly max?: number;
  readonly allowFuture: boolean;
  readonly defaultValue: unknown;
  readonly current: RuleVersion | null;
  readonly scheduled: RuleVersion[];
}

export interface DictionaryExtraField {
  readonly name: string;
  readonly type: 'boolean' | 'integer' | 'number';
  readonly nullable: boolean;
  readonly min?: number;
}

export interface DictionaryType {
  readonly type: string;
  readonly extraFields: DictionaryExtraField[];
}

export interface DictionaryLabel {
  readonly 'zh-CN'?: string;
  readonly 'en-US'?: string;
}

export interface DictionaryEntry {
  readonly id: string;
  readonly type: string;
  readonly code: string;
  readonly label: DictionaryLabel;
  readonly sortOrder: number;
  readonly active: boolean;
  readonly extra: Record<string, unknown> | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SequenceCounter {
  readonly prefix: string;
  readonly period: string;
  readonly next: number;
}

export interface AuditLog {
  readonly id: string;
  readonly actorId: string | null;
  readonly actorName: string | null;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string | null;
  readonly before: unknown;
  readonly after: unknown;
  readonly reason: string | null;
  readonly at: string;
}

export interface PageMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

/** A dictionary label in the interface language, else the other language, else the code. */
export function labelOf(
  entry: Pick<DictionaryEntry, 'label' | 'code'>,
  locale: string,
): string {
  const own = entry.label[locale as keyof DictionaryLabel];
  return own || entry.label['zh-CN'] || entry.label['en-US'] || entry.code;
}
