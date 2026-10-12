// Display-only descriptions audited against the owning route selectors. This registry
// never evaluates a route or reads private records; thresholds refer to submission snapshots.
const conditions: Record<string, Record<string, string>> = {
  'oa.travelCancellation/managerApproved': {
    unbooking: 'travelCancellation_unbooking',
    approved: 'travelCancellation_approved',
  },
  'oa.reimbursement/managerApproved': {
    head: 'reimbursement_managerApproved_head',
    finance: 'reimbursement_managerApproved_finance',
  },
  'oa.reimbursement/financeApproved': {
    executive: 'loan_financeApproved_executive',
    gm: 'loan_financeApproved_gm',
    cashier: 'loan_financeApproved_cashier',
  },
  'oa.reimbursement/executiveApproved': {
    gm: 'loan_executiveApproved_gm',
    cashier: 'loan_executiveApproved_cashier',
  },
  'oa.training/managerApproved': {
    head: 'training_managerApproved_head',
    finance: 'training_managerApproved_finance',
    approved: 'training_managerApproved_approved',
  },
  'oa.training/financeApproved': {
    executive: 'expensePlan_financeApproved_executive',
    gm: 'expensePlan_financeApproved_gm',
    approved: 'expensePlan_financeApproved_approved',
  },
  'oa.training/executiveApproved': {
    gm: 'expensePlan_executiveApproved_gm',
    approved: 'expensePlan_executiveApproved_approved',
  },
  'oa.travel/managerApproved': {
    head: 'travel_managerApproved_head',
    finance: 'travel_managerApproved_finance',
  },
  'oa.probation/managerApproved': {
    head: 'probation_managerApproved_head',
    hr: 'probation_managerApproved_hr',
  },
  'oa.departure/managerApproved': {
    head: 'departure_managerApproved_head',
    hr: 'departure_managerApproved_hr',
  },
  'oa.expensePlan/financeApproved': {
    executive: 'expensePlan_financeApproved_executive',
    gm: 'expensePlan_financeApproved_gm',
    approved: 'expensePlan_financeApproved_approved',
  },
  'oa.expensePlan/executiveApproved': {
    gm: 'expensePlan_executiveApproved_gm',
    approved: 'expensePlan_executiveApproved_approved',
  },
  'oa.loan/financeApproved': {
    executive: 'loan_financeApproved_executive',
    gm: 'loan_financeApproved_gm',
    cashier: 'loan_financeApproved_cashier',
  },
  'oa.loan/executiveApproved': {
    gm: 'loan_executiveApproved_gm',
    cashier: 'loan_executiveApproved_cashier',
  },
  'oa.purchase/financeApproved': {
    executive: 'purchase_financeApproved_executive',
    gm: 'purchase_financeApproved_gm',
    approved: 'purchase_financeApproved_approved',
  },
  'oa.purchase/executiveApproved': {
    gm: 'purchase_executiveApproved_gm',
    approved: 'purchase_executiveApproved_approved',
  },
  'oa.payment/financeApproved': {
    executive: 'payment_financeApproved_executive',
    gm: 'payment_financeApproved_gm',
    cashier: 'payment_financeApproved_cashier',
  },
  'oa.payment/executiveApproved': {
    gm: 'payment_executiveApproved_gm',
    cashier: 'payment_executiveApproved_cashier',
  },
  'oa.travel/financeApproved': {
    executive: 'travel_financeApproved_executive',
    gm: 'travel_financeApproved_gm',
    booking: 'travel_financeApproved_booking',
    completed: 'travel_financeApproved_completed',
  },
  'oa.travel/executiveApproved': {
    gm: 'travel_executiveApproved_gm',
    booking: 'travel_executiveApproved_booking',
    completed: 'travel_executiveApproved_completed',
  },
  'oa.travel/gmApproved': {
    booking: 'travel_gmApproved_booking',
    completed: 'travel_gmApproved_completed',
  },
  'oa.payment/submit': {
    head: 'payment_submit_head',
    finance: 'payment_submit_finance',
  },
  'oa.budgetAdjustment/cfoApproved': {
    gm: 'budgetAdjustment_cfoApproved_gm',
    approved: 'budgetAdjustment_cfoApproved_approved',
  },
  'oa.leave/managerApproved': {
    head: 'leave_managerApproved_head',
    hr: 'leave_managerApproved_hr',
    approved: 'leave_managerApproved_approved',
  },
  'oa.leave/headApproved': {
    hr: 'leave_headApproved_hr',
    approved: 'leave_headApproved_approved',
  },
  'oa.overtime/managerApproved': {
    head: 'overtime_managerApproved_head',
    hr: 'overtime_managerApproved_hr',
    approved: 'overtime_managerApproved_approved',
  },
  'oa.overtime/headApproved': {
    hr: 'overtime_headApproved_hr',
    approved: 'overtime_headApproved_approved',
  },
  'oa.supplies/submit': {
    issuing: 'supplies_submit_issuing',
    manager: 'supplies_submit_manager',
  },
  'oa.vehicleRequest/submit': {
    dispatch: 'vehicleRequest_submit_dispatch',
    head: 'vehicleRequest_submit_head',
  },
  'oa.purchase/submit': {
    purchasing: 'purchase_submit_purchasing',
    head: 'purchase_submit_head',
  },
  'oa.assetRequest/submit': {
    issuing: 'assetRequest_submit_issuing',
    head: 'assetRequest_submit_head',
  },
  'oa.sealRequest/submit': {
    stamping: 'sealRequest_submit_stamping',
    head: 'sealRequest_submit_head',
  },
  'oa.purchase/priced': {
    revision: 'purchase_priced_revision',
    finance: 'purchase_priced_finance',
  },
  'oa.purchase/forcedPriced': {
    revision: 'purchase_forcedPriced_revision',
    finance: 'purchase_forcedPriced_finance',
  },
  'oa.probation/hrApproved': {
    gm: 'probation_hrApproved_gm',
    approved: 'probation_hrApproved_approved',
  },
  'oa.departure/hrApproved': {
    gm: 'departure_hrApproved_gm',
    handover: 'departure_hrApproved_handover',
  },
  'oa.departure/cancellationRejected': {
    gm: 'departure_cancellationRejected_gm',
    handover: 'departure_cancellationRejected_handover',
    completed: 'departure_cancellationRejected_completed',
  },
  'oa.recruitment/submit': {
    head: 'recruitment_submit_head',
    hrbp: 'recruitment_submit_hrbp',
  },
  'oa.recruitment/reviewEdit': {
    head: 'recruitment_reviewEdit_head',
    hrbp: 'recruitment_reviewEdit_hrbp',
  },
  'oa.recruitment/hrDirectorApproved': {
    executive: 'recruitment_hrDirectorApproved_executive',
    gm: 'recruitment_hrDirectorApproved_gm',
    approved: 'recruitment_hrDirectorApproved_approved',
  },
  'oa.recruitment/executiveApproved': {
    gm: 'recruitment_executiveApproved_gm',
    approved: 'recruitment_executiveApproved_approved',
  },
  'oa.transfer/submit': {
    manager: 'transfer_submit_manager',
    sourceHead: 'transfer_submit_sourceHead',
  },
  'oa.transfer/reviewEdit': {
    manager: 'transfer_reviewEdit_manager',
    sourceHead: 'transfer_reviewEdit_sourceHead',
  },
  'oa.transfer/sourceHeadApproved': {
    targetHead: 'transfer_sourceHeadApproved_targetHead',
    hr: 'transfer_sourceHeadApproved_hr',
  },
  'oa.transfer/hrApproved': {
    executive: 'transfer_hrApproved_executive',
    gm: 'transfer_hrApproved_gm',
    pendingEffective: 'transfer_hrApproved_pendingEffective',
  },
  'oa.transfer/executiveApproved': {
    gm: 'transfer_executiveApproved_gm',
    pendingEffective: 'transfer_executiveApproved_pendingEffective',
  },
  'oa.assetRequest/headApproved': {
    appraisal: 'assetRequest_headApproved_appraisal',
    issuing: 'assetRequest_headApproved_issuing',
  },
  'oa.assetRequest/financeApproved': {
    gm: 'assetRequest_financeApproved_gm',
    scrapped: 'assetRequest_financeApproved_scrapped',
  },
  'oa.assetRequest/issueCompleted': {
    returning: 'assetRequest_issueCompleted_returning',
    issued: 'assetRequest_issueCompleted_issued',
  },
  'oa.sealRequest/stamped': {
    returning: 'sealRequest_stamped_returning',
    completed: 'sealRequest_stamped_completed',
  },
  'oa.vendorQualification/submit': {
    removalReview: 'vendorQualification_submit_removalReview',
    purchasing: 'vendorQualification_submit_purchasing',
  },
  'oa.contract/headApproved': {
    legalFinance: 'contract_headApproved_legalFinance',
    standardFinance: 'contract_headApproved_standardFinance',
  },
  'oa.contract/legalFinanceApproved': {
    executive: 'contract_legalFinanceApproved_executive',
    gm: 'contract_legalFinanceApproved_gm',
    approved: 'contract_legalFinanceApproved_approved',
  },
  'oa.contract/standardFinanceApproved': {
    executive: 'contract_standardFinanceApproved_executive',
    gm: 'contract_standardFinanceApproved_gm',
    approved: 'contract_standardFinanceApproved_approved',
  },
  'oa.contract/executiveApproved': {
    gm: 'contract_executiveApproved_gm',
    approved: 'contract_executiveApproved_approved',
  },
};
export function branchConditions(
  kind: string,
  name: string,
  from: readonly string[],
  to: readonly string[],
): Record<string, string> {
  const declared = conditions[`${kind}/${name}`];
  if (declared)
    return Object.fromEntries(
      Object.entries(declared).filter(([target]) => to.includes(target)),
    );
  if (kind === 'oa.vendorQualification' && name === 'purchasingApproved')
    return Object.fromEntries(to.map((target) => [target, 'committeeVersion']));
  if (kind === 'oa.recruitment' && name.endsWith('Returned'))
    return Object.fromEntries(
      to.map((target) => [
        target,
        target === 'revision' ? 'returnApplicant' : 'returnEarlier',
      ]),
    );
  if (kind === 'oa.sealRequest' && name.endsWith('Approved')) {
    const stage = from[0];
    const reachable =
      stage === 'head'
        ? ['legal', 'financeManager', 'gm', 'stamping']
        : stage === 'legal'
          ? ['financeManager', 'gm', 'stamping']
          : stage === 'financeManager'
            ? ['gm', 'stamping']
            : ['stamping'];
    return Object.fromEntries(
      reachable
        .filter((target) => to.includes(target))
        .map((target) => [target, `seal_${target}`]),
    );
  }
  return {};
}
