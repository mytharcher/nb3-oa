import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
export function supplyViewChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-supply-new`,
      path: 'newSupply',
      componentLoader: () => import('../pages/supplies/form-dialog.js'),
    },
    {
      name: `${owner}-supply-edit`,
      path: 'editSupply/:requestId',
      componentLoader: () => import('../pages/supplies/form-dialog.js'),
    },
    {
      name: `${owner}-supply-detail`,
      path: 'supply/:requestId',
      componentLoader: () => import('../pages/supplies/detail.js'),
      children: [
        {
          name: `${owner}-supply-detail-edit`,
          path: 'edit',
          componentLoader: () => import('../pages/supplies/form-dialog.js'),
        },
        {
          name: `${owner}-supply-detail-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () => import('../pages/supplies/action-dialog.js'),
        },
      ],
    },
  ];
}
import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { PackageCheck } from 'lucide-react';
export default defineAppRoutes([
  {
    name: 'oa-supply-ledger',
    parent: 'oa-administration',
    path: '/supplyLedger',
    auth: 'required',
    authz: {
      resource: { type: 'composite', id: 'oa.supplies' },
      action: 'ledger',
    },
    navigation: { title: 'supplies.navigation', icon: PackageCheck, order: 20 },
    componentLoader: () => import('../pages/supplies/ledger.js'),
    children: [
      {
        name: 'oa-supply-ledger-entry',
        path: 'entry/:entryId',
        componentLoader: () => import('../pages/supplies/ledger-entry.js'),
      },
    ],
  },
]);
