import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import { auditServiceToken } from '../audit/index.js';
import { invoiceServiceToken } from './contract.js';
import { createInvoiceService } from './service.js';
export * from './contract.js';
export { InvoiceError, normalizeInvoiceNumber } from './service.js';
export default class InvoicesProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/invoices-provider';
  public override register(): void {
    const c = this.app.container;
    c.singleton(invoiceServiceToken, () =>
      createInvoiceService(
        c.resolve(databaseManagerToken),
        c.resolve(auditServiceToken),
      ),
    );
  }
}
