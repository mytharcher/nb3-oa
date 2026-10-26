import { useLocale } from '@nocobase/i18n/client';
import type { Locale } from 'react-day-picker';
import {
  de,
  enUS,
  es,
  fr,
  id,
  ja,
  ko,
  ptBR,
  ru,
  vi,
  zhCN,
  zhTW,
} from 'react-day-picker/locale';

const calendarLocales: Record<string, Locale> = {
  'en-US': enUS,
  'es-ES': es,
  'fr-FR': fr,
  'de-DE': de,
  'pt-BR': ptBR,
  'ru-RU': ru,
  'id-ID': id,
  'vi-VN': vi,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'ja-JP': ja,
  'ko-KR': ko,
};

/** Calendar labels and month names follow the selected interface language. */
export function useDatePickerLocale(): Locale {
  const { locale } = useLocale();
  return calendarLocales[locale] ?? enUS;
}
