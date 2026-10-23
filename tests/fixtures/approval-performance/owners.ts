import type { OrgTestApp } from '../../logic/org/helpers.js';
import { overtimeServiceToken } from '../../../server/providers/overtime/index.ts';
import { cancellationServiceToken } from '../../../server/providers/leave-cancellations/index.ts';
import { recruitmentServiceToken } from '../../../server/providers/recruitment/index.ts';
import { supplyServiceToken } from '../../../server/providers/supplies/index.ts';
import { reimbursementServiceToken } from '../../../server/providers/reimbursement/index.ts';
import { generalServiceToken } from '../../../server/providers/general-requests/index.ts';
import { probationServiceToken } from '../../../server/providers/probation/index.ts';
import { departureServiceToken } from '../../../server/providers/departure/index.ts';
import { attendanceChangeServiceToken } from '../../../server/providers/attendance-change/index.ts';
import { purchaseServiceToken } from '../../../server/providers/purchases/index.ts';
import { paymentRequestServiceToken } from '../../../server/providers/payment-requests/contract.js';
import { outingServiceToken } from '../../../server/providers/outings/index.ts';
import { vendorQualificationHttpServiceToken } from '../../../server/providers/vendor-qualification/service.js';
import { travelServiceToken } from '../../../server/providers/travel/index.ts';
import { trainingServiceToken } from '../../../server/providers/training/index.ts';
import { transferServiceToken } from '../../../server/providers/transfer/index.ts';
import { expensePlanServiceToken } from '../../../server/providers/expense-plan/index.ts';
import { budgetAdjustmentServiceToken } from '../../../server/providers/budget-adjustments/index.ts';
import { leaveServiceToken } from '../../../server/providers/leave/index.ts';
import { contractHttpServiceToken } from '../../../server/providers/contracts/service.js';
import { assetRequestServiceToken } from '../../../server/providers/asset-requests/index.ts';
import { loanRequestServiceToken } from '../../../server/providers/loan-requests/contract.js';
import { travelCancellationServiceToken } from '../../../server/providers/travel/cancellation-provider.ts';
export const readableOwners = [
  {
    collection: 'overtimeRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(overtimeServiceToken),
  },
  {
    collection: 'leaveCancellations',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(cancellationServiceToken),
  },
  {
    collection: 'recruitmentRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(recruitmentServiceToken),
  },
  {
    collection: 'supplyRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(supplyServiceToken),
  },
  {
    collection: 'reimbursementRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(reimbursementServiceToken),
  },
  {
    collection: 'generalRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(generalServiceToken),
  },
  {
    collection: 'probationRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(probationServiceToken),
  },
  {
    collection: 'departureRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(departureServiceToken),
  },
  {
    collection: 'attendanceChangeRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(attendanceChangeServiceToken),
  },
  {
    collection: 'purchaseRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(purchaseServiceToken),
  },
  {
    collection: 'paymentRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(paymentRequestServiceToken),
  },
  {
    collection: 'outingRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(outingServiceToken),
  },
  {
    collection: 'vendorQualifications',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(
        vendorQualificationHttpServiceToken,
      ),
  },
  {
    collection: 'travelRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(travelServiceToken),
  },
  {
    collection: 'trainingRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(trainingServiceToken),
  },
  {
    collection: 'transferRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(transferServiceToken),
  },
  {
    collection: 'expensePlans',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(expensePlanServiceToken),
  },
  {
    collection: 'budgetAdjustments',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(budgetAdjustmentServiceToken),
  },
  {
    collection: 'leaveRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(leaveServiceToken),
  },
  {
    collection: 'contractRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(contractHttpServiceToken),
  },
  {
    collection: 'assetRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(assetRequestServiceToken),
  },
  {
    collection: 'loanRequests',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(loanRequestServiceToken),
  },
  {
    collection: 'travelCancellations',
    service: (app: OrgTestApp) =>
      app.testApp.application.container.resolve(travelCancellationServiceToken),
  },
];
