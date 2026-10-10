import {
  anyScope,
  condition,
  type AppAuthorization,
  type DatabaseScope,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineRecordAccess,
  type RecordAccessContext,
  type RecordAccessReference,
} from '@nocobase/authorization/core';

import { label } from './constants.js';
import type { OrganizationService } from './service.js';

/**
 * How a collection's records belong to a department.
 *
 * - `owner`: the record follows a person (`ownerField` holds a user id). It belongs to every department its owner is
 *   an active member of, so it moves with the person on a transfer. Use it for applications, claims and personal work.
 * - `department`: the record carries the department (`departmentField` holds a department id) and stays with the unit
 *   when people move. Use it for budgets, assets and ledgers a successor inherits.
 */
export type DepartmentScopeTarget =
  | { readonly collection: string; readonly ownerField: string }
  | { readonly collection: string; readonly departmentField: string };

/** The three viewer-relative department scopes, as registered for one module's collections. */
export interface DepartmentScopeReferences {
  /** 本部门: the viewer's own departments (active memberships and the departments they head). */
  readonly myDepartments: RecordAccessReference;
  /** 本部门及下属部门: those departments and every active department below them. */
  readonly myDepartmentsAndBelow: RecordAccessReference;
  /** 我负责的部门及下属部门: only the departments the viewer heads, and every active department below them. */
  readonly headedDepartments: RecordAccessReference;
}

function anyOf(
  field: string,
  values: readonly string[],
): DatabaseScope | false {
  // There is no `$in` operator: a union of equality conditions. No value selects nothing, never every record.
  return values.length
    ? anyScope(values.map((value) => condition(field, '$eq', value)))
    : false;
}

/**
 * Registers the department data scopes for a module's collections, under keys prefixed with the module's own
 * namespace (`<prefix>.myDepartments`, `<prefix>.myDepartmentsAndBelow`, `<prefix>.headedDepartments`). Each module
 * calls it from its provider's `boot` for the collections it owns, so a record access is declared by the module that
 * knows which field names the owner or the department. The resolvers read the organisation on every request and
 * receive only the principal; a viewer in no department selects nothing.
 *
 * Every scope is relative to the viewer, so none can select another department's records; cross-department access
 * is a sharing rule or a grant naming the records (see the organisation permission-design reference).
 */
export function registerDepartmentScopes(
  authz: AppAuthorization,
  organization: OrganizationService,
  options: {
    /** Namespace of the keys, such as `oa.employees`. */
    readonly prefix: string;
    readonly targets: readonly DepartmentScopeTarget[];
  },
): DepartmentScopeReferences {
  const targets = new Map(
    options.targets.map((target) => [target.collection, target] as const),
  );
  const collections = [...targets.keys()];

  const resolver =
    (selection: {
      memberships: boolean;
      headed: boolean;
      descendants: boolean;
    }) =>
    async ({
      principal,
      collection,
    }: RecordAccessContext): Promise<DatabaseScope | false> => {
      const target = targets.get(collection);
      if (principal.type !== 'user' || !target) return false;
      const departments = await organization.viewerDepartments(
        principal.id,
        selection,
      );
      if ('departmentField' in target)
        return anyOf(target.departmentField, departments);
      if (!departments.length) return false;
      return anyOf(
        target.ownerField,
        await organization.membersOf(departments),
      );
    };

  const define = (
    key: string,
    titleKey: string,
    selection: { memberships: boolean; headed: boolean; descendants: boolean },
  ): RecordAccessReference =>
    authz.recordAccess.define(
      defineRecordAccess(`${options.prefix}.${key}`, (access) =>
        access
          .title(label(`scopes.${titleKey}`))
          .description(label(`scopes.${titleKey}Hint`))
          .collections(...collections)
          .resolver(resolver(selection)),
      ),
    );

  return {
    myDepartments: define('myDepartments', 'mine', {
      memberships: true,
      headed: true,
      descendants: false,
    }),
    myDepartmentsAndBelow: define('myDepartmentsAndBelow', 'mineAndBelow', {
      memberships: true,
      headed: true,
      descendants: true,
    }),
    headedDepartments: define('headedDepartments', 'headed', {
      memberships: false,
      headed: true,
      descendants: true,
    }),
  };
}
