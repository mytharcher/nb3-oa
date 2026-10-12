import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
export function budgetAdjustmentViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-budget-adjustment-new`,
      path: 'newBudgetAdjustment',
      componentLoader: () =>
        import('../pages/budget-adjustments/form-dialog.js'),
    },
    {
      name: `${owner}-budget-adjustment-edit`,
      path: 'editBudgetAdjustment/:requestId',
      componentLoader: () =>
        import('../pages/budget-adjustments/form-dialog.js'),
    },
    {
      name: `${owner}-budget-adjustment-detail`,
      path: 'budgetAdjustment/:requestId',
      componentLoader: () => import('../pages/budget-adjustments/detail.js'),
      children: [
        {
          name: `${owner}-budget-adjustment-detail-edit`,
          path: 'edit',
          componentLoader: () =>
            import('../pages/budget-adjustments/form-dialog.js'),
        },
        {
          name: `${owner}-budget-adjustment-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () =>
            import('../pages/budget-adjustments/action-dialog.js'),
        },
      ],
    },
  ];
}
