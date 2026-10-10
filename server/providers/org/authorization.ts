import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { DatabaseConnection } from '@nocobase/db';

import {
  DEPARTMENT_HEAD_SUBJECT,
  DEPARTMENT_SUBJECT,
  DUTY_ROLE_SUBJECT,
  label,
  ORG_SECTION,
  ORG_SETTINGS,
} from './constants.js';
import type { OrganizationService } from './service.js';

const SETTINGS_ITEMS: readonly { id: string; titleKey: string }[] = [
  { id: ORG_SETTINGS.departments, titleKey: 'authz.departments' },
  { id: ORG_SETTINGS.positions, titleKey: 'authz.positions' },
  { id: ORG_SETTINGS.grades, titleKey: 'authz.grades' },
  { id: ORG_SETTINGS.dutyRoles, titleKey: 'authz.dutyRoles' },
];

/**
 * Registers the organisation with authorization and returns the function that releases its subject types:
 *
 * - four settings items (`read` and `update` each), titled like their settings pages and listed in one workspace
 *   subsection (`oa.org`, 组织与人员; other OA modules may place items in it too);
 * - `org.department`, inherited down the tree: a set assigned to a department reaches its members and the members of
 *   every active department below it;
 * - `org.departmentHead`, fixed (`*`): everyone who heads an effectively active department;
 * - `org.dutyRole`, flat: active members of an active duty role.
 *
 * Positions (`org.position`) are registered by the employees module, which owns `employees.positionId`.
 */
export function registerOrgAuthorization(
  authz: AppAuthorization,
  organization: OrganizationService,
): () => void {
  authz.ui.sections.add({
    name: ORG_SECTION,
    title: label('authz.section'),
    parent: 'administration',
  });
  for (const item of SETTINGS_ITEMS) {
    authz.settings.add({
      id: item.id,
      title: label(item.titleKey),
      actions: [
        { name: 'read', title: label('authz.read') },
        { name: 'update', title: label('authz.update') },
      ],
    });
    authz.ui.place({ type: 'settings', id: item.id }, { section: ORG_SECTION });
  }

  const releaseDepartments = authz.subjects.add<DatabaseConnection>(
    DEPARTMENT_SUBJECT,
    {
      // Every request recomputes membership from the database; nothing is cached.
      resolveFor: async (principal) =>
        principal.type === 'user'
          ? organization.departmentsOf(principal.id)
          : [],
      // Protected assignment checks pass their transaction; read through it.
      filterActive: async (ids, transaction) =>
        organization.filterActive(ids, transaction),
      administration: {
        title: label('subjects.departments'),
        selection: {
          type: 'collection',
          list: (query) => organization.listDepartmentOptions(query),
          resolve: (ids) => organization.resolveDepartments(ids),
        },
      },
    },
  );

  // A fixed subject, like `authenticated`: assign the head set to it once and it follows every appointment.
  const releaseHeads = authz.subjects.add<DatabaseConnection>(
    DEPARTMENT_HEAD_SUBJECT,
    {
      resolveFor: async (principal) =>
        principal.type === 'user' &&
        (await organization.headedBy(principal.id)).length
          ? ['*']
          : [],
      filterActive: async (ids) => ids.filter((id) => id === '*'),
      administration: {
        title: label('subjects.heads'),
        selection: { type: 'fixed', id: '*' },
      },
    },
  );

  const releaseDutyRoles = authz.subjects.add<DatabaseConnection>(
    DUTY_ROLE_SUBJECT,
    {
      resolveFor: async (principal) =>
        principal.type === 'user' ? organization.dutyRolesOf(principal.id) : [],
      filterActive: async (ids, transaction) =>
        organization.filterActiveDutyRoles(ids, transaction),
      administration: {
        title: label('subjects.dutyRoles'),
        selection: {
          type: 'collection',
          list: (query) => organization.listDutyRoleOptions(query),
          resolve: (ids) => organization.resolveDutyRoles(ids),
        },
      },
    },
  );

  return () => {
    releaseDutyRoles();
    releaseHeads();
    releaseDepartments();
  };
}
