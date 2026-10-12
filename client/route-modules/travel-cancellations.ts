import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
export function travelCancellationViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-travelCancellation-new`,
      path: 'newTravelCancellation',
      componentLoader: () =>
        import('../pages/travel-cancellations/form-dialog.js'),
    },
    {
      name: `${owner}-travelCancellation-edit`,
      path: 'editTravelCancellation/:requestId',
      componentLoader: () =>
        import('../pages/travel-cancellations/form-dialog.js'),
    },
    {
      name: `${owner}-travelCancellation-detail`,
      path: 'travelCancellation/:requestId',
      componentLoader: () => import('../pages/travel-cancellations/detail.js'),
      children: [
        {
          name: `${owner}-travelCancellation-detail-edit`,
          path: 'edit',
          componentLoader: () =>
            import('../pages/travel-cancellations/form-dialog.js'),
        },
        {
          name: `${owner}-travelCancellation-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () =>
            import('../pages/travel-cancellations/action-dialog.js'),
        },
      ],
    },
  ];
}
