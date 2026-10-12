import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { ContactRound } from 'lucide-react';
const update = {
  resource: { type: 'settings' as const, id: 'oa.financeAssignments' },
  action: 'update',
};
export default defineAppRoutes([
  {
    name: 'oa-finance-assignments',
    parent: 'oa-finance',
    path: '/financeAssignments',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'oa.financeAssignments' },
      action: 'read',
    },
    navigation: {
      title: 'financeAssignments.title',
      icon: ContactRound,
      order: 50,
    },
    componentLoader: () => import('../pages/finance-assignments/index.js'),
    children: [
      {
        name: 'oa-finance-assignment-new',
        path: 'new',
        authz: update,
        componentLoader: () =>
          import('../pages/finance-assignments/form-dialog.js'),
      },
      {
        name: 'oa-finance-assignment-edit-list',
        path: 'edit/:assignmentId',
        authz: update,
        componentLoader: () =>
          import('../pages/finance-assignments/form-dialog.js'),
      },
      {
        name: 'oa-finance-assignment-detail',
        path: ':assignmentId',
        componentLoader: () => import('../pages/finance-assignments/detail.js'),
        children: [
          {
            name: 'oa-finance-assignment-edit-detail',
            path: 'edit',
            authz: update,
            componentLoader: () =>
              import('../pages/finance-assignments/form-dialog.js'),
          },
        ],
      },
    ],
  },
]);
