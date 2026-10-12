import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../audit/index.js';
import { loanLedgerServiceToken } from './contract.js';
import { createLoanLedgerService } from './service.js';
export * from './contract.js';
export { LoanLedgerError } from './service.js';
export default class LoanLedgerProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/loan-ledger-provider';
  public override register(): void {
    const c = this.app.container;
    c.singleton(loanLedgerServiceToken, () =>
      createLoanLedgerService(
        c.resolve(databaseManagerToken),
        c.resolve(auditServiceToken),
      ),
    );
  }
}
