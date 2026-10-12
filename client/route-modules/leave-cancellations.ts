import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
/** Embed cancellation records under each approval-center tab so closing preserves its originating view. */
export function cancellationViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-cancellation-new`,
      path: 'newCancellation',
      componentLoader: () =>
        import('../pages/leave-cancellations/form-dialog.js'),
    },
    {
      name: `${owner}-cancellation-edit`,
      path: 'editCancellation/:requestId',
      componentLoader: () =>
        import('../pages/leave-cancellations/form-dialog.js'),
    },
    {
      name: `${owner}-cancellation-detail`,
      path: 'cancellation/:requestId',
      componentLoader: () => import('../pages/leave-cancellations/detail.js'),
      children: [
        {
          name: `${owner}-cancellation-detail-edit`,
          path: 'edit',
          componentLoader: () =>
            import('../pages/leave-cancellations/form-dialog.js'),
        },
        {
          name: `${owner}-cancellation-detail-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () =>
            import('../pages/leave-cancellations/action-dialog.js'),
        },
      ],
    },
  ];
}
