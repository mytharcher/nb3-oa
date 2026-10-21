import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
export function travelViewChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-travel-new`,
      path: 'newTravel',
      componentLoader: () => import('../pages/travel/form-dialog.js'),
    },
    {
      name: `${owner}-travel-edit`,
      path: 'editTravel/:requestId',
      componentLoader: () => import('../pages/travel/form-dialog.js'),
    },
    {
      name: `${owner}-travel-detail`,
      path: 'travel/:requestId',
      componentLoader: () => import('../pages/travel/detail.js'),
      children: [
        {
          name: `${owner}-travel-new-loan`,
          path: 'newLoan',
          authz: {
            resource: { type: 'page', id: 'oa-loan-requests' },
            action: 'access',
          },
          componentLoader: () =>
            import('../pages/loan-requests/form-dialog.js'),
        },
        {
          name: `${owner}-travel-detail-edit`,
          path: 'edit',
          componentLoader: () => import('../pages/travel/form-dialog.js'),
        },
        {
          name: `${owner}-travel-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () => import('../pages/travel/action-dialog.js'),
        },
      ],
    },
  ];
}
