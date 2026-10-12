import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { Wallet } from 'lucide-react';
const update = {
  resource: { type: 'settings' as const, id: 'oa.budgets' },
  action: 'update',
};
export default defineAppRoutes([
  {
    name: 'oa-budgets',
    parent: 'oa-finance',
    path: '/budgets',
    auth: 'required',
    authz: { resource: { type: 'settings', id: 'oa.budgets' }, action: 'read' },
    navigation: { title: 'budgets.title', icon: Wallet, order: 40 },
    componentLoader: () => import('../pages/budgets/index.js'),
    children: [
      {
        name: 'oa-budget-new',
        path: 'new',
        authz: update,
        componentLoader: () => import('../pages/budgets/form-dialog.js'),
      },
      {
        name: 'oa-budget-adjust-list',
        path: 'adjust/:budgetId',
        authz: update,
        componentLoader: () => import('../pages/budgets/form-dialog.js'),
      },
      {
        name: 'oa-budget-detail',
        path: ':budgetId',
        componentLoader: () => import('../pages/budgets/detail.js'),
        children: [
          {
            name: 'oa-budget-adjust-detail',
            path: 'adjust',
            authz: update,
            componentLoader: () => import('../pages/budgets/form-dialog.js'),
          },
        ],
      },
    ],
  },
]);
