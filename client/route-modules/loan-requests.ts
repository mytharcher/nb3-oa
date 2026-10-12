import { HandCoins } from 'lucide-react';
import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
import { defineAppRoutes } from '@nocobase/app-client/plugins';
export const loanRequestRoutes = defineAppRoutes([
  {
    name: 'oa-loan-requests',
    parent: 'oa-finance',
    path: '/loanRequests',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa-loan-requests' },
      action: 'access',
    },
    navigation: { icon: HandCoins, title: 'loanRequests.title', order: 20 },
    componentLoader: () => import('../pages/loan-requests/index.js'),
    children: [
      {
        name: 'loan-new',
        path: 'new',
        componentLoader: () => import('../pages/loan-requests/form-dialog.js'),
      },
      {
        name: 'loan-edit',
        path: 'edit/:requestId',
        componentLoader: () => import('../pages/loan-requests/form-dialog.js'),
      },
      {
        name: 'loan-detail',
        path: ':requestId',
        componentLoader: () => import('../pages/loan-requests/detail.js'),
        children: [
          {
            name: 'loan-cash-repayment',
            path: 'repayment',
            componentLoader: () =>
              import('../pages/loan-requests/repayment-dialog.js'),
          },
          {
            name: 'loan-detail-edit',
            path: 'edit',
            componentLoader: () =>
              import('../pages/loan-requests/form-dialog.js'),
          },
          {
            name: 'loan-action',
            path: 'action/:actionName/:targetId',
            componentLoader: () =>
              import('../pages/loan-requests/action-dialog.js'),
          },
        ],
      },
    ],
  },
]);

export function loanViewChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-loan-new`,
      path: 'newLoan',
      componentLoader: () => import('../pages/loan-requests/form-dialog.js'),
    },
    {
      name: `${owner}-loan-edit`,
      path: 'editLoan/:requestId',
      componentLoader: () => import('../pages/loan-requests/form-dialog.js'),
    },
    {
      name: `${owner}-loan-detail`,
      path: 'loan/:requestId',
      componentLoader: () => import('../pages/loan-requests/detail.js'),
      children: [
        {
          name: `${owner}-loan-repayment`,
          path: 'repayment',
          componentLoader: () =>
            import('../pages/loan-requests/repayment-dialog.js'),
        },
        {
          name: `${owner}-loan-detail-edit`,
          path: 'edit',
          componentLoader: () =>
            import('../pages/loan-requests/form-dialog.js'),
        },
        {
          name: `${owner}-loan-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () =>
            import('../pages/loan-requests/action-dialog.js'),
        },
      ],
    },
  ];
}
