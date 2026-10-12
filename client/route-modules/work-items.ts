import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { ListTodo } from 'lucide-react';
export default defineAppRoutes([
  {
    name: 'work-items',
    parent: 'oa-office',
    path: '/work-items',
    auth: 'required',
    authz: {
      resource: { type: 'composite', id: 'oa.workItems' },
      action: 'view',
    },
    navigation: { title: 'workItems.title', icon: ListTodo, order: 30 },
    breadcrumb: { title: 'workItems.title' },
    componentLoader: () => import('../pages/work-items/index.js'),
    children: [
      {
        name: 'work-items-new',
        path: 'new',
        authz: {
          resource: { type: 'composite', id: 'oa.workItems' },
          action: 'create',
        },
        componentLoader: () => import('../pages/work-items/form.js'),
      },
      {
        name: 'work-items-detail',
        path: ':workItemId',
        componentLoader: () => import('../pages/work-items/detail.js'),
        children: [
          {
            name: 'work-items-handover-confirmation',
            path: 'handover-confirmation',
            authz: {
              resource: { type: 'composite', id: 'oa.workItems' },
              action: 'handoverConfirmation',
            },
            componentLoader: () => import('../pages/work-items/handover.js'),
          },
          {
            name: 'work-items-edit',
            path: 'edit',
            authz: {
              resource: { type: 'composite', id: 'oa.workItems' },
              action: 'edit',
            },
            componentLoader: () => import('../pages/work-items/form.js'),
          },
          {
            name: 'work-items-action',
            path: 'actions/:action',
            // Each concrete dynamic action and its current record policy are checked by the owner form.
            authz: {
              resource: { type: 'composite', id: 'oa.workItems' },
              action: 'view',
            },
            componentLoader: () => import('../pages/work-items/form.js'),
          },
        ],
      },
    ],
  },
]);
