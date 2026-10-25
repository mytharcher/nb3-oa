import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
import { ShieldCheck } from 'lucide-react';
const permissions = {
  resource: { type: 'settings', id: 'authorization.permission-sets' },
  action: 'read',
};
const assignment = (name: string): AppClientRouteDefinition => ({
  name,
  path: 'assign',
  authz: { ...permissions, action: 'assign' },
  componentLoader: () => import('../pages/access/assign.js'),
});
const views: AppClientRouteDefinition[] = [
  {
    name: 'oa-access-roles',
    path: 'roles',
    auth: 'required',
    authz: permissions,
    componentLoader: () => import('../pages/access/roles.js'),
    children: [
      {
        name: 'oa-access-subject',
        path: ':type/:id',
        componentLoader: () => import('../pages/access/detail.js'),
        children: [
          {
            name: 'oa-access-subject-permissions',
            path: 'permissions',
            componentLoader: () => import('../pages/access/tab.js'),
            children: [
              assignment('oa-access-subject-assign'),
              {
                name: 'oa-access-edit',
                path: ':permissionSetKey/edit',
                authz: { ...permissions, action: 'update' },
                componentLoader: () => import('../pages/access/edit.js'),
              },
            ],
          },
          {
            name: 'oa-access-members',
            path: 'members',
            componentLoader: () => import('../pages/access/tab.js'),
            children: [
              {
                name: 'oa-access-add-member',
                path: 'add',
                authz: {
                  resource: { type: 'settings', id: 'oa.org.dutyRoles' },
                  action: 'update',
                },
                componentLoader: () => import('../pages/access/add-member.js'),
              },
            ],
          },
        ],
      },
    ],
  },
];
// Optional module-oriented comparison shares the same permission workspace.
export const moduleViews: AppClientRouteDefinition[] = [
  {
    name: 'oa-access-modules',
    path: 'modules',
    authz: permissions,
    componentLoader: () => import('../pages/access/modules.js'),
    children: [
      {
        name: 'oa-access-module',
        path: ':resource',
        componentLoader: () => import('../pages/access/module-detail.js'),
      },
    ],
  },
];
export default defineAppRoutes([
  {
    name: 'oa-access',
    path: '/access',
    parent: 'oa-system',
    auth: 'required',
    authz: permissions,
    navigation: { title: 'access.title', icon: ShieldCheck, order: 20 },
    componentLoader: () => import('../pages/access/index.js'),
    children: views,
  },
  {
    name: 'oa-access-legacy-people',
    path: '/access/people',
    auth: 'required',
    parent: 'oa-system',
    authz: 'skip',
    componentLoader: () => import('../pages/access/legacy-redirect.js'),
  },
  ...['', '/sources', '/personal', '/sources/assign', '/personal/assign'].map(
    (suffix, index): AppClientRouteDefinition => ({
      name: `oa-access-legacy-user-${index}`,
      path: `/access/people/:userId${suffix}`,
      auth: 'required',
      parent: 'oa-system',
      authz: 'skip',
      componentLoader: () => import('../pages/access/legacy-redirect.js'),
    }),
  ),
]);
