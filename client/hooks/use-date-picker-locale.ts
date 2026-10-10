import { useLocale } from '@nocobase/i18n/client';
import type { Locale } from 'react-day-picker';
import { enUS, zhCN } from 'react-day-picker/locale';

/**
 * The calendar locale for the interface language. react-day-picker's locales are date-fns locales plus the
 * calendar's own labels ("Go to next month"), so the trigger text and the calendar's buttons follow the language.
 * Add a line when the application adds a language.
 */
export function useDatePickerLocale(): Locale {
  const { locale } = useLocale();
  return locale.startsWith('zh') ? zhCN : enUS;
}
