import { UserRoundCheck } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
function detailChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-edit`,
      path: 'edit',
      componentLoader: () =>
        import('../pages/probation-requests/form-dialog.js'),
    },
    {
      name: `${owner}-action`,
      path: 'action/:actionName/:targetId',
      componentLoader: () =>
        import('../pages/probation-requests/action-dialog.js'),
    },
  ];
}
export function probationViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-probation-new`,
      path: 'newProbation',
      componentLoader: () =>
        import('../pages/probation-requests/form-dialog.js'),
    },
    {
      name: `${owner}-probation-edit`,
      path: 'editProbation/:requestId',
      componentLoader: () =>
        import('../pages/probation-requests/form-dialog.js'),
    },
    {
      name: `${owner}-probation-detail`,
      path: 'probation/:requestId',
      componentLoader: () => import('../pages/probation-requests/detail.js'),
      children: detailChildren(`${owner}-probation-detail`),
    },
  ];
}
export const probationRequestRoutes = defineAppRoutes([
  {
    name: 'oa-probation-requests',
    parent: 'oa-organization',
    path: '/probationRequests',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa-probation-requests' },
      action: 'access',
    },
    navigation: {
      icon: UserRoundCheck,
      title: 'probationRequests.title',
      order: 80,
    },
    componentLoader: () => import('../pages/probation-requests/index.js'),
    children: [
      {
        name: 'probation-new',
        path: 'new',
        componentLoader: () =>
          import('../pages/probation-requests/form-dialog.js'),
      },
      {
        name: 'probation-edit',
        path: 'edit/:requestId',
        componentLoader: () =>
          import('../pages/probation-requests/form-dialog.js'),
      },
      {
        name: 'probation-detail',
        path: ':requestId',
        componentLoader: () => import('../pages/probation-requests/detail.js'),
        children: detailChildren('probation-detail'),
      },
    ],
  },
]);
