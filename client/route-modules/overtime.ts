import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
/** Embed overtime records under each approval-center tab so closing preserves its originating view. */
export function overtimeViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-overtime-new`,
      path: 'newOvertime',
      componentLoader: () => import('../pages/overtime/form-dialog.js'),
    },
    {
      name: `${owner}-overtime-edit`,
      path: 'editOvertime/:requestId',
      componentLoader: () => import('../pages/overtime/form-dialog.js'),
    },
    {
      name: `${owner}-overtime-detail`,
      path: 'overtime/:requestId',
      componentLoader: () => import('../pages/overtime/detail.js'),
      children: [
        {
          name: `${owner}-overtime-detail-edit`,
          path: 'edit',
          componentLoader: () => import('../pages/overtime/form-dialog.js'),
        },
        {
          name: `${owner}-overtime-detail-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () => import('../pages/overtime/action-dialog.js'),
        },
      ],
    },
  ];
}
