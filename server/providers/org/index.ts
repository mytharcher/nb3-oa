import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { auditServiceToken } from '../audit/index.js';
import { registerOrgAuthorization } from './authorization.js';
import { orgServiceToken } from './contract.js';
import {
  createOrganizationService,
  organizationServiceToken,
} from './service.js';

export * from './constants.js';
export { OrgError, type OrgErrorCode } from './errors.js';
export {
  registerDepartmentScopes,
  type DepartmentScopeReferences,
  type DepartmentScopeTarget,
} from './scopes.js';
export * from './service.js';

/**
 * Provider of the `org` OA module: departments and memberships, positions, grades and the duty-role pool. It binds
 * one organisation service to both `organizationServiceToken` (the whole service) and the cross-module contract
 * `orgServiceToken`, and registers the settings items, subject types and workspace placement with authorization.
 */
export default class OrgProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/org-provider';

  private release: (() => void) | undefined;

  public override register(): void {
    this.app.container.singleton(organizationServiceToken, (container) => {
      const ids = container.resolve(idGeneratorToken);
      return createOrganizationService({
        database: container.resolve(databaseManagerToken),
        users: container.resolve(userAdministrationServiceToken),
        audit: container.resolve(auditServiceToken),
        generateId: () => ids.generateString(),
        // Clients cache their permission snapshot; the service calls this after the membership write commits.
        notifyUsers: async (userIds) => {
          if (!container.has(authorizationToken)) return;
          const authz = container.resolve(authorizationToken);
          for (const id of userIds)
            await authz.permissionSets.notifyAssignmentsChanged({
              type: 'user',
              id,
            });
        },
      });
    });
    this.app.container.singleton(orgServiceToken, (container) =>
      container.resolve(organizationServiceToken),
    );
  }

  public override async boot(): Promise<void> {
    // An application composed without the authorization plugin (such as a reduced test runtime) has nothing to
    // register with; the organisation itself still works.
    if (!this.app.container.has(authorizationToken)) return;
    this.release = registerOrgAuthorization(
      this.app.container.resolve(authorizationToken),
      this.app.container.resolve(organizationServiceToken),
    );
  }

  public override async shutdown(): Promise<void> {
    this.release?.();
    this.release = undefined;
  }
}
