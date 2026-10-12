import processManagementRoutes from './process-management/index.js';
import personalSchedulesRoutes from './personal-schedules/index.js';
import approvalReturnRateRoutes from './reports/approval-return-rate.js';
import workbenchRoutes from './workbench/index.js';
import transferRoutes from './transfer/index.js';
import certificateRoutes from './certificates/index.js';
import attendanceManagementRoutes from './attendance-management/index.js';
import sealsRoutes from './seals/index.js';
import workItemRoutes from './work-items/index.js';
import accessRoutes from './access/index.js';
import knowledgeRoutes from './knowledge/index.js';
import recruitmentRoutes from './recruitment/index.js';
import onboardingRoutes from './onboarding/index.js';
import announcementsRoutes from './announcements/index.js';
import vehicleRoutes from './vehicles/index.js';
import meetingRoomRoutes from './meeting-rooms/index.js';
import salaryGradeRoutes from './job-grades/index.js';
import headcountsRoutes from './headcounts/index.js';
import templatePrintRoutes from './template-print/index.js';
import contractRoutes from './contracts/index.js';
import assetRequestRoutes from './asset-requests/index.js';
import vendorQualificationRoutes from './vendor-qualification/index.js';
import assetRoutes from './assets/index.js';
import departureRoutes from './departure/index.js';
import probationRoutes from './probation/index.js';
import loanRequestRoutes from './loan-requests/index.js';
import paymentRequestRoutes from './payment-requests/index.js';
import reimbursementRoutes from './reimbursement/index.js';
import purchaseRoutes from './purchases/index.js';
import vendorRoutes from './vendors/index.js';
import travelRoutes from './travel/index.js';
import financeAssignmentsRoutes from './finance-assignments/index.js';
import trainingRoutes from './training/index.js';
import expensePlanRoutes from './expense-plan/index.js';
import budgetAdjustmentRoutes from './budget-adjustments/index.js';
import budgetsRoutes from './budgets/index.js';
import suppliesRoutes from './supplies/index.js';
import generalRoutes from './general-requests/index.js';
import generalAttachmentRoutes from './general-requests/attachments.js';
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

import employeesRoutes from './employees/index.js';
import attendanceChangeRoutes from './attendance-change/index.js';
import outingsRoutes from './outings/index.js';
import attendanceChangeAttachmentsRoutes from './attendance-change-attachments/index.js';
import approvalCenterRoutes from './approval-center/index.js';
import approvalDelegationsRoutes from './approval-delegations/index.js';
import leaveAttachmentsRoutes from './leave-attachments/index.js';
import leaveBalancesRoutes from './leave-balances/index.js';
import leaveRoutes from './leave/index.js';
import cancellationRoutes from './leave-cancellations/index.js';
import overtimeRoutes from './overtime/index.js';
import importRoutes from './import/index.js';
import orgRoutes from './org/index.js';
import platformRoutes from './platform/index.js';
import reportRoutes from './reports/index.js';
import expenseSummaryRoutes from './reports/expense-summary.js';
import approvalEfficiencyRoutes from './reports/approval-efficiency.js';

// Each OA module owns `server/routes/<module>/` and exports its contributions from its `index.ts`.
const routes: readonly AppRouteContribution<Application>[] = [
  ...workbenchRoutes,
  ...processManagementRoutes,
  ...personalSchedulesRoutes,
  ...approvalReturnRateRoutes,
  ...accessRoutes,
  ...knowledgeRoutes,
  ...recruitmentRoutes,
  ...onboardingRoutes,
  ...transferRoutes,
  ...announcementsRoutes,
  ...workItemRoutes,
  ...platformRoutes,
  ...reportRoutes,
  ...expenseSummaryRoutes,
  ...approvalEfficiencyRoutes,
  ...budgetsRoutes,
  ...financeAssignmentsRoutes,
  ...vendorRoutes,
  ...orgRoutes,
  ...employeesRoutes,
  ...salaryGradeRoutes,
  ...meetingRoomRoutes,
  ...vehicleRoutes,
  ...headcountsRoutes,
  ...attendanceManagementRoutes,
  ...attendanceChangeRoutes,
  ...outingsRoutes,
  ...attendanceChangeAttachmentsRoutes,
  ...approvalCenterRoutes,
  ...approvalDelegationsRoutes,
  ...leaveBalancesRoutes,
  ...leaveRoutes,
  ...cancellationRoutes,
  ...overtimeRoutes,
  ...generalRoutes,
  ...budgetAdjustmentRoutes,
  ...expensePlanRoutes,
  ...trainingRoutes,
  ...travelRoutes,
  ...loanRequestRoutes,
  ...reimbursementRoutes,
  ...paymentRequestRoutes,
  ...probationRoutes,
  ...departureRoutes,
  ...assetRoutes,
  ...assetRequestRoutes,
  ...vendorQualificationRoutes,
  ...contractRoutes,
  ...sealsRoutes,
  ...templatePrintRoutes,
  ...certificateRoutes,
  ...purchaseRoutes,
  ...suppliesRoutes,
  ...generalAttachmentRoutes,
  ...leaveAttachmentsRoutes,
  ...importRoutes,
];

export default routes;
