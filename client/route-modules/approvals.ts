import { vehicleViewChildren } from './vehicles.js';
import { recruitmentViewChildren } from './recruitment.js';
import { sealViewChildren } from './seals.js';
import { transferViewChildren } from './transfer.js';
import { certificateViewChildren } from './certificates.js';
import { contractViewChildren } from './contracts.js';
import { assetRequestViewChildren } from './asset-requests.js';
import { vendorQualificationViewChildren } from './vendor-qualifications.js';
import { departureViewChildren } from './departure.js';
import { probationViewChildren } from './probation-requests.js';
import { paymentViewChildren } from './payment-requests.js';
import { loanViewChildren } from './loan-requests.js';
import { purchaseViewChildren } from './purchases.js';
import { reimbursementViewChildren } from './reimbursement-requests.js';
import { travelViewChildren } from './travel.js';
import { travelCancellationViewChildren } from './travel-cancellations.js';
import { expensePlanViewChildren } from './expense-plan.js';
import { trainingViewChildren } from './training.js';
import { budgetAdjustmentViewChildren } from './budget-adjustments.js';
import { supplyViewChildren } from './supplies.js';
import { attendanceChangeViewChildren } from './attendance-change.js';
import { outingsViewChildren } from './outings.js';
import { generalRequestViewChildren } from './general-requests.js';
import { cancellationViewChildren } from './leave-cancellations.js';
import { ClipboardCheck, UserRoundCheck } from 'lucide-react';
import { overtimeViewChildren } from './overtime.js';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';

function detailChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-print`,
      path: 'print',
      componentLoader: () => import('../pages/template-print/print-dialog.js'),
    },
    {
      name: `${owner}-new-cancellation`,
      path: 'newCancellation',
      componentLoader: () =>
        import('../pages/leave-cancellations/form-dialog.js'),
    },
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
export function nonApprovalViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-work-item`,
      path: 'workItem/:workItemId',
      authz: {
        resource: { type: 'composite', id: 'oa.workItems' },
        action: 'view',
      },
      componentLoader: () => import('../pages/work-items/detail.js'),
      children: [
        {
          name: `${owner}-work-item-edit`,
          path: 'edit',
          authz: {
            resource: { type: 'composite', id: 'oa.workItems' },
            action: 'edit',
          },
          componentLoader: () => import('../pages/work-items/form.js'),
        },
        {
          name: `${owner}-work-item-action`,
          path: 'actions/:action',
          componentLoader: () => import('../pages/work-items/form.js'),
        },
        {
          name: `${owner}-work-item-handover`,
          path: 'handover-confirmation',
          componentLoader: () => import('../pages/work-items/handover.js'),
        },
      ],
    },
    {
      name: `${owner}-announcement`,
      path: 'announcement/:announcementId',
      authz: {
        resource: { type: 'composite', id: 'oa.announcements' },
        action: 'view',
      },
      componentLoader: () => import('../pages/announcements/detail.js'),
      children: ['publish', 'revoke', 'remind', 'confirm'].map((action) => ({
        name: `${owner}-announcement-${action}`,
        path: `actions/${action}`,
        authz: {
          resource: { type: 'composite' as const, id: 'oa.announcements' },
          action,
        },
        componentLoader: () => import('../pages/announcements/action.js'),
      })),
    },
  ];
}
export function viewChildren(owner: string): AppClientRouteDefinition[] {
  return [
    ...nonApprovalViewChildren(owner),
    ...vehicleViewChildren(owner),
    ...recruitmentViewChildren(owner),
    ...sealViewChildren(owner),
    ...transferViewChildren(owner),
    ...certificateViewChildren(owner),
    ...overtimeViewChildren(owner),
    ...generalRequestViewChildren(owner),
    ...supplyViewChildren(owner),
    ...trainingViewChildren(owner),
    ...travelViewChildren(owner),
    ...reimbursementViewChildren(owner),
    ...purchaseViewChildren(owner),
    ...loanViewChildren(owner),
    ...paymentViewChildren(owner),
    ...probationViewChildren(owner),
    ...departureViewChildren(owner),
    ...vendorQualificationViewChildren(owner),
    ...assetRequestViewChildren(owner),
    ...contractViewChildren(owner),
    ...travelCancellationViewChildren(owner),
    ...expensePlanViewChildren(owner),
    ...budgetAdjustmentViewChildren(owner),
    ...attendanceChangeViewChildren(owner),
    ...outingsViewChildren(owner),
    ...cancellationViewChildren(owner),
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
        order: 20,
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
  defineAppRoutes([
    {
      name: 'oa-approval-delegations',
      auth: 'required',
      parent: 'oa-personal',
      path: '/approvalDelegations',
      authz: {
        resource: { type: 'settings', id: 'oa.approvalDelegations' },
        action: 'read',
      },
      navigation: {
        title: 'approvals.navigation.delegations',
        icon: UserRoundCheck,
        order: 130,
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
