import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
export function trainingViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-training-new`,
      path: 'newTraining',
      componentLoader: () => import('../pages/training/form-dialog.js'),
    },
    {
      name: `${owner}-training-edit`,
      path: 'editTraining/:requestId',
      componentLoader: () => import('../pages/training/form-dialog.js'),
    },
    {
      name: `${owner}-training-detail`,
      path: 'training/:requestId',
      componentLoader: () => import('../pages/training/detail.js'),
      children: [
        {
          name: `${owner}-training-detail-edit`,
          path: 'edit',
          componentLoader: () => import('../pages/training/form-dialog.js'),
        },
        {
          name: `${owner}-training-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () => import('../pages/training/action-dialog.js'),
        },
      ],
    },
  ];
}
