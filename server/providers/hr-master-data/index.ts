import {
  ServiceProvider,
  createServiceToken,
} from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { organizationServiceToken } from '../org/service.js';
import { employeeServiceToken } from '../employees/contract.js';
import { auditServiceToken } from '../audit/index.js';
import { createHrMasterDataService } from './service.js';
export const hrMasterDataToken =
  createServiceToken<ReturnType<typeof createHrMasterDataService>>(
    'oa/hr-master-data',
  );
export default class HrMasterDataProvider extends ServiceProvider<Application> {
  readonly name = 'oa/hr-master-data';
  register() {
    const c = this.app.container;
    c.singleton(hrMasterDataToken, () =>
      createHrMasterDataService({
        db: c.resolve(databaseManagerToken),
        org: c.resolve(organizationServiceToken),
        employees: c.resolve(employeeServiceToken),
        audit: c.resolve(auditServiceToken),
      }),
    );
  }
  async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    authz.settings.add({
      id: 'oa.hrMasterData',
      title: { key: 'hrMasterData.title', ns: 'nb3-oa' },
      actions: ['read', 'sync', 'manage'].map((name) => ({
        name,
        title: { key: `hrMasterData.${name}`, ns: 'nb3-oa' },
      })),
    });
    authz.ui.place(
      { type: 'settings', id: 'oa.hrMasterData' },
      { section: 'oa.org' },
    );
  }
}
