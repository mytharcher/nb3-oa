import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { i18nToken } from '@nocobase/app-server/i18n';
import { auditServiceToken } from '../audit/index.js';
import { budgetServiceToken } from '../budgets/contract.js';
import { calendarServiceToken } from '../platform/calendar.js';
import { expenseAuthorizationServiceToken } from './contract.js';
import { createExpenseAuthorizationService } from './service.js';
export * from './contract.js';
export { ExpenseAuthorizationError } from './service.js';
export default class ExpenseAuthorizationsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/expense-authorizations-provider';
  public override register(): void {
    const c = this.app.container;
    c.singleton(expenseAuthorizationServiceToken, () =>
      createExpenseAuthorizationService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        budget: c.resolve(budgetServiceToken),
        calendar: c.resolve(calendarServiceToken),
      }),
    );
  }
  public override async boot(): Promise<void> {
    const c = this.app.container,
      scheduler = c.resolve(schedulerServiceToken),
      i18n = c.resolve(i18nToken),
      locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    const t = i18n.getFixedT('nb3-oa', locale);
    scheduler.registerTarget({
      type: 'app.expense-authorization-expiry',
      title: t('expenseAuthorizations.scheduleTitle'),
      validate(config) {
        return config !== null &&
          typeof config === 'object' &&
          !Array.isArray(config) &&
          Object.keys(config).length === 0
          ? { valid: true }
          : { valid: false, reason: 'expense-expiry-config-must-be-empty' };
      },
      start: async () => {
        const result = await c
          .resolve(expenseAuthorizationServiceToken)
          .expireDue();
        return { state: 'completed', outcome: 'succeeded', result };
      },
    });
    await c.resolve(calendarServiceToken).reload();
    scheduler.defineSchedule({
      key: 'oa.expense-authorizations.expire',
      title: t('expenseAuthorizations.scheduleTitle'),
      description: t('expenseAuthorizations.scheduleDescription'),
      schedule: {
        cron: '15 0 * * *',
        timezone: c.resolve(calendarServiceToken).timeZone(),
      },
      target: { type: 'app.expense-authorization-expiry', config: {} },
    });
  }
}
