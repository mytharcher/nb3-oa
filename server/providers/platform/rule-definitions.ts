/**
 * Every approval rule key the application knows: its domain, value type, unit, bounds and default. The settings page
 * renders its editor from this metadata, the server validates every new version against it, and the default-rules
 * seed writes `defaultValue` (the seed keeps its own copy, since a seed is history and must not import this file).
 *
 * Adding a key: add it here, add its label and description under `platform.rules.keys` in the client locales, and add
 * a seed (a new file) that inserts its default with `effectiveFrom` at the epoch.
 */
import { z } from 'zod';

import { isValidTimeZone } from './time-zone.js';
import { DEFAULT_TIME_ZONE, isValidWorkHours } from './working-calendar.js';

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

/**
 * - `money`: an amount in yuan, ≥ 0.
 * - `count`: a whole number of times, ≥ 0.
 * - `integer`: a whole-number setting without an event-count unit.
 * - `days`: days in half-day steps, ≥ 0.
 * - `hours`: hours, ≥ 0.
 * - `workingHours`: hours counted on the work calendar, > 0.
 * - `ratio`: a fraction between 0 and 1, shown as a percentage.
 * - `rank`: a grade rank (`grades.rank`), a whole number.
 * - `workHours`: a daily working window `{ start, end }` in `HH:mm`.
 * - `timeZone`: an IANA time zone name.
 */
export const RULE_VALUE_TYPES = [
  'money',
  'count',
  'integer',
  'days',
  'hours',
  'workingHours',
  'ratio',
  'rank',
  'workHours',
  'timeZone',
] as const;
export type RuleValueType = (typeof RULE_VALUE_TYPES)[number];

/** Which settings item governs editing the key: the rules page, or the work calendar page. */
export type RuleSettingsArea = 'rules' | 'calendar';

export interface RuleDefinition {
  readonly key: string;
  readonly domain: RuleDomain;
  readonly type: RuleValueType;
  readonly defaultValue: unknown;
  readonly min?: number;
  readonly max?: number;
  readonly area: RuleSettingsArea;
  /**
   * Whether a version may take effect in the future. The time zone may not: the calendar converts every instant with
   * one zone, and a zone that changes at a future instant would make earlier computations disagree with later ones.
   */
  readonly allowFuture: boolean;
}

function rule(
  key: string,
  domain: RuleDomain,
  type: RuleValueType,
  defaultValue: unknown,
  options: Partial<
    Pick<RuleDefinition, 'min' | 'max' | 'area' | 'allowFuture'>
  > = {},
): RuleDefinition {
  return {
    key,
    domain,
    type,
    defaultValue,
    area: options.area ?? 'rules',
    allowFuture: options.allowFuture ?? true,
    ...(options.min === undefined ? {} : { min: options.min }),
    ...(options.max === undefined ? {} : { max: options.max }),
  };
}

