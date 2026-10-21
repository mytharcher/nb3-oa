import { LogOut } from 'lucide-react';
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
        import('../pages/departure-requests/form-dialog.js'),
    },
    {
      name: `${owner}-action`,
      path: 'action/:actionName/:targetId',
      componentLoader: () =>
        import('../pages/departure-requests/action-dialog.js'),
    },
    {
      name: `${owner}-work`,
      path: 'work/:actionName/:targetId',
      componentLoader: () =>
        import('../pages/departure-requests/work-dialog.js'),
    },
  ];
}
export function departureViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-departure-new`,
      path: 'newDeparture',
      componentLoader: () =>
        import('../pages/departure-requests/form-dialog.js'),
    },
    {
      name: `${owner}-departure-edit`,
      path: 'editDeparture/:requestId',
      componentLoader: () =>
        import('../pages/departure-requests/form-dialog.js'),
    },
    {
      name: `${owner}-departure-detail`,
      path: 'departure/:requestId',
      componentLoader: () => import('../pages/departure-requests/detail.js'),
      children: detailChildren(`${owner}-departure-detail`),
    },
  ];
}
export const departureRequestRoutes = defineAppRoutes([
  {
    name: 'oa-departure-requests',
    path: '/departureRequests',
    parent: 'oa-hr',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa-departure-requests' },
      action: 'access',
    },
    navigation: {
      title: 'departureRequests.title',
      icon: LogOut,
      order: 100,
    },
    componentLoader: () => import('../pages/departure-requests/index.js'),
    children: [
      {
        name: 'departure-new',
        path: 'new',
        componentLoader: () =>
          import('../pages/departure-requests/form-dialog.js'),
      },
      {
        name: 'departure-edit',
        path: 'edit/:requestId',
        componentLoader: () =>
          import('../pages/departure-requests/form-dialog.js'),
      },
      {
        name: 'departure-detail',
        path: ':requestId',
        componentLoader: () => import('../pages/departure-requests/detail.js'),
        children: detailChildren('departure-detail'),
      },
    ],
  },
]);
