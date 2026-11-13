import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { Wrench, Users, ChartNoAxesCombined } from 'lucide-react';
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
        name: 'it-repairs-filters',
        path: 'filters',
        componentLoader: () =>
          import('../pages/it-repairs/query.js').then((m) => ({
            default: m.RepairFilters,
          })),
      },
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
    name: 'it-repair-reports',
    parent: 'oa-office',
    path: '/it-repair-reports',
    auth: 'required',
    authz: { ...view, action: 'reports' },
    navigation: {
      title: 'itRepairs.reports',
      icon: ChartNoAxesCombined,
      order: 36,
    },
    componentLoader: () => import('../pages/it-repairs/reports.js'),
    children: [
      {
        name: 'it-repair-report-filters',
        path: 'filters',
        componentLoader: () =>
          import('../pages/it-repairs/query.js').then((m) => ({
            default: m.RepairFilters,
          })),
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
