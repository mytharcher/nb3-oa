import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
import { ShieldCheck } from 'lucide-react';
const permissions = {
  resource: { type: 'settings', id: 'authorization.permission-sets' },
  action: 'read',
};
const inspector = {
  resource: { type: 'settings', id: 'authorization.inspector' },
  action: 'inspect',
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
  {
    name: 'oa-access-people',
    path: 'people',
    auth: 'required',
    authz: inspector,
    componentLoader: () => import('../pages/access/people.js'),
    children: [
      {
        name: 'oa-access-person',
        path: ':userId',
        componentLoader: () => import('../pages/access/person-detail.js'),
        children: [
          {
            name: 'oa-access-person-sources',
            path: 'sources',
            componentLoader: () => import('../pages/access/tab.js'),
            children: [assignment('oa-access-person-sources-assign')],
          },
          {
            name: 'oa-access-person-personal',
            path: 'personal',
            componentLoader: () => import('../pages/access/tab.js'),
            children: [assignment('oa-access-person-personal-assign')],
          },
        ],
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
]);
