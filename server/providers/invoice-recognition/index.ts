import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
export const INVOICE_RECOGNITION = 'oa.invoiceRecognition';
export default class InvoiceRecognitionProvider extends ServiceProvider<Application> {
  readonly name = 'oa/invoice-recognition';
  override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    const title = { key: 'invoiceRecognition.title', ns: 'nb3-oa' };
    authz.settings.add({
      id: INVOICE_RECOGNITION,
      title,
      actions: ['read', 'recognize', 'verify'].map((name) => ({
        name,
        title: { key: `invoiceRecognition.${name}Permission`, ns: 'nb3-oa' },
      })),
    });
    authz.ui.sections.add({
      name: INVOICE_RECOGNITION,
      parent: 'administration',
      title,
    });
    authz.ui.place(
      { type: 'settings', id: INVOICE_RECOGNITION },
      { section: INVOICE_RECOGNITION },
    );
  }
}
