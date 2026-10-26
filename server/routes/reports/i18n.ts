import { i18nToken } from '@nocobase/app-server/i18n';
import type { Application } from '@nocobase/app-server/application';
import { getRequestLocale } from '@nocobase/i18n/server';
import type { Context } from 'hono';
import { z } from 'zod';
import locales from '../../locales/index.js';

/** Use the application's declared language set for explicit report locale parameters. */
export const reportLocaleSchema = z.enum(Object.keys(locales)).default('en-US');

export async function getReportTranslator(
  app: Application,
  context: Context,
  requestedLocale?: string,
) {
  const i18n = app.container.resolve(i18nToken);
  const locale = i18n.resolveLocale(
    requestedLocale ?? getRequestLocale(context),
  );
  await i18n.ensureLocaleLoaded(locale);
  return { locale, t: i18n.getFixedT('nb3-oa', locale) };
}
