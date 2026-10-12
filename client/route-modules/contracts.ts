import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
import { FileSignature, BookOpen } from 'lucide-react';
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
      componentLoader: () => import('../pages/contracts/form-page.js'),
    },
    {
      name: `${owner}-action`,
      path: 'action/:actionName/:targetId',
      componentLoader: () => import('../pages/contracts/action-dialog.js'),
    },
    {
      name: `${owner}-rebase`,
      path: 'rebase',
      componentLoader: () => import('../pages/contracts/rebase-dialog.js'),
    },
  ];
}
export function contractViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-contract-new`,
      path: 'newContract',
      componentLoader: () => import('../pages/contracts/form-page.js'),
    },
    {
      name: `${owner}-contract-edit`,
      path: 'editContract/:requestId',
      componentLoader: () => import('../pages/contracts/form-page.js'),
    },
    {
      name: `${owner}-contract-detail`,
      path: 'contract/:requestId',
      componentLoader: () => import('../pages/contracts/detail.js'),
      children: detailChildren(`${owner}-contract-detail`),
    },
  ];
}
export const contractRoutes = defineAppRoutes([
  {
    name: 'oa-contract-requests',
    parent: 'oa-procurement',
    path: '/contractRequests',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa-contract-requests' },
      action: 'access',
    },
    navigation: { title: 'contracts.title', icon: FileSignature, order: 40 },
    componentLoader: () => import('../pages/contracts/index.js'),
    children: contractViewChildren('contract-requests'),
  },
  {
    name: 'oa-contract-ledger',
    parent: 'oa-procurement',
    path: '/contracts',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa-contract-ledger' },
      action: 'access',
    },
    navigation: { title: 'contracts.ledgerTitle', icon: BookOpen, order: 50 },
    componentLoader: () => import('../pages/contracts/ledger.js'),
    children: [
      {
        name: 'contract-ledger-detail',
        path: 'contractLedger/:contractId',
        componentLoader: () => import('../pages/contracts/ledger-detail.js'),
        children: contractViewChildren('contract-ledger-detail'),
      },
    ],
  },
]);
