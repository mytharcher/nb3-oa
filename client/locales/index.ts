import type { LocaleLoaders } from '@nocobase/i18n';

// One dynamic import per locale, so the browser downloads only the language it is showing.
const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'es-ES': () => import('./es-ES.js'),
  'fr-FR': () => import('./fr-FR.js'),
  'de-DE': () => import('./de-DE.js'),
  'pt-BR': () => import('./pt-BR.js'),
  'ru-RU': () => import('./ru-RU.js'),
  'id-ID': () => import('./id-ID.js'),
  'vi-VN': () => import('./vi-VN.js'),
  'zh-CN': () => import('./zh-CN.js'),
  'zh-TW': () => import('./zh-TW.js'),
  'ja-JP': () => import('./ja-JP.js'),
  'ko-KR': () => import('./ko-KR.js'),
};

export default locales;
