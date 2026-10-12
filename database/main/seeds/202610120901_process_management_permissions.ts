import { defineSeed } from '@nocobase/db';
import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
export default defineSeed({
  name: '202610120901_process_management_permissions',
  async run({ query }) {
    // Prepared, editable jobs. No invented recipients and no default employee assignment.
    const kinds = [
      'oa.leave',
      'oa.overtime',
      'oa.leaveCancellation',
      'oa.general',
      'oa.attendanceChange',
      'oa.outing',
      'oa.supplies',
      'oa.budgetAdjustment',
      'oa.expensePlan',
      'oa.training',
      'oa.travel',
      'oa.travelCancellation',
      'oa.reimbursement',
      'oa.purchase',
      'oa.loan',
      'oa.payment',
      'oa.probation',
      'oa.vehicleRequest',
      'oa.contract',
      'oa.assetRequest',
      'oa.vendorQualification',
      'oa.recruitment',
      'oa.sealRequest',
      'oa.transfer',
      'oa.departure',
      'oa.certificateRequest',
    ];
    for (const kind of kinds) {
      const slug = kind.slice(3),
        key = `oa-process-manager-${slug}`;
      if (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('id')
          .where('key', '=', key)
          .executeTakeFirst()
      )
        continue;
      const actions: PermissionGrant['actions'] = [
        'definitionRead',
        'historyRead',
        'appoint',
        'reassign',
        'terminate',
      ].map((action) => ({
        action,
        policy: {
          type: 'composite',
          scopes: { [collections[kind]!]: 'allRecords' },
        },
      }));
      const now = new Date();
      const grants: PermissionGrant[] = [
        {
          resource: { type: 'page', id: 'oa.processManagement' },
          actions: [{ action: 'access' }],
        },
        {
          resource: { type: 'composite', id: `oa.processManagement.${slug}` },
          actions,
        },
      ];
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: key,
          key,
          title: encodeAuthorizationTitle({
            key: `processManagement.kinds.${slug}`,
            ns: 'nb3-oa',
          }),
          grants: JSON.stringify(grants),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
  },
});
const collections: Record<string, string> = {
  'oa.leave': 'leaveRequests',
  'oa.overtime': 'overtimeRequests',
  'oa.leaveCancellation': 'leaveCancellations',
  'oa.general': 'generalRequests',
  'oa.attendanceChange': 'attendanceChangeRequests',
  'oa.outing': 'outingRequests',
  'oa.supplies': 'supplyRequests',
  'oa.budgetAdjustment': 'budgetAdjustments',
  'oa.expensePlan': 'expensePlans',
  'oa.training': 'trainingRequests',
  'oa.travel': 'travelRequests',
  'oa.travelCancellation': 'travelCancellations',
  'oa.reimbursement': 'reimbursementRequests',
  'oa.purchase': 'purchaseRequests',
  'oa.loan': 'loanRequests',
  'oa.payment': 'paymentRequests',
  'oa.probation': 'probationRequests',
  'oa.vehicleRequest': 'vehicleRequests',
  'oa.contract': 'contractRequests',
  'oa.assetRequest': 'assetRequests',
  'oa.vendorQualification': 'vendorQualifications',
  'oa.recruitment': 'recruitmentRequests',
  'oa.sealRequest': 'sealRequests',
  'oa.transfer': 'transferRequests',
  'oa.departure': 'departureRequests',
  'oa.certificateRequest': 'certificateRequests',
};
