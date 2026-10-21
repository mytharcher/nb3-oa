import { sampleDataToken } from '@nocobase/app-server/sample-data';
import { oaSampleData } from '../../samples/oa.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { installDemoIdentityTracking } from './identities.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  createSecretsTableStore,
  secretsServiceToken,
} from '@nocobase/app-server/secrets';
import { demoDataServiceToken } from './contract.js';
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
    c.resolve(sampleDataToken).register(oaSampleData(this.app));
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