export const RULE_DEFINITIONS: readonly RuleDefinition[] = [
  rule('itRepair.morning', 'calendar', 'workHours', {
    start: '09:00',
    end: '12:00',
  }),
  rule('itRepair.afternoon', 'calendar', 'workHours', {
    start: '13:00',
    end: '18:00',
  }),
  ...(['P1', 'P2', 'P3', 'P4'] as const).flatMap((p, i) => [
    rule(`itRepair.${p}.response`, 'sla', 'workingHours', [1, 2, 4, 8][i]),
    rule(`itRepair.${p}.resolution`, 'sla', 'workingHours', [4, 8, 16, 40][i]),
  ]),
  // The unified spend ladder (02 §4) and the other money thresholds.
  rule('spend.vp', 'spend', 'money', 50_000),
  rule('spend.gm', 'spend', 'money', 200_000),
  rule('expense.head', 'spend', 'money', 10_000),
  rule('loan.head', 'spend', 'money', 10_000),
  rule('loan.personalMax', 'spend', 'money', 50_000),
  rule('purchase.quotes', 'spend', 'money', 50_000),
  rule('contract.gm', 'spend', 'money', 100_000),
  rule('asset.scrapGm', 'spend', 'money', 10_000),
  rule('budget.increaseGm', 'spend', 'money', 50_000),
  // Leave tiers.
  rule('leave.head', 'leave', 'days', 3),
  rule('leave.hr', 'leave', 'days', 7),
  // Accrual stays disabled until HR fills career-start dates and enables the daily job deliberately.
  rule('leave.annualAccrualEnabled', 'leave', 'integer', 0, { max: 1 }),
  rule('leave.annualCarryExpiryMonth', 'leave', 'integer', 3, {
    min: 1,
    max: 12,
  }),
  rule('leave.annualCarryExpiryDay', 'leave', 'integer', 31, {
    min: 1,
    max: 31,
  }),
  // Attendance.
  rule('overtime.monthlyHead', 'attendance', 'hours', 36),
  rule('attendance.fixPerMonth', 'attendance', 'count', 3),
  // HR tiers. Grade ranks are integers where larger is more senior; the defaults assume the grade table puts
  // managers at rank 5 and directors at rank 7 and must be aligned with the grades the organisation actually uses.
  rule('grade.managerRank', 'hr', 'rank', 5, { min: 0 }),
  rule('grade.directorRank', 'hr', 'rank', 7, { min: 0 }),
  rule('raise.vp', 'hr', 'ratio', 0.2, { min: 0, max: 1 }),
  rule('raise.gm', 'hr', 'ratio', 0.3, { min: 0, max: 1 }),
  // Approval clocks, in working hours (02 §2 rule 7, §6).
  rule('sla.remindHours', 'sla', 'workingHours', 24, { min: 1 }),
  rule('sla.escalateHours', 'sla', 'workingHours', 48, { min: 1 }),
  rule('sla.urgeCooldownHours', 'sla', 'workingHours', 4, { min: 0 }),
  // Review committees (README default 9): the default passing vote count.
  rule('committee.min', 'committee', 'count', 2, { min: 1 }),
  // The work calendar, edited on the calendar page.
  rule(
    'calendar.workHours',
    'calendar',
    'workHours',
    {
      start: '09:00',
      end: '18:00',
    },
    { area: 'calendar' },
  ),
  rule('calendar.timeZone', 'calendar', 'timeZone', DEFAULT_TIME_ZONE, {
    area: 'calendar',
    allowFuture: false,
  }),
];

const definitionsByKey = new Map(
  RULE_DEFINITIONS.map((definition) => [definition.key, definition]),
);

export function ruleDefinitionOf(key: string): RuleDefinition | undefined {
  return definitionsByKey.get(key);
}

/** Pairs that must stay ordered: the first key's value may not exceed the second's at any instant. */
export const RULE_ORDERINGS: readonly (readonly [string, string])[] = [
  ['spend.vp', 'spend.gm'],
  ['leave.head', 'leave.hr'],
  ['grade.managerRank', 'grade.directorRank'],
  ['raise.vp', 'raise.gm'],
  ['sla.remindHours', 'sla.escalateHours'],
];

function numberSchema(definition: RuleDefinition): z.ZodType<number> {
  let schema = z.number();
  const min = definition.min ?? (definition.type === 'workingHours' ? 1 : 0);
  schema = schema.min(min);
  if (definition.max !== undefined) schema = schema.max(definition.max);
  switch (definition.type) {
    case 'count':
    case 'integer':
    case 'rank':
      return schema.int();
    case 'days':
      return schema.multipleOf(0.5);
    default:
      return schema;
  }
}

/** The zod schema a value of the key must satisfy. */
export function ruleValueSchema(
  definition: RuleDefinition,
): z.ZodType<unknown> {
  switch (definition.type) {
    case 'workHours':
      return z
        .strictObject({ start: z.string(), end: z.string() })
        .refine(isValidWorkHours, {
          message:
            'Working hours must be two HH:mm times, the start before the end.',
        });
    case 'timeZone':
      return z.string().refine(isValidTimeZone, {
        message: 'Not a time zone this server knows.',
      });
    default:
      return numberSchema(definition);
  }
}
