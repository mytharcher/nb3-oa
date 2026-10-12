import { CreditCard } from 'lucide-react';
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
      name: `${owner}-source-order`,
      path: 'sourceOrder/:orderId',
      authz: {
        resource: { type: 'composite', id: 'oa.purchase' },
        action: 'orders',
      },
      componentLoader: () => import('../pages/purchases/order-detail.js'),
      children: [
        {
          name: `${owner}-source-order-action`,
          path: ':orderAction',
          componentLoader: () =>
            import('../pages/purchases/order-action-dialog.js'),
        },
      ],
    },
    {
      name: `${owner}-edit`,
      path: 'edit',
      componentLoader: () => import('../pages/payment-requests/form-page.js'),
    },
    {
      name: `${owner}-action`,
      path: 'action/:actionName/:targetId',
      componentLoader: () =>
        import('../pages/payment-requests/action-dialog.js'),
    },
    {
      name: `${owner}-account`,
      path: 'paymentAccount',
      componentLoader: () =>
        import('../pages/payment-requests/payment-account.js'),
    },
  ];
}
export function paymentViewChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-payment-new`,
      path: 'newPayment',
      componentLoader: () => import('../pages/payment-requests/form-page.js'),
    },
    {
      name: `${owner}-payment-edit`,
      path: 'editPayment/:requestId',
      componentLoader: () => import('../pages/payment-requests/form-page.js'),
    },
    {
      name: `${owner}-payment-detail`,
      path: 'payment/:requestId',
      componentLoader: () => import('../pages/payment-requests/detail.js'),
      children: detailChildren(`${owner}-payment-detail`),
    },
  ];
}
export const paymentRequestRoutes = defineAppRoutes([
  {
    name: 'oa-payment-requests',
    parent: 'oa-finance',
    path: '/paymentRequests',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa-payment-requests' },
      action: 'access',
    },
    navigation: { icon: CreditCard, title: 'paymentRequests.title', order: 30 },
    componentLoader: () => import('../pages/payment-requests/index.js'),
    children: [
      {
        name: 'payment-new',
        path: 'new',
        componentLoader: () => import('../pages/payment-requests/form-page.js'),
      },
      {
        name: 'payment-edit',
        path: 'edit/:requestId',
        componentLoader: () => import('../pages/payment-requests/form-page.js'),
      },
      {
        name: 'payment-detail',
        path: ':requestId',
        componentLoader: () => import('../pages/payment-requests/detail.js'),
        children: detailChildren('payment-detail'),
      },
    ],
  },
]);
