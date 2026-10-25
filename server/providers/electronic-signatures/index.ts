import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
export const ELECTRONIC_SIGNATURES = 'oa.electronicSignatures';
export default class ElectronicSignaturesProvider extends ServiceProvider<Application> {
  readonly name = 'oa/electronic-signatures';
  override async boot() {
    const authz = this.app.container.resolve(authorizationToken),
      title = { key: 'electronicSignatures.title', ns: 'nb3-oa' };
    authz.settings.add({
      id: ELECTRONIC_SIGNATURES,
      title,
      actions: ['read', 'send'].map((name) => ({
        name,
        title: { key: `electronicSignatures.${name}Permission`, ns: 'nb3-oa' },
      })),
    });
    authz.ui.sections.add({
      name: ELECTRONIC_SIGNATURES,
      parent: 'administration',
      title,
    });
    authz.ui.place(
      { type: 'settings', id: ELECTRONIC_SIGNATURES },
      { section: ELECTRONIC_SIGNATURES },
    );
  }
}
