import type { Context } from 'hono';
import type { Application } from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
export async function localizedContractError(
  app: Application,
  ctx: Context,
  reason: string,
  defaultValue: string,
) {
  const i18n = app.container.resolve(i18nToken);
  const locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
  await i18n.ensureLocaleLoaded(locale);
  return {
    locale,
    message: i18n.getFixedT('nb3-oa', locale)(`contracts.errors.${reason}`, {
      defaultValue,
    }),
  };
}
