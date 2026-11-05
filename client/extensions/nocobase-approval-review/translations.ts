import { useTranslation } from '@nocobase/i18n/client';
import enUS from './locales/en-US.js';
interface ReviewTranslation {
  t: (key: string, options?: Record<string, string | number>) => string;
  i18n: { language: string };
}
export function useReviewTranslation(): ReviewTranslation {
  const context = useTranslation();
  const t: ReviewTranslation['t'] = (key, options) => {
    let value: unknown = enUS;
    for (const part of key.split('.'))
      value =
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)[part]
          : undefined;
    return context.t(key, {
      defaultValue: typeof value === 'string' ? value : key,
      ...options,
    });
  };
  return { ...context, t };
}
