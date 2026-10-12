import { defineSeed } from '@nocobase/db';
import type { PermissionGrant } from '@nocobase/authorization/core';

/** Tighten only the template's inherited employee bank grants; retain explicit finance grants and custom policies. */
export default defineSeed({
  name: '202610102312_loan_owned_payment_access',
  async run({ query }) {
    for (const key of ['oa-loan-request-employee', 'oa-loan-request-hr']) {
      const row = await query
        .selectFrom('authorizationPermissionSets')
        .select(['id', 'grants'])
        .where('key', '=', key)
        .executeTakeFirst();
      if (!row) continue;
      const grants = JSON.parse(String(row.grants)) as PermissionGrant[];
      let changed = false;
      for (const grant of grants) {
        if (
          grant.resource.type !== 'composite' ||
          grant.resource.id !== 'oa.loan'
        )
          continue;
        for (const action of grant.actions) {
          if (
            action.action !== 'payment' ||
            action.policy?.type !== 'composite' ||
            !action.policy.scopes ||
            typeof action.policy.scopes !== 'object' ||
            !('loanRequests' in action.policy.scopes) ||
            action.policy.scopes.loanRequests !== 'allRecords'
          )
            continue;
          action.policy = {
            ...action.policy,
            scopes: { ...action.policy.scopes, loanRequests: 'oa.loanOwned' },
          };
          changed = true;
        }
      }
      if (changed)
        await query
          .updateTable('authorizationPermissionSets')
          .set({ grants: JSON.stringify(grants), updatedAt: new Date() })
          .where('id', '=', row.id)
          .execute();
    }
  },
});
