import {
  defineSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { BriefcaseBusiness, Layers, Network, UsersRound } from 'lucide-react';

/**
 * Routes of the `org` OA module: four settings pages in the 组织与人员 group (`oa-organization`). Each page checks
 * its own settings item for `read`; the server registers the same items and checks `update` on every write.
 * Child routes inherit the entry page's `authz`.
 */
const orgSettingsRoutes: AppClientRouteContribution = defineSettingsRoutes([
  {
    parent: 'oa-organization',
    name: 'org-departments',
    path: '/departments',
    navigation: {
      title: 'org.navigation.departments',
      icon: Network,
      order: 10,
    },
    authz: {
      resource: { type: 'settings', id: 'oa.org.departments' },
      action: 'read',
    },
    componentLoader: () => import('../pages/org/departments/index.js'),
    children: [
      {
        // /settings/departments/new: a top-level department (any parent can still be picked).
        name: 'org-department-new',
        path: 'new',
        componentLoader: () => import('../pages/org/departments/new.js'),
      },
      {
        // /settings/departments/:departmentId: the selected department, inline beside the tree.
        name: 'org-department',
        path: ':departmentId',
        componentLoader: () => import('../pages/org/departments/department.js'),
        children: [
          {
            name: 'org-department-edit',
            path: 'edit',
            componentLoader: () => import('../pages/org/departments/edit.js'),
          },
          {
            // A child department of the selected one.
            name: 'org-department-new-child',
            path: 'new',
            componentLoader: () => import('../pages/org/departments/new.js'),
          },
          {
            name: 'org-department-member-new',
            path: 'members/new',
            componentLoader: () =>
              import('../pages/org/departments/add-member.js'),
          },
        ],
      },
    ],
  },
  {
    parent: 'oa-organization',
    name: 'org-positions',
    path: '/positions',
    navigation: {
      title: 'org.navigation.positions',
      icon: BriefcaseBusiness,
      order: 20,
    },
    authz: {
      resource: { type: 'settings', id: 'oa.org.positions' },
      action: 'read',
    },
    componentLoader: () => import('../pages/org/positions/index.js'),
    children: [
      {
        name: 'org-position-new',
        path: 'new',
        componentLoader: () => import('../pages/org/positions/new.js'),
      },
      {
        name: 'org-position-edit',
        path: 'edit/:positionId',
        componentLoader: () => import('../pages/org/positions/edit.js'),
      },
    ],
  },
  {
    parent: 'oa-organization',
    name: 'org-grades',
    path: '/grades',
    navigation: { title: 'org.navigation.grades', icon: Layers, order: 30 },
    authz: {
      resource: { type: 'settings', id: 'oa.org.grades' },
      action: 'read',
    },
    componentLoader: () => import('../pages/org/grades/index.js'),
    children: [
      {
        name: 'org-grade-new',
        path: 'new',
        componentLoader: () => import('../pages/org/grades/new.js'),
      },
      {
        name: 'org-grade-edit',
        path: 'edit/:gradeId',
        componentLoader: () => import('../pages/org/grades/edit.js'),
      },
    ],
  },
  {
    parent: 'oa-organization',
    name: 'org-duty-roles',
    path: '/duty-roles',
    navigation: {
      title: 'org.navigation.dutyRoles',
      icon: UsersRound,
      order: 40,
    },
    authz: {
      resource: { type: 'settings', id: 'oa.org.dutyRoles' },
      action: 'read',
    },
    componentLoader: () => import('../pages/org/duty-roles/index.js'),
    children: [
      {
        // The role's members, in a drawer over the filtered list.
        name: 'org-duty-role',
        path: ':code',
        componentLoader: () => import('../pages/org/duty-roles/role.js'),
        children: [
          {
            name: 'org-duty-role-member-new',
            path: 'members/new',
            componentLoader: () =>
              import('../pages/org/duty-roles/add-member.js'),
          },
        ],
      },
    ],
  },
]);

/**
 * Routes of the `org` OA module. Settings pages append to the groups `client/routes.ts` declares with
 * `parent: 'oa-organization' | 'oa-configuration' | 'oa-system'`; App pages use `defineAppRoutes()`.
 */
const orgRoutes: readonly AppClientRouteContribution[] = [orgSettingsRoutes];

export default orgRoutes;
