import type { Application } from '@nocobase/app-server/application';
import { ApprovalService } from '@nocobase/app-plugin-approval/server';
import { LifecycleRuntime } from '@nocobase/lifecycle';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type {
  PerformInput,
  Approval,
} from '@nocobase/app-plugin-approval/server';
import { repairServiceToken } from '../it-repairs/service.js';
import { leaveServiceToken } from '../leave/index.js';
import { overtimeServiceToken } from '../overtime/index.js';
import { cancellationServiceToken } from '../leave-cancellations/index.js';
import { generalServiceToken } from '../general-requests/index.js';
import { attendanceChangeServiceToken } from '../attendance-change/index.js';
import { outingServiceToken } from '../outings/index.js';
import { supplyServiceToken } from '../supplies/index.js';
import { budgetAdjustmentServiceToken } from '../budget-adjustments/index.js';
import { expensePlanServiceToken } from '../expense-plan/index.js';
import { trainingServiceToken } from '../training/index.js';
import { travelServiceToken } from '../travel/index.js';
import { travelCancellationServiceToken } from '../travel/cancellation-service.js';
import { reimbursementServiceToken } from '../reimbursement/index.js';
import { purchaseServiceToken } from '../purchases/index.js';
import { loanRequestServiceToken } from '../loan-requests/contract.js';
import type { LoanRequestService } from '../loan-requests/service.js';
import { paymentRequestServiceToken } from '../payment-requests/contract.js';
import type { PaymentRequestService } from '../payment-requests/service.js';
import { probationServiceToken } from '../probation/index.js';
import { vehicleRequestServiceToken } from '../vehicles/index.js';
import { contractHttpServiceToken } from '../contracts/service.js';
import { assetRequestServiceToken } from '../asset-requests/index.js';
import { vendorQualificationServiceToken } from '../vendor-qualification/contract.js';
import { recruitmentServiceToken } from '../recruitment/service.js';
import { sealRequestServiceToken } from '../seals/index.js';
import { transferServiceToken } from '../transfer/service.js';
import { departureServiceToken } from '../departure/index.js';
import { certificateRequestServiceToken } from '../certificates/index.js';
export interface ProcessSdk {
  runtime: LifecycleRuntime;
  approvals: ApprovalService | null;
  read<T>(work: () => Promise<T>, connection?: DatabaseConnection): Promise<T>;
  definition?: Approval<never>;
}
export interface ProcessOwner {
  kind: string;
  collection: string;
  domain: string;
  zh: string;
  en: string;
  resource: string;
  sdk(app: Application): Promise<ProcessSdk>;
  action?: (
    app: Application,
    id: string,
    input: Omit<PerformInput, 'actor'>,
    actorId: string,
    policy: RepositoryPolicy,
  ) => Promise<unknown>;
  terminate?: (
    app: Application,
    id: string,
    actorId: string,
    version: number,
    requestId: string,
    reason: string,
    policy: RepositoryPolicy,
  ) => Promise<unknown>;
}
// Only fixed public application tokens. No client-supplied module/token/path is ever resolved.
async function publicSdk(service: unknown): Promise<ProcessSdk> {
  if (!service || typeof service !== 'object')
    throw new Error('Invalid process owner');
  let kit: unknown = service;
  if ('initialize' in service && typeof service.initialize === 'function') {
    const initialized: unknown = await (
      service.initialize as () => Promise<unknown>
    ).call(service);
    if (
      initialized &&
      typeof initialized === 'object' &&
      'runtime' in initialized
    )
      kit = initialized;
  }
  if (
    !kit ||
    typeof kit !== 'object' ||
    !('runtime' in kit) ||
    !(kit.runtime instanceof LifecycleRuntime) ||
    !('approvals' in kit) ||
    !(kit.approvals instanceof ApprovalService)
  )
    throw new Error('Process owner does not expose a public approval runtime');
  const runtime = kit.runtime,
    approvals = kit.approvals;
  const read =
    'read' in kit && typeof kit.read === 'function'
      ? (
          kit.read as (
            work: () => Promise<unknown>,
            connection?: DatabaseConnection,
          ) => Promise<unknown>
        ).bind(kit)
      : undefined;
  let definition: unknown =
    'approvalDefinition' in service ? service.approvalDefinition : undefined;
  if (
    !definition &&
    'definition' in kit &&
    kit.definition &&
    typeof kit.definition === 'object' &&
    'approval' in kit.definition
  )
    definition = kit.definition.approval;
  return {
    runtime,
    approvals,
    definition:
      definition &&
      typeof definition === 'object' &&
      'stage' in definition &&
      'describe' in definition
        ? (definition as Approval<never>)
        : undefined,
    read: async <T>(
      work: () => Promise<T>,
      connection?: DatabaseConnection,
    ): Promise<T> => (read ? ((await read(work, connection)) as T) : work()),
  };
}
export const processOwners: readonly ProcessOwner[] = [
  {
    kind: 'oa.itRepair',
    collection: 'itRepairs',
    domain: 'office',
    zh: 'IT 报修',
    en: 'IT repair',
    resource: 'oa.itRepairs',
    sdk: async (app) => ({
      runtime: app.container.resolve(repairServiceToken).runtime,
      approvals: null,
      read: async (work) => work(),
    }),
  },
  {
    kind: 'oa.leave',
    collection: 'leaveRequests',
    domain: 'office',
    zh: '请假',
    en: 'Leave',
    resource: 'oa.leave',
    sdk: (app) => publicSdk(app.container.resolve(leaveServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(leaveServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(leaveServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.overtime',
    collection: 'overtimeRequests',
    domain: 'office',
    zh: '加班申请',
    en: 'Overtime',
    resource: 'oa.overtime',
    sdk: (app) => publicSdk(app.container.resolve(overtimeServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(overtimeServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(overtimeServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.leaveCancellation',
    collection: 'leaveCancellations',
    domain: 'office',
    zh: '销假申请',
    en: 'Leave cancellation',
    resource: 'oa.leaveCancellation',
    sdk: (app) => publicSdk(app.container.resolve(cancellationServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(cancellationServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(cancellationServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.general',
    collection: 'generalRequests',
    domain: 'office',
    zh: '通用申请',
    en: 'General request',
    resource: 'oa.general',
    sdk: (app) => publicSdk(app.container.resolve(generalServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(generalServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(generalServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.attendanceChange',
    collection: 'attendanceChangeRequests',
    domain: 'organization',
    zh: '考勤更正',
    en: 'Attendance correction',
    resource: 'oa.attendanceChange',
    sdk: (app) =>
      publicSdk(app.container.resolve(attendanceChangeServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(attendanceChangeServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(attendanceChangeServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.outing',
    collection: 'outingRequests',
    domain: 'office',
    zh: '外出申请',
    en: 'Outing',
    resource: 'oa.outing',
    sdk: (app) => publicSdk(app.container.resolve(outingServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(outingServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(outingServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.supplies',
    collection: 'supplyRequests',
    domain: 'administration',
    zh: '用品领用',
    en: 'Supply request',
    resource: 'oa.supplies',
    sdk: (app) => publicSdk(app.container.resolve(supplyServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(supplyServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(supplyServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.budgetAdjustment',
    collection: 'budgetAdjustments',
    domain: 'finance',
    zh: '预算调整',
    en: 'Budget adjustment',
    resource: 'oa.budgetAdjustment',
    sdk: (app) =>
      publicSdk(app.container.resolve(budgetAdjustmentServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(budgetAdjustmentServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(budgetAdjustmentServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.expensePlan',
    collection: 'expensePlans',
    domain: 'finance',
    zh: '费用事前申请',
    en: 'Expense authorization',
    resource: 'oa.expensePlan',
    sdk: (app) => publicSdk(app.container.resolve(expensePlanServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(expensePlanServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(expensePlanServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.training',
    collection: 'trainingRequests',
    domain: 'organization',
    zh: '培训申请',
    en: 'Training',
    resource: 'oa.training',
    sdk: (app) => publicSdk(app.container.resolve(trainingServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(trainingServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(trainingServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.travel',
    collection: 'travelRequests',
    domain: 'office',
    zh: '出差申请',
    en: 'Travel',
    resource: 'oa.travel',
    sdk: (app) => publicSdk(app.container.resolve(travelServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(travelServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(travelServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.travelCancellation',
    collection: 'travelCancellations',
    domain: 'office',
    zh: '出差取消',
    en: 'Travel cancellation',
    resource: 'oa.travelCancellation',
    sdk: (app) =>
      publicSdk(app.container.resolve(travelCancellationServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(travelCancellationServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(travelCancellationServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.reimbursement',
    collection: 'reimbursementRequests',
    domain: 'finance',
    zh: '费用报销',
    en: 'Reimbursement',
    resource: 'oa.reimbursement',
    sdk: (app) => publicSdk(app.container.resolve(reimbursementServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(reimbursementServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(reimbursementServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.purchase',
    collection: 'purchaseRequests',
    domain: 'procurement',
    zh: '采购申请',
    en: 'Purchase',
    resource: 'oa.purchase',
    sdk: (app) => publicSdk(app.container.resolve(purchaseServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(purchaseServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(purchaseServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.loan',
    collection: 'loanRequests',
    domain: 'finance',
    zh: '借款申请',
    en: 'Loan request',
    resource: 'oa.loan',
    sdk: (app) => publicSdk(app.container.resolve(loanRequestServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(loanRequestServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      (
        app.container.resolve(loanRequestServiceToken) as LoanRequestService
      ).transition(
        id,
        'terminate',
        actorId,
        version,
        requestId,
        { reason },
        policy,
        policy,
      ),
  },
  {
    kind: 'oa.payment',
    collection: 'paymentRequests',
    domain: 'finance',
    zh: '付款申请',
    en: 'Payment request',
    resource: 'oa.payment',
    sdk: (app) => publicSdk(app.container.resolve(paymentRequestServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(paymentRequestServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      (
        app.container.resolve(
          paymentRequestServiceToken,
        ) as PaymentRequestService
      ).transition(
        id,
        'terminate',
        actorId,
        version,
        requestId,
        { reason },
        policy,
        policy,
      ),
  },
  {
    kind: 'oa.probation',
    collection: 'probationRequests',
    domain: 'organization',
    zh: '转正申请',
    en: 'Probation review',
    resource: 'oa.probation',
    sdk: (app) => publicSdk(app.container.resolve(probationServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(probationServiceToken)
        .action(id, input, actorId, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(probationServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.vehicleRequest',
    collection: 'vehicleRequests',
    domain: 'administration',
    zh: '车辆申请',
    en: 'Vehicle request',
    resource: 'oa.vehicleRequests',
    sdk: (app) => publicSdk(app.container.resolve(vehicleRequestServiceToken)),
    action: (app, id, input, actorId, policy) =>
      app.container
        .resolve(vehicleRequestServiceToken)
        .action(id, input, actorId, {}, policy),
    terminate: (app, id, actorId, version, requestId, reason, policy) =>
      app.container
        .resolve(vehicleRequestServiceToken)
        .transition(
          id,
          'terminate',
          actorId,
          version,
          requestId,
          { reason },
          policy,
          policy,
        ),
  },
  {
    kind: 'oa.contract',
    collection: 'contractRequests',
    domain: 'procurement',
    zh: '合同审批',
    en: 'Contract',
    resource: 'oa.contracts',
    sdk: (app) => publicSdk(app.container.resolve(contractHttpServiceToken)),
  },
  {
    kind: 'oa.assetRequest',
    collection: 'assetRequests',
    domain: 'administration',
    zh: '资产申请',
    en: 'Asset request',
    resource: 'oa.assetRequests',
    sdk: (app) => publicSdk(app.container.resolve(assetRequestServiceToken)),
  },
  {
    kind: 'oa.vendorQualification',
    collection: 'vendorQualifications',
    domain: 'procurement',
    zh: '供应商准入',
    en: 'Vendor qualification',
    resource: 'oa.vendorQualifications',
    sdk: (app) =>
      publicSdk(app.container.resolve(vendorQualificationServiceToken)),
  },
  {
    kind: 'oa.recruitment',
    collection: 'recruitmentRequests',
    domain: 'organization',
    zh: '招聘需求',
    en: 'Recruitment',
    resource: 'oa.recruitment',
    sdk: (app) => publicSdk(app.container.resolve(recruitmentServiceToken)),
  },
  {
    kind: 'oa.sealRequest',
    collection: 'sealRequests',
    domain: 'administration',
    zh: '用印申请',
    en: 'Seal request',
    resource: 'oa.sealRequests',
    sdk: (app) => publicSdk(app.container.resolve(sealRequestServiceToken)),
  },
  {
    kind: 'oa.transfer',
    collection: 'transferRequests',
    domain: 'organization',
    zh: '转岗调薪',
    en: 'Personnel change',
    resource: 'oa.transfer',
    sdk: (app) => publicSdk(app.container.resolve(transferServiceToken)),
  },
  {
    kind: 'oa.departure',
    collection: 'departureRequests',
    domain: 'organization',
    zh: '离职申请',
    en: 'Departure',
    resource: 'oa.departure',
    sdk: (app) => publicSdk(app.container.resolve(departureServiceToken)),
  },
  {
    kind: 'oa.certificateRequest',
    collection: 'certificateRequests',
    domain: 'organization',
    zh: '证明开具',
    en: 'Certificate request',
    resource: 'oa.certificateRequests',
    sdk: (app) =>
      publicSdk(app.container.resolve(certificateRequestServiceToken)),
  },
];
export const processResource = (kind: string) =>
  `oa.processManagement.${kind.slice(3)}`;
