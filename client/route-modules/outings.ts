import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
/** Embed outings records under each approval-center tab so closing preserves its originating view. */
export function outingsViewChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-outings-new`,
      path: 'newOuting',
      componentLoader: () => import('../pages/outings/form-dialog.js'),
    },
    {
      name: `${owner}-outings-edit`,
      path: 'editOuting/:requestId',
      componentLoader: () => import('../pages/outings/form-dialog.js'),
    },
    {
      name: `${owner}-outings-detail`,
      path: 'outings/:requestId',
      componentLoader: () => import('../pages/outings/detail.js'),
      children: [
        {
          name: `${owner}-outings-detail-edit`,
          path: 'edit',
          componentLoader: () => import('../pages/outings/form-dialog.js'),
        },
        {
          name: `${owner}-outings-detail-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () => import('../pages/outings/action-dialog.js'),
        },
      ],
    },
  ];
}
