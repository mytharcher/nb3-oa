import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
import { Stamp, BookOpen } from 'lucide-react';
const permission = (action: string, resource = 'oa.sealRequests') => ({
  resource: { type: 'composite' as const, id: resource },
  action,
});
function children(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-print`,
      path: 'print',
      authz: permission('use', 'oa.templatePrint'),
      componentLoader: () => import('../pages/template-print/print-dialog.js'),
    },
    {
      name: `${owner}-edit`,
      path: 'edit',
      authz: permission('edit'),
      componentLoader: () => import('../pages/seals/form.js'),
    },
    {
      name: `${owner}-action`,
      path: 'actions/:operation/:taskId',
      authz: permission('operate'),
      componentLoader: () => import('../pages/seals/action.js'),
    },
    {
      name: `${owner}-transition`,
      path: 'actions/:operation',
      authz: permission('operate'),
      componentLoader: () => import('../pages/seals/action.js'),
    },
    {
      name: `${owner}-owner-transition`,
      path: 'transitions/:operation',
      authz: permission('edit'),
      componentLoader: () => import('../pages/seals/action.js'),
    },
    {
      name: `${owner}-actual-return`,
      path: 'actualReturn',
      authz: permission('actualReturn'),
      componentLoader: () => import('../pages/seals/action.js'),
    },
  ];
}
export function sealViewChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-seal-new`,
      path: 'newSeal',
      auth: 'required',
      authz: permission('create'),
      componentLoader: () => import('../pages/seals/form.js'),
    },
    {
      name: `${owner}-seal-edit`,
      path: 'editSeal/:sealRequestId',
      auth: 'required',
      authz: permission('edit'),
      componentLoader: () => import('../pages/seals/form.js'),
    },
    {
      name: `${owner}-seal-detail`,
      path: 'seal/:sealRequestId',
      auth: 'required',
      authz: permission('view'),
      componentLoader: () => import('../pages/seals/detail.js'),
      children: children(`${owner}-seal-detail`),
    },
  ];
}
export default defineAppRoutes([
  {
    name: 'oa-seal-instances',
    parent: 'oa-administration',
    path: '/seal-instances',
    auth: 'required',
    authz: permission('view', 'oa.seals'),
    navigation: { title: 'seals.instances', icon: Stamp, order: 59 },
    componentLoader: () => import('../pages/seals/instances.js'),
    children: [
      {
        name: 'oa-seal-instance-new',
        path: 'new',
        authz: permission('manage', 'oa.seals'),
        componentLoader: () => import('../pages/seals/instance-form.js'),
      },
      {
        name: 'oa-seal-instance-edit',
        path: 'edit/:sealInstanceId',
        authz: permission('manage', 'oa.seals'),
        componentLoader: () => import('../pages/seals/instance-form.js'),
      },
    ],
  },
  {
    name: 'oa-seal-requests',
    parent: 'oa-administration',
    path: '/seal-requests',
    auth: 'required',
    authz: permission('view'),
    navigation: { title: 'seals.title', icon: Stamp, order: 60 },
    componentLoader: () => import('../pages/seals/index.js'),
    children: [
      {
        name: 'oa-seal-new',
        path: 'new',
        authz: permission('create'),
        componentLoader: () => import('../pages/seals/form.js'),
      },
      {
        name: 'oa-seal-detail',
        path: ':sealRequestId',
        authz: permission('view'),
        componentLoader: () => import('../pages/seals/detail.js'),
        children: children('oa-seal-detail'),
      },
    ],
  },
  {
    name: 'oa-seal-ledger',
    parent: 'oa-administration',
    path: '/seal-ledger',
    auth: 'required',
    authz: permission('view', 'oa.sealLedger'),
    navigation: { title: 'seals.ledger', icon: BookOpen, order: 61 },
    componentLoader: () => import('../pages/seals/ledger.js'),
    children: [
      {
        name: 'oa-seal-ledger-detail',
        path: ':sealLedgerId',
        authz: permission('view', 'oa.sealLedger'),
        componentLoader: () => import('../pages/seals/ledger-detail.js'),
        children: [
          {
            name: 'oa-seal-ledger-print',
            path: 'print',
            authz: permission('use', 'oa.templatePrint'),
            componentLoader: () =>
              import('../pages/template-print/print-dialog.js'),
          },
        ],
      },
    ],
  },
]);
