import { transferServiceToken } from '../transfer/service.js';
import { certificateRequestServiceToken } from '../certificates/contract.js';
import { sealRequestServiceToken } from '../seals/contract.js';
import { recruitmentServiceToken } from '../recruitment/index.js';
import { vehicleRequestServiceToken } from '../vehicles/index.js';
import { contractServiceToken } from '../contracts/contract.js';
import { assetRequestServiceToken } from '../asset-requests/contract.js';
import { vendorQualificationServiceToken } from '../vendor-qualification/contract.js';
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization/server';
import type { RepositoryPolicy } from '@nocobase/db';
import { DepartureReassignmentError } from './service.js';
import type { Application } from '@nocobase/app-server/application';
import type { ReassignmentOwner } from './service.js';
import { leaveServiceToken } from '../leave/service.js';
import { cancellationServiceToken } from '../leave-cancellations/service.js';
import { attendanceChangeServiceToken } from '../attendance-change/service.js';
import { outingServiceToken } from '../outings/service.js';
import { overtimeServiceToken } from '../overtime/service.js';
import { generalServiceToken } from '../general-requests/service.js';
import { budgetAdjustmentServiceToken } from '../budget-adjustments/service.js';
import { expensePlanServiceToken } from '../expense-plan/service.js';
import { trainingServiceToken } from '../training/service.js';
import { travelServiceToken } from '../travel/contract.js';
import { travelCancellationServiceToken } from '../travel/cancellation-service.js';
import { loanRequestServiceToken } from '../loan-requests/contract.js';
import { reimbursementServiceToken } from '../reimbursement/service.js';
import { paymentRequestServiceToken } from '../payment-requests/contract.js';
import { probationServiceToken } from '../probation/contract.js';
import { supplyServiceToken } from '../supplies/service.js';
import { purchaseServiceToken } from '../purchases/service.js';
import { departureServiceToken } from '../departure/contract.js';

