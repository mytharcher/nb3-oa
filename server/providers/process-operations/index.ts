import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
export const PROCESS_OPERATIONS = 'oa.processOperations';
export default class ProcessOperationsProvider extends ServiceProvider<Application> {
  readonly name = 'oa/process-operations';
  override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    const title = { key: 'processOperations.title', ns: 'nb3-oa' };
    authz.settings.add({
      id: PROCESS_OPERATIONS,
      title,
      actions: [
        {
          name: 'read',
          title: { key: 'processOperations.read', ns: 'nb3-oa' },
        },
      ],
    });
    authz.ui.sections.add({
      name: PROCESS_OPERATIONS,
      parent: 'administration',
      title,
    });
    authz.ui.place(
      { type: 'settings', id: PROCESS_OPERATIONS },
      { section: PROCESS_OPERATIONS },
    );
  }
}
