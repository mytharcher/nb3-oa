import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { Wrench, Users } from 'lucide-react';
const view = {
  resource: { type: 'composite' as const, id: 'oa.itRepairs' },
  action: 'view',
};
export default defineAppRoutes([
  {
    name: 'it-repairs',
    parent: 'oa-office',
    path: '/it-repairs',
    auth: 'required',
    authz: view,
    navigation: { title: 'itRepairs.title', icon: Wrench, order: 35 },
    breadcrumb: { title: 'itRepairs.title' },
    componentLoader: () => import('../pages/it-repairs/index.js'),
    children: [
      {
        name: 'it-repairs-new',
        path: 'new',
        authz: { ...view, action: 'create' },
        componentLoader: () => import('../pages/it-repairs/detail.js'),
      },
      {
        name: 'it-repairs-detail',
        path: ':repairId',
        componentLoader: () => import('../pages/it-repairs/detail.js'),
      },
    ],
  },
  {
    name: 'it-repair-groups',
    parent: 'oa-system',
    path: '/it-repair-groups',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'oa.itRepairGroups' },
      action: 'read',
    },
    navigation: { title: 'itRepairs.groups', icon: Users, order: 80 },
    componentLoader: () => import('../pages/it-repairs/groups.js'),
    children: [
      {
        name: 'it-repair-calendar',
        path: 'calendar',
        authz: {
          resource: { type: 'settings', id: 'oa.itRepairGroups' },
          action: 'update',
        },
        componentLoader: () => import('../pages/it-repairs/calendar.js'),
      },
      {
        name: 'it-repair-group-new',
        path: 'new',
        authz: {
          resource: { type: 'settings', id: 'oa.itRepairGroups' },
          action: 'update',
        },
        componentLoader: () =>
          import('../pages/it-repairs/groups.js').then((m) => ({
            default: m.GroupForm,
          })),
      },
      {
        name: 'it-repair-group-edit',
        path: ':groupId',
        authz: {
          resource: { type: 'settings', id: 'oa.itRepairGroups' },
          action: 'update',
        },
        componentLoader: () =>
          import('../pages/it-repairs/groups.js').then((m) => ({
            default: m.GroupForm,
          })),
      },
    ],
  },
]);
