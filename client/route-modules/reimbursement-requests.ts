import { Receipt } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
function detailChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-print`,
      path: 'print',
      componentLoader: () => import('../pages/template-print/print-dialog.js'),
    },
    {
      name: `${owner}-edit`,
      path: 'edit',
      componentLoader: () =>
        import('../pages/reimbursement-requests/form-page.js'),
    },
    {
      name: `${owner}-action`,
      path: 'action/:actionName/:targetId',
      componentLoader: () =>
        import('../pages/reimbursement-requests/action-dialog.js'),
    },
    {
      name: `${owner}-account`,
      path: 'paymentAccount',
      componentLoader: () =>
        import('../pages/reimbursement-requests/payment-account.js'),
    },
  ];
}
export function reimbursementViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-reimbursement-new`,
      path: 'newReimbursement',
      componentLoader: () =>
        import('../pages/reimbursement-requests/form-page.js'),
    },
    {
      name: `${owner}-reimbursement-edit`,
      path: 'editReimbursement/:requestId',
      componentLoader: () =>
        import('../pages/reimbursement-requests/form-page.js'),
    },
    {
      name: `${owner}-reimbursement-detail`,
      path: 'reimbursement/:requestId',
      componentLoader: () =>
        import('../pages/reimbursement-requests/detail.js'),
      children: detailChildren(`${owner}-reimbursement-detail`),
    },
  ];
}
export const reimbursementRequestRoutes = defineAppRoutes([
  {
    name: 'oa-reimbursement-requests',
    parent: 'oa-finance',
    path: '/reimbursementRequests',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa-reimbursement-requests' },
      action: 'access',
    },
    navigation: {
      icon: Receipt,
      title: 'reimbursementRequests.title',
      order: 10,
    },
    componentLoader: () => import('../pages/reimbursement-requests/index.js'),
    children: [
      {
        name: 'reimbursement-new',
        path: 'new',
        componentLoader: () =>
          import('../pages/reimbursement-requests/form-page.js'),
      },
      {
        name: 'reimbursement-edit',
        path: 'edit/:requestId',
        componentLoader: () =>
          import('../pages/reimbursement-requests/form-page.js'),
      },
      {
        name: 'reimbursement-detail',
        path: ':requestId',
        componentLoader: () =>
          import('../pages/reimbursement-requests/detail.js'),
        children: detailChildren('reimbursement-detail'),
      },
    ],
  },
]);
