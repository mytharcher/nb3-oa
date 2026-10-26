import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { useDatePickerLocale } from '../../client/hooks/use-date-picker-locale.js';

const cases = [
  ['en-US', 'en-US'],
  ['es-ES', 'es'],
  ['fr-FR', 'fr'],
  ['de-DE', 'de'],
  ['pt-BR', 'pt-BR'],
  ['ru-RU', 'ru'],
  ['id-ID', 'id'],
  ['vi-VN', 'vi'],
  ['zh-CN', 'zh-CN'],
  ['zh-TW', 'zh-TW'],
  ['ja-JP', 'ja'],
  ['ko-KR', 'ko'],
];

describe('date picker interface languages', () => {
  it.each(cases)(
    'uses the matching calendar locale for %s',
    async (locale, calendarCode) => {
      const runtime = new I18nRuntime({
        defaultLocale: 'en-US',
        locales: cases.map(([tag]) => tag),
        applicationNamespace: 'date-picker-test',
      });
      await runtime.init(locale);
      const { result } = renderHook(useDatePickerLocale, {
        wrapper: ({ children }: { children: ReactNode }) => (
          <I18nProvider runtime={runtime}>{children}</I18nProvider>
        ),
      });
      expect(result.current.code).toBe(calendarCode);
    },
  );
});
