import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { CalendarDays, CalendarRange } from 'lucide-react';
export default [
  defineAppRoutes([
    {
      name: 'oa-leave-balances',
      parent: 'oa-organization',
      path: '/leaveBalances',
      auth: 'required',
      authz: 'skip',
      navigation: {
        title: 'leaveBalances.title',
        icon: CalendarDays,
        order: 120,
      },
      componentLoader: () => import('../pages/leave-balances/index.js'),
    },
  ]),
  defineAppRoutes([
    {
      name: 'oa-leave-balance-administration',
      parent: 'oa-organization',
      path: '/leaveBalanceAdministration',
      auth: 'required',
      authz: {
        resource: { type: 'settings', id: 'oa.leaveBalances' },
        action: 'read',
      },
      navigation: {
        title: 'leaveBalances.adminTitle',
        icon: CalendarRange,
        order: 121,
      },
      componentLoader: () =>
        import('../pages/leave-balances/administration.js'),
      children: [
        {
          name: 'oa-leave-balance-adjust',
          path: 'adjust/:employeeId/:leaveType',
          authz: {
            resource: { type: 'settings', id: 'oa.leaveBalances' },
            action: 'update',
          },
          componentLoader: () =>
            import('../pages/leave-balances/adjust-dialog.js'),
        },
      ],
    },
  ]),
];
