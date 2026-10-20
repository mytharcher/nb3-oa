import demoDataRoutes from './route-modules/demo-data.js';
import headcountsRoutes from './route-modules/headcounts.js';
import processManagementRoutes from './route-modules/process-management.js';
import attendanceImportRoutes from './route-modules/attendance-import.js';
import onboardingRoutes from './route-modules/onboarding.js';
import { vehicleViewChildren } from './route-modules/vehicles.js';
import recruitmentRoutes, {
  recruitmentViewChildren,
} from './route-modules/recruitment.js';
import sealsRoutes, { sealViewChildren } from './route-modules/seals.js';
import announcementsRoutes from './route-modules/announcements.js';
import { centerEntry } from './pages/approvals/center-entry.js';
import workItemsRoutes from './route-modules/work-items.js';
import knowledgeRoutes from './route-modules/knowledge.js';
import certificateRoutes, {
  certificateViewChildren,
} from './route-modules/certificates.js';
import attendanceManagementRoutes from './route-modules/attendance-management.js';
import transferRoutes, {
  transferViewChildren,
} from './route-modules/transfer.js';
import accessRoutes from './route-modules/access.js';
import meetingRoomRoutes from './route-modules/meeting-rooms.js';
import vehicleRoutes from './route-modules/vehicles.js';
import jobGradesRoutes from './route-modules/job-grades.js';
import templatePrintRoutes from './route-modules/template-print.js';
import {
  contractRoutes,
  contractViewChildren,
} from './route-modules/contracts.js';
import assetRequestRoutes, {
  assetRequestViewChildren,
} from './route-modules/asset-requests.js';
import {
  vendorQualificationRoutes,
  vendorQualificationViewChildren,
} from './route-modules/vendor-qualifications.js';
import {
  departureRequestRoutes,
  departureViewChildren,
} from './route-modules/departure.js';
import {
  probationRequestRoutes,
  probationViewChildren,
} from './route-modules/probation-requests.js';
import {
  paymentViewChildren,
  paymentRequestRoutes,
} from './route-modules/payment-requests.js';
import { loanViewChildren } from './route-modules/loan-requests.js';
import purchaseRoutes, {
  purchaseViewChildren,
} from './route-modules/purchases.js';
import {
  reimbursementRequestRoutes,
  reimbursementViewChildren,
} from './route-modules/reimbursement-requests.js';
import { loanRequestRoutes } from './route-modules/loan-requests.js';
import { travelViewChildren } from './route-modules/travel.js';
import { travelCancellationViewChildren } from './route-modules/travel-cancellations.js';
import vendorsRoutes from './route-modules/vendors.js';
import { expensePlanViewChildren } from './route-modules/expense-plan.js';
import { trainingViewChildren } from './route-modules/training.js';
import financeAssignmentsRoutes from './route-modules/finance-assignments.js';
import { budgetAdjustmentViewChildren } from './route-modules/budget-adjustments.js';
import suppliesRoutes, {
  supplyViewChildren,
} from './route-modules/supplies.js';
import budgetsRoutes from './route-modules/budgets.js';
import reportsRoutes from './route-modules/reports.js';
import { attendanceChangeViewChildren } from './route-modules/attendance-change.js';
import { outingsViewChildren } from './route-modules/outings.js';
import { generalRequestViewChildren } from './route-modules/general-requests.js';
import { cancellationViewChildren } from './route-modules/leave-cancellations.js';
import {
  UsersRound,
  LayoutDashboard,
  ScrollText,
  SlidersHorizontal,
  Bell,
  Bot,
  NotebookTabs,
  Landmark,
  BriefcaseBusiness,
  Boxes,
} from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

