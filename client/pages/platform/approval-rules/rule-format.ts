import type { useTranslation } from '@nocobase/i18n/client';

import type { RuleSummary, RuleValueType, WorkHours } from '../shared/types.js';

/** The settings item of the page; keep in step with `PLATFORM_SETTINGS.rules` on the server. */
export const RULES_SETTINGS = 'oa.platform.rules';

/** A rule key as a translation key segment: `spend.vp` → `spend_vp` (dots would nest the key). */
export function ruleKeyId(key: string): string {
  return key.replace(/\./g, '_');
}

export interface RulesOutletContext {
  /** Refreshes the rule list (and the history drawer, when it is the view behind). */
  readonly reload: () => void;
}

type Translate = ReturnType<typeof useTranslation>['t'];

/** A rule value as text in the current language, with its unit. */
export function formatRuleValue(
  t: Translate,
  locale: string,
  type: RuleValueType,
  value: unknown,
): string {
  if (type === 'workHours') {
    const hours = value as Partial<WorkHours> | null;
    return hours?.start && hours.end ? `${hours.start}–${hours.end}` : '—';
  }
  if (type === 'timeZone') return typeof value === 'string' ? value : '—';
  if (typeof value !== 'number') return '—';
  if (type === 'ratio')
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      maximumFractionDigits: 2,
    }).format(value);
  const number = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);
  return t(`platform.rules.units.${type}`, { value: number });
}

/** Whether a rule's value is entered as a number in the change dialog (all but the calendar's). */
export function isNumericRule(rule: Pick<RuleSummary, 'type'>): boolean {
  return rule.type !== 'workHours' && rule.type !== 'timeZone';
}
