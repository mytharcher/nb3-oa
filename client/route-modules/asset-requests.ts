import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
import { PackageCheck } from 'lucide-react';
export function assetRequestViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-asset-request-new`,
      path: 'newAssetRequest',
      componentLoader: () => import('../pages/asset-requests/form-page.js'),
    },
    {
      name: `${owner}-asset-request-edit`,
      path: 'editAssetRequest/:requestId',
      componentLoader: () => import('../pages/asset-requests/form-page.js'),
    },
    {
      name: `${owner}-asset-request-detail`,
      path: 'assetRequest/:requestId',
      componentLoader: () => import('../pages/asset-requests/detail.js'),
      children: [
        {
          name: `${owner}-asset-request-detail-edit`,
          path: 'edit',
          componentLoader: () => import('../pages/asset-requests/form-page.js'),
        },
        {
          name: `${owner}-asset-request-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () =>
            import('../pages/asset-requests/action-dialog.js'),
        },
        {
          name: `${owner}-asset-request-return`,
          path: 'return',
          componentLoader: () =>
            import('../pages/asset-requests/action-dialog.js'),
        },
      ],
    },
  ];
}
export default [
  defineAppRoutes([
    {
      name: 'oa-asset-requests',
      parent: 'oa-administration',
      path: '/assetRequests',
      auth: 'required',
      authz: {
        resource: { type: 'page', id: 'oa-asset-requests' },
        action: 'access',
      },
      navigation: {
        title: 'assetRequests.title',
        icon: PackageCheck,
        order: 10,
      },
      componentLoader: () => import('../pages/asset-requests/index.js'),
      children: assetRequestViewChildren('oa-asset-requests'),
    },
  ]),
];
