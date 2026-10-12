import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../audit/index.js';
import { createReassignmentJournal } from './journal.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { departureApprovalReassignmentToken } from '../departure/contract.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { createDepartureReassignment } from './service.js';
import { resolveReassignmentOwners } from './owners.js';
import { handoverDepartureWorkItems } from './work-items.js';

export default class DepartureReassignmentProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/departure-reassignment';
  public override register() {
    this.app.container.singleton(departureApprovalReassignmentToken, () =>
      createDepartureReassignment({
        directory: this.app.container.resolve(approvalDirectoryServiceToken),
        journal: createReassignmentJournal(
          this.app.container.resolve(databaseManagerToken),
          this.app.container.resolve(auditServiceToken),
        ),
        // Resolve at execution, after every provider is registered, avoiding departure's lazy dependency cycle.
        owners: () => resolveReassignmentOwners(this.app),
        handoverWorkItems: (input, actorId) =>
          handoverDepartureWorkItems(this.app, input, actorId),
      }),
    );
  }
}
