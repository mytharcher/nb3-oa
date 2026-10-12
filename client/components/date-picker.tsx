import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import type { DateRange, Locale, Matcher } from 'react-day-picker';

import { useDatePickerLocale } from '#hooks/use-date-picker-locale';
import { Button } from '#components/ui/button';
import { Calendar } from '#components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';

export type { DateRange } from 'react-day-picker';

interface DatePickerBaseProps {
  /** The trigger's id, for `FieldLabel htmlFor`. */
  readonly id?: string;
  /** A date-fns (or react-day-picker) locale; defaults to the interface language. */
  readonly locale?: Locale;
  /** Defaults to `datePicker.placeholder` / `datePicker.rangePlaceholder`. */
  readonly placeholder?: string;
  /** date-fns pattern of the trigger text. Defaults to `PPP` (a long localized date). */
  readonly displayFormat?: string;
  readonly className?: string;
  readonly disabled?: boolean;
  /** Days that cannot be picked, such as `{ before: new Date() }`. */
  readonly disabledDays?: Matcher | Matcher[];
  /** Marks the trigger invalid (`aria-invalid`); `FieldError` below it carries the message. */
  readonly invalid?: boolean;
  /** Called when the popover closes, for react-hook-form's `onBlur`. */
  readonly onBlur?: () => void;
}

export interface DatePickerProps extends DatePickerBaseProps {
  readonly value: Date | undefined;
  readonly onChange: (date: Date | undefined) => void;
}

/**
 * A single date in a `Calendar` inside a `Popover`, as shadcn's Date Picker guide composes it.
 * A calendar date travels to the endpoint as `format(date, 'yyyy-MM-dd')` and comes back through `parseISO`.
 */
export function DatePicker({
  id,
  value,
  onChange,
  locale,
  placeholder,
  displayFormat = 'PPP',
  className,
  disabled,
  disabledDays,
  invalid,
  onBlur,
}: DatePickerProps): ReactElement {
  const { t } = useTranslation();
  const defaultLocale = useDatePickerLocale();
  const dateLocale = locale ?? defaultLocale;
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id={id}
            type='button'
            variant='outline'
            disabled={disabled}
            aria-invalid={invalid || undefined}
            data-empty={!value}
            className={cn(
              'w-60 justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon data-icon='inline-start' />
        {value ? (
          format(value, displayFormat, { locale: dateLocale })
        ) : (
          <span>{placeholder ?? t('datePicker.placeholder')}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={value}
          defaultMonth={value}
          onSelect={(date) => {
            onChange(date);
            // Closing from code does not call onOpenChange, so mark the field touched here too.
            setOpen(false);
            onBlur?.();
          }}
          disabled={disabledDays}
          locale={dateLocale}
          captionLayout='dropdown'
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRangePickerProps extends DatePickerBaseProps {
  readonly value: DateRange | undefined;
  readonly onChange: (range: DateRange | undefined) => void;
  /** Months shown side by side from `md` up. Defaults to 2. */
  readonly numberOfMonths?: number;
}

/** A date range (`{ from, to }`) in a two-month `Calendar` inside a `Popover`. The popover stays open until the user closes it. */
export function DateRangePicker({
  id,
  value,
  onChange,
  locale,
  placeholder,
  displayFormat = 'PP',
  className,
  disabled,
  disabledDays,
  invalid,
  onBlur,
  numberOfMonths = 2,
}: DateRangePickerProps): ReactElement {
  const { t } = useTranslation();
  const defaultLocale = useDatePickerLocale();
  const dateLocale = locale ?? defaultLocale;
  const from = value?.from;
  const to = value?.to;
  const label = from
    ? to
      ? `${format(from, displayFormat, { locale: dateLocale })} – ${format(to, displayFormat, { locale: dateLocale })}`
      : format(from, displayFormat, { locale: dateLocale })
    : undefined;

  return (
    <Popover
      onOpenChange={(next) => {
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id={id}
            type='button'
            variant='outline'
            disabled={disabled}
            aria-invalid={invalid || undefined}
            data-empty={!from}
            className={cn(
              'w-72 justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon data-icon='inline-start' />
        {label ?? (
          <span>{placeholder ?? t('datePicker.rangePlaceholder')}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='range'
          selected={value}
          defaultMonth={from}
          onSelect={onChange}
          numberOfMonths={numberOfMonths}
          disabled={disabledDays}
          locale={dateLocale}
        />
      </PopoverContent>
    </Popover>
  );
}
