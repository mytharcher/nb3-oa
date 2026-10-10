import { ClipboardCheck, UserRoundCheck } from 'lucide-react';
import {
  defineAppRoutes,
  defineSettingsRoutes,
  type AppClientRouteContribution,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';

function detailChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-edit`,
      path: 'edit',
      componentLoader: () => import('../pages/approvals/form-page.js'),
    },
    {
      name: `${owner}-action`,
      path: 'action/:actionName/:targetId',
      componentLoader: () => import('../pages/approvals/action-dialog.js'),
    },
  ];
}
function viewChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-new`,
      path: 'newLeave',
      componentLoader: () => import('../pages/approvals/form-page.js'),
    },
    {
      name: `${owner}-edit`,
      path: 'editLeave/:requestId',
      componentLoader: () => import('../pages/approvals/form-page.js'),
    },
    {
      name: `${owner}-detail`,
      path: 'leave/:requestId',
      componentLoader: () => import('../pages/approvals/detail.js'),
      children: detailChildren(`${owner}-detail`),
    },
  ];
}
const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'oa-approvals',
      path: '/approvals',
      auth: 'required',
      authz: {
        resource: { type: 'page', id: 'oa.approvals' },
        action: 'access',
      },
      navigation: {
        title: 'approvals.navigation.center',
        icon: ClipboardCheck,
      },
      componentLoader: () => import('../pages/approvals/index.js'),
      children: ['todo', 'done', 'copied', 'mine'].map((tab) => ({
        name: `oa-approvals-${tab}`,
        path: tab,
        componentLoader: () => import('../pages/approvals/list.js'),
        children: viewChildren(`oa-approvals-${tab}`),
      })),
    },
  ]),
  defineSettingsRoutes([
    {
      name: 'oa-approval-delegations',
      parent: 'oa-configuration',
      path: '/approvalDelegations',
      authz: {
        resource: { type: 'settings', id: 'oa.approvalDelegations' },
        action: 'read',
      },
      navigation: {
        title: 'approvals.navigation.delegations',
        icon: UserRoundCheck,
        order: 40,
      },
      componentLoader: () => import('../pages/approval-delegations/index.js'),
      children: [
        {
          name: 'oa-approval-delegations-new',
          path: 'new',
          componentLoader: () =>
            import('../pages/approval-delegations/form-dialog.js'),
        },
        {
          name: 'oa-approval-delegations-edit',
          path: 'edit/:delegationId',
          componentLoader: () =>
            import('../pages/approval-delegations/form-dialog.js'),
        },
        {
          name: 'oa-approval-delegations-leave',
          path: 'leave/:requestId',
          componentLoader: () => import('../pages/approvals/detail.js'),
          children: detailChildren('oa-approval-delegations-leave'),
        },
      ],
    },
  ]),
];
export default routes;
