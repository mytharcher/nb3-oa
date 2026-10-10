import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { auditServiceToken } from '../audit/index.js';
import { orgServiceToken } from '../org/contract.js';
import {
  organizationServiceToken,
  registerDepartmentScopes,
} from '../org/index.js';
import {
  createReportingScopes,
  registerEmployeeResources,
  registerEmployeeSubjects,
  registerReportingAccess,
} from './authorization.js';
import {
  employeeServiceToken,
  reportingScopesToken,
  type EmployeeService,
} from './contract.js';
import {
  createEmployeeService,
  type EmployeeModuleService,
} from './service.js';

export * from './contract.js';
export {
  DIRECTORY_PAGE,
  EMPLOYEES_SETTINGS,
  POSITION_SUBJECT,
  REPORTING_MANAGER_SUBJECT,
} from './authorization.js';

/** Provider of the `employees` OA module: archive service, reporting-line record access and subject types. */
export default class EmployeesProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/employees-provider';

  private readonly scopes = createReportingScopes();
  private releaseSubjects?: () => void;

  public override register(): void {
    const container = this.app.container;
    // Bound as an instance so later providers can call `use()` from their own `register()`.
    container.instance(reportingScopesToken, this.scopes);
    this.scopes.use('employees', { field: 'userId', identifies: 'user' });
    this.scopes.use('employeeProfiles', {
      field: 'employeeId',
      identifies: 'employee',
    });
    this.scopes.use('employeeCompensation', {
      field: 'employeeId',
      identifies: 'employee',
    });

    container.singleton(employeeServiceToken, () =>
      createEmployeeService({
        database: container.resolve(databaseManagerToken),
        audit: () => container.resolve(auditServiceToken),
        users: () => container.resolve(userAdministrationServiceToken),
        ids: () => container.resolve(idGeneratorToken),
        // The org module binds its service concurrently; without it, department and position lookups are empty.
        org: () =>
          container.has(orgServiceToken)
            ? container.resolve(orgServiceToken)
            : undefined,
        onSubjectsChanged: async (userIds) => {
          // Absent in an application composed without the authorization plugin: nothing to refresh then.
          if (!container.has(authorizationToken)) return;
          const authz = container.resolve(authorizationToken);
          for (const id of userIds)
            await authz.permissionSets.notifyAssignmentsChanged({
              type: 'user',
              id,
            });
        },
      }),
    );
  }

  public override async boot(): Promise<void> {
    const container = this.app.container;
    // An application composed without the authorization plugin (as some runtime tests are) has nothing to register into.
    if (!container.has(authorizationToken)) return;
    const authz = container.resolve(authorizationToken);
    const service = employeeModuleService(
      container.resolve(employeeServiceToken),
    );
    // Record access first: the composites registered next may offer it.
    registerReportingAccess(authz, this.scopes, () => service.loadGraph());
    // 本部门 / 本部门及下属部门 on archives, by the employee's department memberships (the org module's helper).
    if (container.has(organizationServiceToken))
      registerDepartmentScopes(
        authz,
        container.resolve(organizationServiceToken),
        {
          prefix: 'oa.employees',
          targets: [{ collection: 'employees', ownerField: 'userId' }],
        },
      );
    registerEmployeeResources(authz);
    this.releaseSubjects = registerEmployeeSubjects(authz, {
      loadGraph: (connection) => service.loadGraph(connection),
      positionOf: async (userId) => {
        const employee = await service.getByUserId(userId);
        return employee?.active ? employee.positionId : null;
      },
      org: () =>
        container.has(orgServiceToken)
          ? container.resolve(orgServiceToken)
          : undefined,
    });
  }

  public override async shutdown(): Promise<void> {
    this.releaseSubjects?.();
    this.releaseSubjects = undefined;
  }
}

/** The bound `EmployeeService` is the module service; this narrows it for the module's own routes. */
export function employeeModuleService(
  service: EmployeeService,
): EmployeeModuleService {
  return service as EmployeeModuleService;
}
