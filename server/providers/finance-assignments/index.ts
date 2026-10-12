import type { Application } from '@nocobase/app-server/application';
import { ServiceProvider } from '@nocobase/service-provider';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { auditServiceToken } from '../audit/index.js';
import { orgServiceToken } from '../org/contract.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import {
  financeAssignmentServiceToken,
  FINANCE_ASSIGNMENTS_SETTINGS,
} from './contract.js';
import { createFinanceAssignmentService } from './service.js';
export * from './contract.js';
export { FinanceAssignmentError } from './service.js';
export default class FinanceAssignmentsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/finance-assignments-provider';
  public override register() {
    const c = this.app.container;
    c.singleton(financeAssignmentServiceToken, () =>
      createFinanceAssignmentService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        org: c.resolve(orgServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
      }),
    );
  }
  public override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    authz.settings.add({
      id: FINANCE_ASSIGNMENTS_SETTINGS,
      title: { key: 'financeAssignments.authz.title', ns: 'nb3-oa' },
      actions: ['read', 'update'].map((name) => ({
        name,
        title: { key: `financeAssignments.authz.${name}`, ns: 'nb3-oa' },
      })),
    });
    authz.ui.sections.add({
      name: FINANCE_ASSIGNMENTS_SETTINGS,
      parent: 'administration',
      title: { key: 'financeAssignments.authz.title', ns: 'nb3-oa' },
    });
    authz.ui.place(
      { type: 'settings', id: FINANCE_ASSIGNMENTS_SETTINGS },
      { section: FINANCE_ASSIGNMENTS_SETTINGS },
    );
  }
}