import administrationRoutes from './route-modules/administration.js';
import agentsRoutes from './route-modules/agents.js';
import { overtimeViewChildren } from './route-modules/overtime.js';
import approvalsRoutes, {
  nonApprovalViewChildren,
} from './route-modules/approvals.js';
import leaveBalanceRoutes from './route-modules/leave-balances.js';
import employeesRoutes from './route-modules/employees.js';
import importRoutes from './route-modules/import.js';
import orgRoutes from './route-modules/org.js';
import platformRoutes from './route-modules/platform.js';

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    // Every signed-in user reaches the landing page. `authz: 'skip'` takes it out of page authorization entirely, so
    // no permission change can leave a user signed in with nowhere to land.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/home/index.js'),
    name: 'home',
    navigation: { title: 'navigation.home', icon: LayoutDashboard, order: 10 },
    path: '/',
    // Approval records open over the workbench; these children retain the approval center's page grant.
    children: [
      ...[
        ...nonApprovalViewChildren('home'),
        ...vehicleViewChildren('home'),
        ...recruitmentViewChildren('home'),
        ...sealViewChildren('home'),
        ...transferViewChildren('home'),
        ...certificateViewChildren('home'),
      ].map((route) => {
        if (!route.componentLoader) return route;
        return {
          ...route,
          componentLoader: centerEntry(route.componentLoader),
        };
      }),
      ...[
        ...attendanceChangeViewChildren('home'),
        ...outingsViewChildren('home'),
        ...generalRequestViewChildren('home'),
        ...supplyViewChildren('home'),
        ...budgetAdjustmentViewChildren('home'),
        ...trainingViewChildren('home'),
        ...travelViewChildren('home'),
        ...reimbursementViewChildren('home'),
        ...purchaseViewChildren('home'),
        ...loanViewChildren('home'),
        ...paymentViewChildren('home'),
        ...probationViewChildren('home'),
        ...departureViewChildren('home'),
        ...vendorQualificationViewChildren('home'),
        ...assetRequestViewChildren('home'),
        ...contractViewChildren('home'),
        ...travelCancellationViewChildren('home'),
        ...expensePlanViewChildren('home'),
      ].map((route) => ({
        ...route,
        authz: {
          resource: { type: 'page' as const, id: 'oa.approvals' },
          action: 'access',
        },
      })),
      ...cancellationViewChildren('home').map((route) => ({
        ...route,
        authz: {
          resource: { type: 'page' as const, id: 'oa.approvals' },
          action: 'access',
        },
      })),
      ...overtimeViewChildren('home').map((route) => ({
        ...route,
        authz: {
          resource: { type: 'page' as const, id: 'oa.approvals' },
          action: 'access',
        },
      })),
      {
        name: 'home-new',
        path: 'newLeave',
        authz: {
          resource: { type: 'page', id: 'oa.approvals' },
          action: 'access',
        },
        componentLoader: () => import('./pages/approvals/form-page.js'),
      },
      {
        name: 'home-edit',
        path: 'editLeave/:requestId',
        authz: {
          resource: { type: 'page', id: 'oa.approvals' },
          action: 'access',
        },
        componentLoader: () => import('./pages/approvals/form-page.js'),
      },
      {
        name: 'home-detail',
        path: 'leave/:requestId',
        authz: {
          resource: { type: 'page', id: 'oa.approvals' },
          action: 'access',
        },
        componentLoader: () => import('./pages/approvals/detail.js'),
        children: [
          {
            name: 'home-detail-new-cancellation',
            path: 'newCancellation',
            componentLoader: () =>
              import('./pages/leave-cancellations/form-dialog.js'),
          },
          {
            name: 'home-detail-edit',
            path: 'edit',
            componentLoader: () => import('./pages/approvals/form-page.js'),
          },
          {
            name: 'home-detail-action',
            path: 'action/:actionName/:targetId',
            componentLoader: () => import('./pages/approvals/action-dialog.js'),
          },
        ],
      },
    ],
  },
  {
    // Messages are part of the daily application navigation.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/inbox.js'),
    name: 'inbox',
    navigation: { title: 'oa.navigation.inbox', icon: Bell, order: 40 },
    path: '/inbox',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/login.js'),
    name: 'login',
    path: '/login',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/register.js'),
    name: 'register',
    path: '/register',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/forgot-password.js'),
    name: 'forgot-password',
    path: '/forgot-password',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/reset-password.js'),
    name: 'reset-password',
    path: '/reset-password',
  },
  {
    // Where a command line's sign-in sends the person to approve it (`pages/auth/device.tsx`). Optional rather than
    // required so it renders outside the shell, like the sign-in pages; the page sends a guest to sign in and back.
    auth: 'optional',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/device.js'),
    name: 'device',
    path: '/device',
  },
]);

// Daily entry points stay at the top level. Business pages belong to a domain group,
// with organization data and personnel processes together, and shared office tools separate.
// Pathless groups preserve existing URLs and each page's independent authorization.
const managementRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'oa-office',
    navigation: {
      title: 'oa.navigation.office',
      icon: NotebookTabs,
      order: 45,
    },
    children: [],
  },
  {
    name: 'oa-finance',
    navigation: { title: 'oa.navigation.finance', icon: Landmark, order: 60 },
    children: [],
  },
  {
    name: 'oa-procurement',
    navigation: {
      title: 'oa.navigation.procurement',
      icon: BriefcaseBusiness,
      order: 70,
    },
    children: [],
  },
  {
    name: 'oa-administration',
    navigation: {
      title: 'oa.navigation.administration',
      icon: Boxes,
      order: 80,
    },
    children: [],
  },
  {
    name: 'oa-organization',
    navigation: {
      title: 'oa.navigation.organization',
      icon: UsersRound,
      order: 50,
    },
    children: [],
  },
  {
    name: 'oa-configuration',
    navigation: {
      title: 'oa.navigation.configuration',
      icon: SlidersHorizontal,
      order: 100,
    },
    children: [],
  },
  {
    name: 'oa-automation',
    navigation: {
      title: 'oa.navigation.automation',
      icon: Bot,
      order: 110,
    },
    children: [],
  },
  {
    name: 'oa-system',
    navigation: { title: 'oa.navigation.system', icon: ScrollText, order: 120 },
    children: [],
  },
]);

const routes: readonly AppClientRouteContribution[] = [
  appRoutes,
  demoDataRoutes,
  managementRoutes,
  budgetsRoutes,
  reportsRoutes,
  jobGradesRoutes,
  loanRequestRoutes,
  reimbursementRequestRoutes,
  financeAssignmentsRoutes,
  vendorsRoutes,
  purchaseRoutes,
  paymentRequestRoutes,
  probationRequestRoutes,
  departureRequestRoutes,
  vendorQualificationRoutes,
  ...assetRequestRoutes,
  contractRoutes,
  templatePrintRoutes,
  suppliesRoutes,
  accessRoutes,
  recruitmentRoutes,
  headcountsRoutes,
  onboardingRoutes,
  sealsRoutes,
  announcementsRoutes,
  workItemsRoutes,
  knowledgeRoutes,
  certificateRoutes,
  attendanceManagementRoutes,
  attendanceImportRoutes,
  processManagementRoutes,
  transferRoutes,
  meetingRoomRoutes,
  vehicleRoutes,
  administrationRoutes,
  agentsRoutes,
  ...orgRoutes,
  ...employeesRoutes,
  ...platformRoutes,
  ...importRoutes,
  ...approvalsRoutes,
  ...leaveBalanceRoutes,
];

export default routes;
