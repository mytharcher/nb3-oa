import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import type { RequestActionAvailability } from '#components/request-action-definitions';
import { useResource } from '../approvals/use-resource.js';
import type { Options as ContractOptions } from '../contracts/types.js';
import type { Options as AssetRequestOptions } from '../asset-requests/types.js';
import type { QualificationOptions } from '../vendor-qualifications/types.js';
import type { DepartureOptions } from '../departure-requests/types.js';
import type { ProbationOptions } from '../probation-requests/types.js';

/**
 * Which request entries the viewer may start. Capability reads wait for `optionsReady`, so a
 * workbench gives its primary summaries the first read wave.
 */
export function useRequestAvailability(optionsReady: boolean): {
  available: RequestActionAvailability;
  canSubmit: boolean;
} {
  const { session } = useAuthentication();
  const submit = useCan({
    resource: { type: 'composite', id: 'oa.leave' },
    action: 'submit',
  });
  const attendanceSubmit = useCan({
    resource: { type: 'composite', id: 'oa.attendanceChange' },
    action: 'submit',
  });
  const outingSubmit = useCan({
    resource: { type: 'composite', id: 'oa.outing' },
    action: 'submit',
  });
  const expensePlanSubmit = useCan({
    resource: { type: 'composite', id: 'oa.expensePlan' },
    action: 'submit',
  });
  const contractSubmit = useCan({
    resource: { type: 'composite', id: 'oa.contract' },
    action: 'submit',
  });
  const assetSubmit = useCan({
    resource: { type: 'composite', id: 'oa.assetRequests' },
    action: 'create',
  });
  const assetOptions = useResource<AssetRequestOptions>(
    optionsReady &&
      assetSubmit.can &&
      !assetSubmit.isPending &&
      !assetSubmit.error
      ? 'assetRequests/options'
      : null,
    { viewer: session?.user.id ?? '' },
  );
  const contractOptions = useResource<ContractOptions>(
    optionsReady &&
      contractSubmit.can &&
      !contractSubmit.isPending &&
      !contractSubmit.error
      ? 'contractRequests/options'
      : null,
    { viewer: session?.user.id ?? '' },
  );
  const contractCreate =
    contractSubmit.can &&
    !contractSubmit.isPending &&
    !contractSubmit.error &&
    !contractOptions.loading &&
    !contractOptions.error &&
    contractOptions.data?.eligible === true;
  const assetCreate =
    !assetSubmit.isPending &&
    !assetSubmit.error &&
    assetSubmit.can &&
    !assetOptions.loading &&
    !assetOptions.error &&
    assetOptions.data?.eligible === true;
  const vendorSubmit = useCan({
    resource: { type: 'composite', id: 'oa.vendorQualification' },
    action: 'submit',
  });
  const vendorOptions = useResource<QualificationOptions>(
    optionsReady &&
      vendorSubmit.can &&
      !vendorSubmit.isPending &&
      !vendorSubmit.error
      ? 'vendorQualifications/options'
      : null,
    { viewer: session?.user.id ?? '' },
  );
  const vendorCreate =
    !vendorSubmit.isPending &&
    !vendorSubmit.error &&
    vendorSubmit.can &&
    !vendorOptions.loading &&
    !vendorOptions.error &&
    !!(
      vendorOptions.data?.canCreateQualification ||
      vendorOptions.data?.canCreateRemoval
    );
  const departureSubmit = useCan({
    resource: { type: 'composite', id: 'oa.departure' },
    action: 'submit',
  });
  const departureDelegate = useCan({
    resource: { type: 'composite', id: 'oa.departure' },
    action: 'delegate',
  });
  const departureOptions = useResource<DepartureOptions>(
    optionsReady && (departureSubmit.can || departureDelegate.can)
      ? 'departureRequests/options'
      : null,
    { viewer: session?.user.id ?? '' },
  );
  const departureSelf =
    !departureSubmit.isPending &&
    departureSubmit.can &&
    !departureOptions.loading &&
    !departureOptions.error &&
    !!departureOptions.data?.canCreateSelfDraft;
  const departureManual =
    !departureDelegate.isPending &&
    departureDelegate.can &&
    !departureOptions.loading &&
    !departureOptions.error &&
    !!departureOptions.data?.canCreateManualDraft;
  const departureCreate = departureSelf || departureManual;
  // Eight independent capability reads still contend for PG connections. Run
  // two groups of four after the primary summaries, releasing on errors too.
  const secondaryOptionsReady =
    optionsReady &&
    assetOptions.settled &&
    contractOptions.settled &&
    vendorOptions.settled &&
    departureOptions.settled;
  const probationDelegate = useCan({
    resource: { type: 'composite', id: 'oa.probation' },
    action: 'delegate',
  });
  const probationOptions = useResource<ProbationOptions>(
    secondaryOptionsReady && probationDelegate.can
      ? 'probationRequests/options'
      : null,
    { viewer: session?.user.id ?? '' },
  );
  const probationCreate =
    !probationDelegate.isPending &&
    probationDelegate.can &&
    !probationOptions.loading &&
    !probationOptions.error &&
    !!probationOptions.data?.canCreateManualDraft;
  const paymentSubmit = useCan({
    resource: { type: 'composite', id: 'oa.payment' },
    action: 'submit',
  });

  const loanSubmit = useCan({
    resource: { type: 'composite', id: 'oa.loan' },
    action: 'submit',
  });

  const purchaseSubmit = useCan({
    resource: { type: 'composite', id: 'oa.purchase' },
    action: 'submit',
  });
  const reimbursementSubmit = useCan({
    resource: { type: 'composite', id: 'oa.reimbursement' },
    action: 'submit',
  });
  const travelSubmit = useCan({
    resource: { type: 'composite', id: 'oa.travel' },
    action: 'submit',
  });
  const travelCancellationSubmit = useCan({
    resource: { type: 'composite', id: 'oa.travelCancellation' },
    action: 'submit',
  });
  const trainingSubmit = useCan({
    resource: { type: 'composite', id: 'oa.training' },
    action: 'submit',
  });
  const budgetSubmit = useCan({
    resource: { type: 'composite', id: 'oa.budgetAdjustment' },
    action: 'submit',
  });
  const supplySubmit = useCan({
    resource: { type: 'composite', id: 'oa.supplies' },
    action: 'submit',
  });
  const generalSubmit = useCan({
    resource: { type: 'composite', id: 'oa.general' },
    action: 'submit',
  });
  const overtimeSubmit = useCan({
    resource: { type: 'composite', id: 'oa.overtime' },
    action: 'submit',
  });
  const cancellationSubmit = useCan({
    resource: { type: 'composite', id: 'oa.leaveCancellation' },
    action: 'submit',
  });
  const transferPermission = useCan({
    resource: { type: 'composite', id: 'oa.transfer' },
    action: 'submit',
  });
  const transferOptions = useResource<{ canCreateAsHR: boolean }>(
    transferPermission.can &&
      secondaryOptionsReady &&
      !transferPermission.isPending &&
      !transferPermission.error
      ? 'transferRequests/capabilities'
      : null,
  );
  const transferCreate =
    transferPermission.can &&
    !transferPermission.isPending &&
    !transferPermission.error &&
    !transferOptions.loading &&
    !transferOptions.error &&
    transferOptions.data?.canCreateAsHR === true;
  const recruitmentPermission = useCan({
    resource: { type: 'composite', id: 'oa.recruitment' },
    action: 'submit',
  });
  const recruitmentOptions = useResource<{ canCreate: boolean }>(
    recruitmentPermission.can &&
      secondaryOptionsReady &&
      !recruitmentPermission.isPending &&
      !recruitmentPermission.error
      ? 'recruitmentRequests/createOptions'
      : null,
  );
  const recruitmentCreate =
    recruitmentPermission.can &&
    !recruitmentPermission.isPending &&
    !recruitmentPermission.error &&
    !recruitmentOptions.loading &&
    !recruitmentOptions.error &&
    recruitmentOptions.data?.canCreate === true;
  const vehiclePermission = useCan({
    resource: { type: 'composite', id: 'oa.vehicleRequests' },
    action: 'submit',
  });
  const vehicleView = useCan({
    resource: { type: 'composite', id: 'oa.vehicleRequests' },
    action: 'view',
  });
  const vehicleOptions = useResource<{ canCreate: boolean }>(
    vehiclePermission.can &&
      secondaryOptionsReady &&
      !vehiclePermission.isPending &&
      !vehiclePermission.error &&
      vehicleView.can &&
      !vehicleView.isPending &&
      !vehicleView.error
      ? 'vehicleBrowser/options'
      : null,
  );
  const vehicleCreate =
    vehiclePermission.can &&
    !vehiclePermission.isPending &&
    !vehiclePermission.error &&
    !vehicleOptions.loading &&
    !vehicleOptions.error &&
    vehicleOptions.data?.canCreate === true;
  const sealPermission = useCan({
    resource: { type: 'composite', id: 'oa.sealRequests' },
    action: 'create',
  });
  const sealCreate =
    sealPermission.can && !sealPermission.isPending && !sealPermission.error;
  const certificatePermission = useCan({
    resource: { type: 'composite', id: 'oa.certificateRequests' },
    action: 'create',
  });
  const certificateCreate =
    certificatePermission.can &&
    !certificatePermission.isPending &&
    !certificatePermission.error;
  const repairPermission = useCan({
    resource: { type: 'composite', id: 'oa.itRepairs' },
    action: 'create',
  });
  const repairCreate =
    repairPermission.can &&
    !repairPermission.isPending &&
    !repairPermission.error;
  const canSubmit =
    repairCreate ||
    vehicleCreate ||
    recruitmentCreate ||
    sealCreate ||
    transferCreate ||
    certificateCreate ||
    contractCreate ||
    assetCreate ||
    vendorCreate ||
    probationCreate ||
    departureCreate ||
    (!submit.isPending && submit.can) ||
    (!attendanceSubmit.isPending && attendanceSubmit.can) ||
    (!outingSubmit.isPending && outingSubmit.can) ||
    (!generalSubmit.isPending && generalSubmit.can) ||
    (!expensePlanSubmit.isPending && expensePlanSubmit.can) ||
    (!trainingSubmit.isPending && trainingSubmit.can) ||
    (!paymentSubmit.isPending && paymentSubmit.can) ||
    (!loanSubmit.isPending && loanSubmit.can) ||
    (!purchaseSubmit.isPending && purchaseSubmit.can) ||
    (!reimbursementSubmit.isPending && reimbursementSubmit.can) ||
    (!travelSubmit.isPending && travelSubmit.can) ||
    (!travelCancellationSubmit.isPending && travelCancellationSubmit.can) ||
    (!budgetSubmit.isPending && budgetSubmit.can) ||
    (!supplySubmit.isPending && supplySubmit.can) ||
    (!overtimeSubmit.isPending && overtimeSubmit.can) ||
    (!cancellationSubmit.isPending && cancellationSubmit.can);
  const ready = (grant: { can: boolean; isPending: boolean }) =>
    !grant.isPending && grant.can;
  return {
    canSubmit,
    available: {
      itRepair: repairCreate,
      vehicle: vehicleCreate,
      recruitment: recruitmentCreate,
      seal: sealCreate,
      transfer: transferCreate,
      certificate: certificateCreate,
      attendance: ready(attendanceSubmit),
      outing: ready(outingSubmit),
      general: ready(generalSubmit),
      leave: ready(submit),
      overtime: ready(overtimeSubmit),
      cancellation: ready(cancellationSubmit),
      expensePlan: ready(expensePlanSubmit),
      contract: contractCreate,
      asset: assetCreate,
      vendor: vendorCreate,
      departure: departureCreate,
      probation: probationCreate,
      payment: ready(paymentSubmit),
      loan: ready(loanSubmit),
      purchase: ready(purchaseSubmit),
      reimbursement: ready(reimbursementSubmit),
      travel: ready(travelSubmit),
      travelCancellation: ready(travelCancellationSubmit),
      training: ready(trainingSubmit),
      budget: ready(budgetSubmit),
      supplies: ready(supplySubmit),
    },
  };
}
