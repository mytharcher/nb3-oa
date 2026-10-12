import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import { auditServiceToken } from '../audit/index.js';
import { budgetServiceToken } from './contract.js';
import { createBudgetService } from './service.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
export const BUDGET_SETTINGS = 'oa.budgets';
export * from './contract.js';
export { BudgetError } from './service.js';
export default class BudgetsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/budgets-provider';
  public override register(): void {
    const c = this.app.container;
    c.singleton(budgetServiceToken, () =>
      createBudgetService(
        c.resolve(databaseManagerToken),
        c.resolve(auditServiceToken),
      ),
    );
  }
  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.settings.add({
      id: BUDGET_SETTINGS,
      title: { key: 'budgets.authz.title', ns: 'nb3-oa' },
      actions: ['read', 'update'].map((name) => ({
        name,
        title: { key: `budgets.authz.${name}`, ns: 'nb3-oa' },
      })),
    });
    authz.ui.sections.add({
      name: BUDGET_SETTINGS,
      parent: 'administration',
      title: { key: 'budgets.authz.title', ns: 'nb3-oa' },
    });
    authz.ui.place(
      { type: 'settings', id: BUDGET_SETTINGS },
      { section: BUDGET_SETTINGS },
    );
  }
}
