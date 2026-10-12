import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
export function generalRequestViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-general-new`,
      path: 'newGeneral',
      componentLoader: () => import('../pages/general-requests/form-dialog.js'),
    },
    {
      name: `${owner}-general-edit`,
      path: 'editGeneral/:requestId',
      componentLoader: () => import('../pages/general-requests/form-dialog.js'),
    },
    {
      name: `${owner}-general-detail`,
      path: 'general/:requestId',
      componentLoader: () => import('../pages/general-requests/detail.js'),
      children: [
        {
          name: `${owner}-general-detail-edit`,
          path: 'edit',
          componentLoader: () =>
            import('../pages/general-requests/form-dialog.js'),
        },
        {
          name: `${owner}-general-detail-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () =>
            import('../pages/general-requests/action-dialog.js'),
        },
      ],
    },
  ];
}
