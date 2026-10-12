/**
 * The JSON shapes the platform routes answer, built from the services' domain values: ids as strings, instants as
 * RFC 3339 strings.
 */
import type { AuditLogRecord } from '../../providers/audit/index.js';
import type { CalendarDayRecord } from '../../providers/platform/calendar.js';
import type { DictionaryEntry } from '../../providers/platform/dictionaries.js';
import type { DictionaryTypeDefinition } from '../../providers/platform/dictionary-types.js';
import type {
  RuleDefinition,
  RuleDomain,
  RuleSettingsArea,
  RuleValueType,
} from '../../providers/platform/rule-definitions.js';
import type { RuleVersion } from '../../providers/platform/rules.js';
import type { SequenceCounter } from '../../providers/platform/sequences.js';
import type {
  CalendarDayKind,
  WorkHours,
} from '../../providers/platform/working-calendar.js';

export interface WorkCalendarView {
  timeZone: string;
  today: string;
  workHours: WorkHours;
}

export interface CalendarDayView {
  date: string;
  kind: CalendarDayKind;
  note: string | null;
  updatedAt: string;
}

export const calendarDayView = (day: CalendarDayRecord): CalendarDayView => ({
  date: day.date,
  kind: day.kind,
  note: day.note,
  updatedAt: day.updatedAt.toISOString(),
});

export interface DictionaryTypeView {
  type: string;
  extraFields: {
    name: string;
    type: 'boolean' | 'integer' | 'number' | 'enum';
    nullable: boolean;
    min?: number;
    options?: readonly string[];
  }[];
}

export const dictionaryTypeView = (
  definition: DictionaryTypeDefinition,
): DictionaryTypeView => ({
  type: definition.type,
  extraFields: definition.extraFields.map((field) => ({ ...field })),
});

export interface DictionaryEntryView {
  id: string;
  type: string;
  code: string;
  label: { 'zh-CN'?: string; 'en-US'?: string };
  sortOrder: number;
  active: boolean;
  extra: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export const dictionaryEntryView = (
  entry: DictionaryEntry,
): DictionaryEntryView => ({
  id: entry.id,
  type: entry.type,
  code: entry.code,
  label: { ...entry.label },
  sortOrder: entry.sortOrder,
  active: entry.active,
  extra: entry.extra,
  createdAt: entry.createdAt.toISOString(),
  updatedAt: entry.updatedAt.toISOString(),
});

export interface RuleVersionView {
  id: string;
  key: string;
  value: unknown;
  effectiveFrom: string;
  updatedBy: string | null;
  /** The display name of `updatedBy`, when the route resolved it. */
  updatedByName: string | null;
  note: string | null;
  createdAt: string;
}

export const ruleVersionView = (
  version: RuleVersion,
  names: ReadonlyMap<string, string> = new Map(),
): RuleVersionView => ({
  id: version.id,
  key: version.key,
  value: version.value,
  effectiveFrom: version.effectiveFrom.toISOString(),
  updatedBy: version.updatedBy,
  updatedByName: version.updatedBy
    ? (names.get(version.updatedBy) ?? null)
    : null,
  note: version.note,
  createdAt: version.createdAt.toISOString(),
});

export interface RuleSummaryView {
  key: string;
  domain: RuleDomain;
  type: RuleValueType;
  area: RuleSettingsArea;
  min?: number;
  options?: readonly string[];
  max?: number;
  allowFuture: boolean;
  defaultValue: unknown;
  current: RuleVersionView | null;
  scheduled: RuleVersionView[];
}

export function ruleSummaryView(
  definition: RuleDefinition,
  versions: readonly RuleVersion[],
  now: Date,
): RuleSummaryView {
  const sorted = [...versions].sort(
    (a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime(),
  );
  const past = sorted.filter(
    (version) => version.effectiveFrom.getTime() <= now.getTime(),
  );
  const current = past.at(-1);
  return {
    key: definition.key,
    domain: definition.domain,
    type: definition.type,
    area: definition.area,
    ...(definition.min === undefined ? {} : { min: definition.min }),
    ...(definition.max === undefined ? {} : { max: definition.max }),
    allowFuture: definition.allowFuture,
    defaultValue: definition.defaultValue,
    current: current ? ruleVersionView(current) : null,
    scheduled: sorted
      .filter((version) => version.effectiveFrom.getTime() > now.getTime())
      .map((version) => ruleVersionView(version)),
  };
}

export type SequenceView = SequenceCounter;

export interface AuditLogView {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
  at: string;
}

export const auditLogView = (
  record: AuditLogRecord,
  actorNames: ReadonlyMap<string, string>,
): AuditLogView => ({
  id: String(record.id),
  actorId: record.actorId ?? null,
  actorName: record.actorId ? (actorNames.get(record.actorId) ?? null) : null,
  action: record.action,
  targetType: record.targetType,
  targetId: record.targetId ?? null,
  before: record.before ?? null,
  after: record.after ?? null,
  reason: record.reason ?? null,
  at: new Date(record.at).toISOString(),
});
