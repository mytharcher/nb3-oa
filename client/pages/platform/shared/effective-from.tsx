import { useTranslation } from '@nocobase/i18n/client';
import { addDays, startOfDay } from 'date-fns';
import { type ReactElement, useState } from 'react';

import { DatePicker } from '#components/date-picker';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '#components/ui/field';
import { RadioGroup, RadioGroupItem } from '#components/ui/radio-group';

import type { EffectiveMode } from './effective-from-value.js';

export interface EffectiveFromFieldsProps {
  readonly formId: string;
  readonly mode: EffectiveMode;
  readonly date: Date | undefined;
  readonly onModeChange: (mode: EffectiveMode) => void;
  readonly onDateChange: (date: Date | undefined) => void;
  readonly dateError?: string;
  readonly disabled?: boolean;
}

/** "Takes effect: immediately / from a date" for a new rule version. */
export function EffectiveFromFields({
  formId,
  mode,
  date,
  onModeChange,
  onDateChange,
  dateError,
  disabled,
}: EffectiveFromFieldsProps): ReactElement {
  const { t } = useTranslation();
  // Versions never take effect in the past: the first date offered is tomorrow, fixed when the fields mount.
  const [tomorrow] = useState(() => addDays(startOfDay(new Date()), 1));
  return (
    <FieldSet>
      <FieldLegend variant='label'>
        {t('platform.rules.effective.label')}
      </FieldLegend>
      <RadioGroup
        value={mode}
        onValueChange={(value) => onModeChange(value as EffectiveMode)}
        disabled={disabled}
      >
        <Field orientation='horizontal'>
          <RadioGroupItem value='now' id={`${formId}-effective-now`} />
          <FieldLabel
            htmlFor={`${formId}-effective-now`}
            className='font-normal'
          >
            {t('platform.rules.effective.now')}
          </FieldLabel>
        </Field>
        <Field orientation='horizontal'>
          <RadioGroupItem value='date' id={`${formId}-effective-date`} />
          <FieldLabel
            htmlFor={`${formId}-effective-date`}
            className='font-normal'
          >
            {t('platform.rules.effective.fromDate')}
          </FieldLabel>
        </Field>
      </RadioGroup>
      {mode === 'date' ? (
        <Field data-invalid={dateError ? true : undefined}>
          <FieldLabel
            htmlFor={`${formId}-effective-picker`}
            className='sr-only'
          >
            {t('platform.rules.effective.dateLabel')}
          </FieldLabel>
          <DatePicker
            id={`${formId}-effective-picker`}
            value={date}
            onChange={onDateChange}
            disabled={disabled}
            invalid={Boolean(dateError)}
            disabledDays={{ before: tomorrow }}
          />
          <FieldDescription>
            {t('platform.rules.effective.hint')}
          </FieldDescription>
          <FieldError errors={dateError ? [{ message: dateError }] : []} />
        </Field>
      ) : null}
    </FieldSet>
  );
}
