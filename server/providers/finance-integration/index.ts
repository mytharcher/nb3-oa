import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
export const FINANCE_INTEGRATION = 'oa.financeIntegration';
export default class FinanceIntegrationProvider extends ServiceProvider<Application> {
  readonly name = 'oa/finance-integration';
  override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    const title = { key: 'financeIntegration.title', ns: 'nb3-oa' };
    authz.settings.add({
      id: FINANCE_INTEGRATION,
      title,
      actions: ['read', 'send'].map((name) => ({
        name,
        title: { key: `financeIntegration.${name}Permission`, ns: 'nb3-oa' },
      })),
    });
    authz.ui.sections.add({
      name: FINANCE_INTEGRATION,
      parent: 'administration',
      title,
    });
    authz.ui.place(
      { type: 'settings', id: FINANCE_INTEGRATION },
      { section: FINANCE_INTEGRATION },
    );
  }
}
