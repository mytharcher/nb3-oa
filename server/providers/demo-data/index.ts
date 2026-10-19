import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { installDemoIdentityTracking } from './identities.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  createSecretsTableStore,
  secretsServiceToken,
} from '@nocobase/app-server/secrets';
import { DEMO_SETTINGS, demoDataServiceToken } from './contract.js';
import { createDemoDataService } from './service.js';
import { installDemoOwnership } from './ownership.js';
export * from './contract.js';
export default class DemoDataProvider extends ServiceProvider<Application> {
  readonly name = 'oa/demo-data';
  private stopOwnership?: () => void;
  private stopIdentities?: () => void;
  private timer?: ReturnType<typeof setInterval>;
  override register() {
    this.app.container.singleton(demoDataServiceToken, () =>
      createDemoDataService(this.app),
    );
  }
  override async boot() {
    const c = this.app.container;
    const authz = c.resolve(authorizationToken);
    authz.settings.add({
      id: DEMO_SETTINGS,
      title: { key: 'demoData.title', ns: 'nb3-oa' },
      actions: ['read', 'import', 'remove', 'credentials'].map((name) => ({
        name,
        title: { key: `demoData.authz.${name}`, ns: 'nb3-oa' },
      })),
    });
    authz.ui.sections.add({
      name: 'oa.demoData',
      parent: 'administration',
      title: { key: 'demoData.title', ns: 'nb3-oa' },
    });
    authz.ui.place(
      { type: 'settings', id: DEMO_SETTINGS },
      { section: 'oa.demoData' },
    );
    c.resolve(secretsServiceToken).registerStore(
      createSecretsTableStore({
        name: 'oa-demo-data',
        connection: () => c.resolve(databaseManagerToken).connection(),
        table: 'demoDataSets',
        columns: [
          {
            column: 'credentials',
            purpose: 'nb3-oa/demo-data/credentials',
            aad: (row) => [String(row.id)],
          },
        ],
      }),
    );
  }
  override async start() {
    this.stopIdentities = installDemoIdentityTracking(
      this.app.container.resolve(userAdministrationServiceToken),
      this.app.container.resolve(databaseManagerToken),
    );
    this.stopOwnership = installDemoOwnership(
      this.app.container.resolve(databaseManagerToken),
    );
    const service = this.app.container.resolve(demoDataServiceToken);
    await service.resume();
    this.timer = setInterval(() => {
      void service.resume().catch(() => {});
    }, 15000);
    this.timer.unref();
  }
  override async shutdown() {
    if (this.timer) clearInterval(this.timer);
    await this.app.container.resolve(demoDataServiceToken).idle();
    this.stopOwnership?.();
    this.stopIdentities?.();
  }
}
