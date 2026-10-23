import type { ApprovalService } from '@nocobase/app-plugin-approval/server';
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
  directory: { hasRole(actorId: string, role: string): boolean };
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
  if (options.roles.some((role) => options.directory.hasRole(actorId, role)))
    return true;
  const scopes: DatabaseScope[] = (
    options.ownerFields ?? ['applicantId', 'createdById']
  ).map((field) => condition(field, '$eq', actorId));
  scopes.push(
    memberScope(
      'id',
      await approvalReadableRecords(
        options.approvals,
        options.lifecycle,
        actorId,
        options.taskActors ?? false,
      ),
    ),
  );
  if (options.department && options.org) {
    const departments = await options.org.departmentsManagedBy(actorId);
    scopes.push(
      options.department === 'record'
        ? memberScope('departmentId', departments)
        : memberScope(
            'applicantId',
            await options.org.primaryMembersOf(departments),
          ),
    );
  }
  if (options.employees)
    scopes.push(
      memberScope(
        'applicantId',
        (await options.employees.reportsOf(actorId)).map(
          (employee) => employee.userId,
        ),
      ),
    );
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
