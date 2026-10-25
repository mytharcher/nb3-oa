import { withCandidateDirectory } from './candidate-directory.js';
import type { OaApprovalDirectory } from '../approval-directory/contract.js';
import {
  isBusinessRead,
  requestBusinessRead,
} from '../request-performance/business-reads.js';
import type {
  ApprovalDirectory,
  ApprovalService,
} from '@nocobase/app-plugin-approval/server';
import {
  anyScope,
  condition,
  scopeAst,
  type DatabaseScope,
} from '@nocobase/app-plugin-authorization/server';
import type { DatabaseManager } from '@nocobase/db';
import type { EmployeeService } from '../employees/contract.js';
import type { OrgService } from '../org/contract.js';
import { approvalReadableRecords } from './query-service.js';

function isOaDirectory(
  directory: ApprovalDirectory,
): directory is OaApprovalDirectory {
  return (
    'headOf' in directory &&
    typeof directory.headOf === 'function' &&
    'executiveOf' in directory &&
    typeof directory.executiveOf === 'function' &&
    'roleMembers' in directory &&
    typeof directory.roleMembers === 'function' &&
    'uniqueRoleMember' in directory &&
    typeof directory.uniqueRoleMember === 'function'
  );
}

// The installed FilterOperator has no $in. Keep identifier expansion confined
// to related people/records, never all documents in the source collection.
export function memberScope(
  field: string,
  ids: readonly string[],
): DatabaseScope {
  return anyScope([...new Set(ids)].map((id) => condition(field, '$eq', id)));
}

export interface ReadableScopeOptions {
  approvals: ApprovalService;
  lifecycle: string;
  directory: ApprovalDirectory;
  roles: readonly string[];
  ownerFields?: readonly string[];
  taskActors?: boolean;
  org?: OrgService;
  department?: 'primary' | 'record';
  employees?: EmployeeService;
  extra?: () => Promise<DatabaseScope>;
}

/** No cross-request memoization: organization, delegation and role revocations
 * are reflected in the next resolution. Owners preserve their own extra rules. */
export async function approvalReadableScope(
  actorId: string,
  options: ReadableScopeOptions,
): Promise<DatabaseScope> {
  for (const role of options.roles)
    if (await options.directory.hasRole(actorId, role)) return true;
  const scopes: DatabaseScope[] = (
    options.ownerFields ?? ['applicantId', 'createdById']
  ).map((field) => condition(field, '$eq', actorId));
  scopes.push(
    memberScope(
      'id',
      await (isBusinessRead() && isOaDirectory(options.directory)
        ? withCandidateDirectory(options.directory, () =>
            approvalReadableRecords(
              options.approvals,
              options.lifecycle,
              actorId,
              options.taskActors ?? false,
            ),
          )
        : approvalReadableRecords(
            options.approvals,
            options.lifecycle,
            actorId,
            options.taskActors ?? false,
          )),
    ),
  );
  if (options.department && options.org) {
    const org = options.org;
    const departments = await requestBusinessRead(
      org,
      `managed:${actorId}`,
      () => org.departmentsManagedBy(actorId),
    );
    scopes.push(
      options.department === 'record'
        ? memberScope('departmentId', departments)
        : memberScope(
            'applicantId',
            await requestBusinessRead(
              org,
              `primaryMembers:${JSON.stringify([...departments].sort())}`,
              () => org.primaryMembersOf(departments),
            ),
          ),
    );
  }
  if (options.employees) {
    const employees = options.employees;
    scopes.push(
      memberScope(
        'applicantId',
        (
          await requestBusinessRead(employees, `reports:${actorId}`, () =>
            employees.reportsOf(actorId),
          )
        ).map((employee) => employee.userId),
      ),
    );
  }
  if (options.extra) scopes.push(await options.extra());
  return anyScope(scopes);
}

/** Compatibility for service consumers. Authorization resolvers use the scope
 * directly and never materialize every readable document id. */
export async function readableIdsFromScope(
  db: DatabaseManager,
  collection: string,
  scope: DatabaseScope,
): Promise<string[]> {
  if (scope === false) return [];
  const rows = await db.repository<{ id: string }>(collection).findMany({
    filter: scope === true ? undefined : scopeAst(collection, scope),
    select: (s) => s.fields('id'),
  });
  return rows.map((row) => row.id);
}
