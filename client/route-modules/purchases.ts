import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
export function purchaseViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-purchase-new`,
      path: 'newPurchase',
      componentLoader: () => import('../pages/purchases/form-page.js'),
    },
    {
      name: `${owner}-purchase-edit`,
      path: 'editPurchase/:requestId',
      componentLoader: () => import('../pages/purchases/form-page.js'),
    },
    {
      name: `${owner}-purchase-detail`,
      path: 'purchase/:requestId',
      componentLoader: () => import('../pages/purchases/detail.js'),
      children: [
        {
          name: `${owner}-purchase-detail-edit`,
          path: 'edit',
          componentLoader: () => import('../pages/purchases/form-page.js'),
        },
        {
          name: `${owner}-purchase-order`,
          path: 'order/:orderId',
          componentLoader: () => import('../pages/purchases/order-detail.js'),
          children: [
            {
              name: `${owner}-purchase-order-action`,
              path: ':orderAction',
              componentLoader: () =>
                import('../pages/purchases/order-action-dialog.js'),
            },
          ],
        },
        {
          name: `${owner}-purchase-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () => import('../pages/purchases/action-page.js'),
        },
      ],
    },
  ];
}
import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { ShoppingCart } from 'lucide-react';
export default defineAppRoutes([
  {
    name: 'oa-purchase-orders',
    parent: 'oa-procurement',
    path: '/purchaseOrders',
    auth: 'required',
    authz: {
      resource: { type: 'composite', id: 'oa.purchase' },
      action: 'orders',
    },
    navigation: {
      title: 'purchases.ledgerTitle',
      icon: ShoppingCart,
      order: 30,
    },
    componentLoader: () => import('../pages/purchases/order-ledger.js'),
    children: [
      {
        name: 'oa-purchase-order-detail',
        path: 'order/:orderId',
        componentLoader: () => import('../pages/purchases/order-detail.js'),
        children: [
          {
            name: 'oa-purchase-order-action',
            path: ':orderAction',
            componentLoader: () =>
              import('../pages/purchases/order-action-dialog.js'),
          },
        ],
      },
    ],
  },
]);