/** Explicit coverage of application-owned registered approvals. Historical unregistered plugins are outside this contract. */
export const REASSIGNMENT_LIFECYCLES = [
  'oa.leave',
  'oa.leaveCancellation',
  'oa.attendanceChange',
  'oa.outing',
  'oa.overtime',
  'oa.general',
  'oa.budgetAdjustment',
  'oa.expensePlan',
  'oa.training',
  'oa.travel',
  'oa.travelCancellation',
  'oa.loan',
  'oa.reimbursement',
  'oa.payment',
  'oa.probation',
  'oa.supplies',
  'oa.purchase',
  'oa.departure',
  'oa.contract',
  'oa.assetRequest',
  'oa.vendorQualification',
  'oa.vehicleRequest',
  'oa.recruitment',
  'oa.transfer',
  'oa.certificateRequest',
  'oa.sealRequest',
] as const;
export function resolveReassignmentOwners(
  app: Application,
): ReassignmentOwner[] {
  const vendor = app.container.resolve(vendorQualificationServiceToken);
  const contracts = app.container.resolve(contractServiceToken);
  const assets = app.container.resolve(assetRequestServiceToken);
  const vehicles = app.container.resolve(vehicleRequestServiceToken);
  const recruitment = app.container.resolve(recruitmentServiceToken);
  const seals = app.container.resolve(sealRequestServiceToken);
  const certificates = app.container.resolve(certificateRequestServiceToken);
  const transfer = app.container.resolve(transferServiceToken);
  return [
    {
      lifecycle: 'oa.leave',
      ...owner(
        app,
        app.container.resolve(leaveServiceToken),
        'oa.leave',
        'leaveRequests',
      ),
    },
    {
      lifecycle: 'oa.leaveCancellation',
      ...owner(
        app,
        app.container.resolve(cancellationServiceToken),
        'oa.leaveCancellation',
        'leaveCancellations',
      ),
    },
    {
      lifecycle: 'oa.attendanceChange',
      ...owner(
        app,
        app.container.resolve(attendanceChangeServiceToken),
        'oa.attendanceChange',
        'attendanceChangeRequests',
      ),
    },
    {
      lifecycle: 'oa.outing',
      ...owner(
        app,
        app.container.resolve(outingServiceToken),
        'oa.outing',
        'outingRequests',
      ),
    },
    {
      lifecycle: 'oa.overtime',
      ...owner(
        app,
        app.container.resolve(overtimeServiceToken),
        'oa.overtime',
        'overtimeRequests',
      ),
    },
    {
      lifecycle: 'oa.general',
      ...owner(
        app,
        app.container.resolve(generalServiceToken),
        'oa.general',
        'generalRequests',
      ),
    },
    {
      lifecycle: 'oa.budgetAdjustment',
      ...owner(
        app,
        app.container.resolve(budgetAdjustmentServiceToken),
        'oa.budgetAdjustment',
        'budgetAdjustments',
      ),
    },
    {
      lifecycle: 'oa.expensePlan',
      ...owner(
        app,
        app.container.resolve(expensePlanServiceToken),
        'oa.expensePlan',
        'expensePlans',
      ),
    },
    {
      lifecycle: 'oa.training',
      ...owner(
        app,
        app.container.resolve(trainingServiceToken),
        'oa.training',
        'trainingRequests',
      ),
    },
    {
      lifecycle: 'oa.travel',
      ...owner(
        app,
        app.container.resolve(travelServiceToken),
        'oa.travel',
        'travelRequests',
      ),
    },
    {
      lifecycle: 'oa.travelCancellation',
      ...owner(
        app,
        app.container.resolve(travelCancellationServiceToken),
        'oa.travelCancellation',
        'travelCancellations',
      ),
    },
    {
      lifecycle: 'oa.loan',
      ...owner(
        app,
        app.container.resolve(loanRequestServiceToken),
        'oa.loan',
        'loanRequests',
      ),
    },
    {
      lifecycle: 'oa.reimbursement',
      ...owner(
        app,
        app.container.resolve(reimbursementServiceToken),
        'oa.reimbursement',
        'reimbursementRequests',
      ),
    },
    {
      lifecycle: 'oa.payment',
      ...owner(
        app,
        app.container.resolve(paymentRequestServiceToken),
        'oa.payment',
        'paymentRequests',
      ),
    },
    {
      lifecycle: 'oa.probation',
      ...owner(
        app,
        app.container.resolve(probationServiceToken),
        'oa.probation',
        'probationRequests',
      ),
    },
    {
      lifecycle: 'oa.supplies',
      ...owner(
        app,
        app.container.resolve(supplyServiceToken),
        'oa.supplies',
        'supplyRequests',
      ),
    },
    {
      lifecycle: 'oa.purchase',
      ...owner(
        app,
        app.container.resolve(purchaseServiceToken),
        'oa.purchase',
        'purchaseRequests',
      ),
    },
    {
      lifecycle: 'oa.departure',
      ...owner(
        app,
        app.container.resolve(departureServiceToken),
        'oa.departure',
        'departureRequests',
      ),
    },
    {
      lifecycle: 'oa.contract',
      ...owner(
        app,
        {
          approvals: contracts.approvals,
          action: (id, input, actor, policy) =>
            contracts.action(id, actor, input, policy),
        },
        'oa.contract',
        'contractRequests',
      ),
    },
    {
      lifecycle: 'oa.assetRequest',
      ...owner(
        app,
        {
          approvals: assets.approvals,
          action: (id, input, actor, policy) =>
            assets.maintenanceReassign(id, actor, input, policy),
        },
        'oa.assetRequests',
        'assetRequests',
      ),
    },
    {
      lifecycle: 'oa.vendorQualification',
      ...owner(
        app,
        {
          approvals: vendor.approvals,
          action: (id, input, actor, policy) =>
            vendor.action(id, actor, input, policy),
        },
        'oa.vendorQualification',
        'vendorQualifications',
      ),
    },
    {
      lifecycle: 'oa.vehicleRequest',
      ...owner(
        app,
        {
          approvals: vehicles.approvals,
          action: (id, input, actor, policy) =>
            vehicles.action(id, input, actor, {}, policy),
        },
        'oa.vehicleRequests',
        'vehicleRequests',
      ),
    },
    {
      lifecycle: 'oa.recruitment',
      ...owner(
        app,
        {
          approvals: recruitment.approvals,
          action: (id, input, actor, policy) => {
            if (!input.requestId)
              throw new DepartureReassignmentError(
                'REASSIGNMENT_KEY_REQUIRED',
                'Recruitment task reassignment requires its durable request key.',
              );
            return recruitment.action(
              id,
              input,
              {
                actorId: actor,
                requestKey: input.requestId,
                reason: input.comment ?? 'Departure task reassignment',
              },
              policy,
            );
          },
        },
        'oa.recruitment',
        'recruitmentRequests',
      ),
    },
    {
      lifecycle: 'oa.transfer',
      approvals: transfer.approvals,
      action: async (id, input, actorId) => {
        if (!input.requestId)
          throw new DepartureReassignmentError(
            'REASSIGNMENT_KEY_REQUIRED',
            'Transfer task reassignment requires its durable request key.',
          );
        const authz = app.container.resolve(authorizationToken);
        const view = await authorizedViewPolicy(
          authz,
          actorId,
          'oa.transfer',
          'transferRequests',
        );
        const write = await authorizedViewPolicy(
          authz,
          actorId,
          'oa.transfer',
          'transferRequests',
          'operate',
        );
        return transfer.action(
          id,
          input,
          {
            actorId,
            requestKey: input.requestId,
            reason: input.comment ?? 'Departure task reassignment',
          },
          { view, write },
        );
      },
    },
    {
      lifecycle: 'oa.certificateRequest',
      approvals: certificates.approvals,
      action: async (id, input, actorId) => {
        const authz = app.container.resolve(authorizationToken);
        const view = await authorizedViewPolicy(
          authz,
          actorId,
          'oa.certificateRequests',
          'certificateRequests',
        );
        const requests = await authorizedViewPolicy(
          authz,
          actorId,
          'oa.certificateRequests',
          'certificateRequests',
          'operate',
        );
        return certificates.perform(id, actorId, input, {
          requests,
          view,
          issue: requests,
        });
      },
    },
    {
      lifecycle: 'oa.sealRequest',
      approvals: seals.approvals,
      action: async (id, input, actorId) => {
        const authz = app.container.resolve(authorizationToken);
        const view = await authorizedViewPolicy(
          authz,
          actorId,
          'oa.sealRequests',
          'sealRequests',
        );
        const requests = await authorizedViewPolicy(
          authz,
          actorId,
          'oa.sealRequests',
          'sealRequests',
          'operate',
        );
        return seals.perform(id, actorId, input, { requests, view });
      },
    },
  ];
}
export async function authorizedViewPolicy(
  authz: AppAuthorization,
  actorId: string,
  resource: string,
  collection: string,
  action = 'view',
): Promise<RepositoryPolicy> {
  const principal = { type: 'user', id: actorId };
  const subjects = await authz.subjects.resolveFor(principal);
  const decision = await authz.for({ principal, subjects }).authorize({
    resource: { type: 'composite', id: resource },
    action,
  });
  const policy =
    decision.effect === 'deny'
      ? undefined
      : (
          decision.conditions?.database as
            Record<string, RepositoryPolicy | false | undefined> | undefined
        )?.[collection];
  if (!policy)
    throw new DepartureReassignmentError(
      action === 'view'
        ? 'REASSIGNMENT_VIEW_DENIED'
        : 'REASSIGNMENT_OPERATION_DENIED',
      `The fixed administrator has no business ${action} grant.`,
    );
  return policy;
}
function owner(
  app: Application,
  service: Omit<ReassignmentOwner, 'lifecycle' | 'action'> & {
    action(
      recordId: string,
      input: Parameters<ReassignmentOwner['action']>[1],
      actorId: string,
      policy: RepositoryPolicy,
    ): Promise<unknown>;
  },
  resource: string,
  collection: string,
): Omit<ReassignmentOwner, 'lifecycle'> {
  return {
    approvals: service.approvals,
    action: async (id, input, actor) =>
      service.action(
        id,
        input,
        actor,
        await authorizedViewPolicy(
          app.container.resolve(authorizationToken),
          actor,
          resource,
          collection,
        ),
      ),
  };
}
