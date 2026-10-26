import cronstrue from 'cronstrue';
import 'cronstrue/locales/de.js';
import 'cronstrue/locales/es.js';
import 'cronstrue/locales/fr.js';
import 'cronstrue/locales/id.js';
import 'cronstrue/locales/ja.js';
import 'cronstrue/locales/ko.js';
import 'cronstrue/locales/pt_BR.js';
import 'cronstrue/locales/ru.js';
import 'cronstrue/locales/vi.js';
import 'cronstrue/locales/zh_CN.js';
import 'cronstrue/locales/zh_TW.js';

const cronLocales: Record<string, string> = {
  'en-US': 'en',
  'es-ES': 'es',
  'fr-FR': 'fr',
  'de-DE': 'de',
  'pt-BR': 'pt_BR',
  'ru-RU': 'ru',
  'id-ID': 'id',
  'vi-VN': 'vi',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
};

export function formatCronDescription(
  expression: string,
  language: string,
): string | undefined {
  try {
    return cronstrue.toString(expression, {
      locale: cronLocales[language] ?? 'en',
      throwExceptionOnParseError: true,
    });
  } catch {
    return undefined;
  }
}
