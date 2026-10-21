import { ContactRound, IdCard } from 'lucide-react';
import { departureViewChildren } from './departure.js';
import { probationViewChildren } from './probation-requests.js';
import { transferViewChildren } from './transfer.js';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';

/** Reuse each source module's detail and actions; the employee's tab remains the route parent. */
function employeeSourceRoutes(tab: string): AppClientRouteDefinition[] {
  const sources = [
    {
      segment: 'Departure',
      resource: 'oa.departure',
      routes: departureViewChildren(`${tab}-source`),
      path: 'departure/:requestId',
    },
    {
      segment: 'Probation',
      resource: 'oa.probation',
      routes: probationViewChildren(`${tab}-source`),
      path: 'probation/:requestId',
    },
    {
      segment: 'Transfer',
      resource: 'oa.transfer',
      routes: transferViewChildren(`${tab}-source`),
      path: 'transfer/:requestId',
    },
  ];
  return [
    {
      name: `${tab}-source-onboarding`,
      path: 'sourceOnboarding/:onboardingId',
      authz: {
        resource: { type: 'composite', id: 'oa.onboarding' },
        action: 'view',
      },
      componentLoader: () => import('../pages/onboarding/detail.js'),
      children: [
        {
          name: `${tab}-source-onboarding-cancel`,
          path: 'cancel',
          authz: {
            resource: { type: 'composite', id: 'oa.onboarding' },
            action: 'cancel',
          },
          componentLoader: () => import('../pages/onboarding/action.js'),
        },
        {
          name: `${tab}-source-onboarding-task`,
          path: 'tasks/:taskId/:action',
          authz: {
            resource: { type: 'composite', id: 'oa.onboarding' },
            action: 'view',
          },
          componentLoader: () => import('../pages/onboarding/action.js'),
        },
      ],
    },
    ...sources.map(({ segment, resource, routes, path }) => {
      const detail = routes.find((route) => route.path === path);
      if (!detail)
        throw new Error(`Missing employee source detail route: ${segment}`);
      return {
        ...detail,
        path: `source${segment}/:requestId`,
        authz: {
          resource: { type: 'composite' as const, id: resource },
          action: 'view',
        },
      };
    }),
  ];
}

/**
 * The overlays an employee page's header opens, declared under each of its tabs so they open over the tab being shown
 * (guideline I9); `tab` is that tab's route name.
 */
function employeeHeaderRoutes(tab: string): AppClientRouteDefinition[] {
  return [
    ...employeeSourceRoutes(tab),
    {
      // …/:employeeId/<tab>/edit: edit the basic archive (RouteDrawer)
      name: `${tab}-edit`,
      path: 'edit',
      authz: 'skip',
      componentLoader: () => import('../pages/employees/detail/edit.js'),
    },
    {
      // …/:employeeId/<tab>/correctStatus: the administrator's status correction (RouteDialog)
      name: `${tab}-correct-status`,
      path: 'correctStatus',
      authz: 'skip',
      componentLoader: () =>
        import('../pages/employees/detail/correct-status.js'),
    },
  ];
}

const page = 'oa-employee-detail';

/**
 * Settings → 组织与人事 → 员工档案. The settings item `oa.employees` (`read`) opens the page and is checked by every
 * `/api/employees` HR endpoint; what each section shows is decided per composite on the server. Child routes skip
 * their own check and inherit the page's.
 */
const employeesSettingsRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    auth: 'required',
    parent: 'oa-organization',
    name: 'oa-employees',
    path: '/employees',
    authz: {
      resource: { type: 'settings', id: 'oa.employees' },
      action: 'read',
    },
    navigation: {
      title: 'employees.navigation.archive',
      icon: IdCard,
      order: 40,
    },
    componentLoader: () => import('../pages/employees/index.js'),
    children: [
      {
        // /employees/new: the create page, covering the list
        name: 'oa-employee-create',
        path: 'new',
        authz: 'skip',
        componentLoader: () => import('../pages/employees/new.js'),
      },
      {
        // /employees/:employeeId: the employee's page with tabs, covering the list
        name: page,
        path: ':employeeId',
        authz: 'skip',
        componentLoader: () => import('../pages/employees/detail/index.js'),
        children: [
          {
            name: `${page}-basic`,
            path: 'basic',
            authz: 'skip',
            componentLoader: () => import('../pages/employees/detail/basic.js'),
            children: employeeHeaderRoutes(`${page}-basic`),
          },
          {
            name: `${page}-profile`,
            path: 'profile',
            authz: 'skip',
            componentLoader: () =>
              import('../pages/employees/detail/profile.js'),
            children: [
              ...employeeHeaderRoutes(`${page}-profile`),
              {
                // …/:employeeId/profile/editProfile: the tab's own edit drawer
                name: `${page}-profile-edit-profile`,
                path: 'editProfile',
                authz: 'skip',
                componentLoader: () =>
                  import('../pages/employees/detail/edit-profile.js'),
              },
            ],
          },
          {
            name: `${page}-compensation`,
            path: 'compensation',
            authz: 'skip',
            componentLoader: () =>
              import('../pages/employees/detail/compensation.js'),
            children: employeeHeaderRoutes(`${page}-compensation`),
          },
          {
            name: `${page}-history`,
            path: 'history',
            authz: 'skip',
            componentLoader: () =>
              import('../pages/employees/detail/history.js'),
            children: employeeHeaderRoutes(`${page}-history`),
          },
        ],
      },
    ],
  },
]);

/** 通讯录: an App page every holder of its page grant opens; the endpoint checks the directory composite. */
const employeesAppRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'oa-personal-archive',
    path: '/personal-archive',
    auth: 'required',
    // The server derives the employee from the session; no HR page permission is needed.
    authz: 'skip',
    breadcrumb: { title: 'employees.personal.title' },
    componentLoader: () => import('../pages/employees/personal/index.js'),
  },
  {
    name: 'oa-directory',
    parent: 'oa-personal',
    path: '/directory',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa.employees.directory' },
      action: 'access',
    },
    navigation: {
      title: 'employees.navigation.directory',
      icon: ContactRound,
      order: 110,
    },
    componentLoader: () => import('../pages/directory.js'),
  },
]);

/**
 * Routes of the `employees` OA module. Settings pages append to the groups `client/routes.ts` declares with
 * `parent: 'oa-organization' | 'oa-hr' | 'oa-configuration' | 'oa-system'`; App pages use `defineAppRoutes()`.
 */
const employeesRoutes: readonly AppClientRouteContribution[] = [
  employeesSettingsRoutes,
  employeesAppRoutes,
];

export default employeesRoutes;
