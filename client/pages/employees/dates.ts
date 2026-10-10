import { useLocale } from '@nocobase/i18n/client';
import { parseISO } from 'date-fns';
import { useMemo } from 'react';

/** A `YYYY-MM-DD` calendar date as the `Date` a DatePicker holds; empty stays `undefined`. */
export function parseDay(value: string | null | undefined): Date | undefined {
  const parsed: Date | undefined = value ? parseISO(value) : undefined;
  return parsed;
}

/** Formats a `YYYY-MM-DD` calendar date in the current language; `null` stays `null`. */
export function useDateText(): (
  value: string | null | undefined,
) => string | null {
  const { locale } = useLocale();
  const format = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }),
    [locale],
  );
  return (value) =>
    value ? format.format(new Date(`${value.slice(0, 10)}T00:00:00`)) : null;
}
