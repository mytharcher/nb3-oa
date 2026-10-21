import type { useTranslation } from '@nocobase/i18n/client';
import { z } from 'zod';

import type { RuleSummary } from '../shared/types.js';

type Translate = ReturnType<typeof useTranslation>['t'];

/** The value in effect as it is typed in the input: ratios as percentages, empty when not a number. */
export function ruleInputOf(rule: RuleSummary): string {
  const value = rule.current?.value ?? rule.defaultValue;
  if (typeof value !== 'number') return '';
  return String(
    rule.type === 'ratio' ? Math.round(value * 10000) / 100 : value,
  );
}

/** The typed input as the value the server stores. */
export function ruleValueOf(rule: Pick<RuleSummary, 'type'>, input: string) {
  return rule.type === 'ratio' ? Number(input) / 100 : Number(input);
}

/** Validates a typed numeric rule value against the key's type and bounds. */
export function ruleInputSchema(rule: RuleSummary, t: Translate) {
  const ratio = rule.type === 'ratio';
  const min = rule.min ?? (rule.type === 'workingHours' ? 1 : 0);
  const max = rule.max;
  return z
    .string()
    .trim()
    .min(1, t('platform.rules.errors.valueRequired'))
    .refine(
      (value) => !Number.isNaN(Number(value)),
      t('platform.rules.errors.notANumber'),
    )
    .refine(
      (value) => {
        const number = ruleValueOf(rule, value);
        return number >= min && (max === undefined || number <= max);
      },
      ratio
        ? t('platform.rules.errors.percentRange', {
            min: min * 100,
            max: (max ?? 1) * 100,
          })
        : t('platform.rules.errors.minimum', { min }),
    )
    .refine(
      (value) =>
        !['count', 'rank', 'integer'].includes(rule.type) ||
        Number.isInteger(Number(value)),
      t('platform.rules.errors.integer'),
    )
    .refine(
      (value) => rule.type !== 'days' || Number.isInteger(Number(value) * 2),
      t('platform.rules.errors.halfDays'),
    );
}
