import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
export function expensePlanViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-expense-plan-new`,
      path: 'newExpensePlan',
      componentLoader: () => import('../pages/expense-plan/form-dialog.js'),
    },
    {
      name: `${owner}-expense-plan-edit`,
      path: 'editExpensePlan/:requestId',
      componentLoader: () => import('../pages/expense-plan/form-dialog.js'),
    },
    {
      name: `${owner}-expense-plan-detail`,
      path: 'expensePlan/:requestId',
      componentLoader: () => import('../pages/expense-plan/detail.js'),
      children: [
        {
          name: `${owner}-expense-plan-detail-edit`,
          path: 'edit',
          componentLoader: () => import('../pages/expense-plan/form-dialog.js'),
        },
        {
          name: `${owner}-expense-plan-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () =>
            import('../pages/expense-plan/action-dialog.js'),
        },
      ],
    },
  ];
}
